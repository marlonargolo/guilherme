import json
from django.http import JsonResponse, HttpResponse
from django.views.decorators.csrf import csrf_exempt
from django.contrib.auth.decorators import login_required
from django.shortcuts import render, redirect, get_object_or_404
from django.contrib.auth import login, authenticate, logout
from django.contrib.auth.forms import UserCreationForm
from django.contrib import messages
from django.views import View
from openai import OpenAI
import requests
import mercadopago
from .models import Mensagem
from decouple import config
from .models import *
from .forms import *

import logging
logger = logging.getLogger(__name__)



# Configurações
WHATSAPP_API_URL = "https://graph.facebook.com/v17.0/{phone_number_id}/messages"
MP_ACCESS_TOKEN = config('MP_ACCESS_TOKEN')
MP_PUBLIC_KEY = config('MP_PUBLIC_KEY')
OPENAI_API_KEY = config('OPENAI_API_KEY')

mp = mercadopago.SDK(MP_ACCESS_TOKEN)
client = OpenAI(api_key=OPENAI_API_KEY)

# Views de Autenticação
def register(request):
    if request.method == 'POST':
        form = UserRegistrationForm(request.POST)
        if form.is_valid():
            user = form.save()
            tipo = form.cleaned_data.get('tipo')
            telefone = form.cleaned_data.get('telefone')
            
            Perfil.objects.create(
                user=user,
                tipo=tipo,
                telefone=telefone
            )
            
            if tipo == 'prestador':
                Prestador.objects.create(perfil=user.perfil)
            else:
                Cliente.objects.create(perfil=user.perfil)
            
            login(request, user)
            return redirect('dashboard')
    else:
        form = UserRegistrationForm()
    return render(request, 'core/register.html', {'form': form})

@login_required
def dashboard(request):
    context = {}
    if request.user.perfil.tipo == 'prestador':
        prestador = request.user.perfil.prestador
        servicos = Servico.objects.filter(prestador=prestador).order_by('-criado_em')[:5]
        context['servicos'] = servicos
    else:
        cliente = request.user.perfil.cliente
        servicos = Servico.objects.filter(cliente=cliente).order_by('-criado_em')[:5]
        context['servicos'] = servicos
    return render(request, 'core/dashboard.html', context)

# Views de WhatsApp
@csrf_exempt
def whatsapp_webhook(request, user_id):
    if request.method == 'GET':
        verify_token = request.GET.get('hub.verify_token')
        challenge = request.GET.get('hub.challenge')
        
        user_token = get_object_or_404(UserToken, user_id=user_id)
        
        if verify_token == user_token.verify_token:
            return HttpResponse(challenge, content_type='text/plain', status=200)
        return HttpResponse("Erro de verificação do token.", content_type='text/plain', status=403)
    
    elif request.method == 'POST':
        try:
            # Verificação inicial do payload
            if not request.body:
                return JsonResponse({'status': 'error', 'message': 'Empty request body'}, status=400)
            
            data = json.loads(request.body.decode('utf-8'))
            
            # Validação da estrutura do webhook
            if not all(key in data for key in ['object', 'entry']):
                return JsonResponse({'status': 'error', 'message': 'Invalid webhook structure'}, status=400)
            
            entry = data['entry'][0]
            if 'changes' not in entry:
                return JsonResponse({'status': 'ignored', 'message': 'No changes in entry'}, status=200)
                
            change = entry['changes'][0]
            value = change.get('value', {})
            
            # Verifica se é uma mensagem
            if 'messages' not in value:
                return JsonResponse({'status': 'ignored', 'message': 'No messages in payload'}, status=200)
            
            message = value['messages'][0]
            from_number = message.get('from')
            message_body = message.get('text', {}).get('body')
            
            if not from_number or not message_body:
                return JsonResponse({'status': 'error', 'message': 'Missing required fields'}, status=400)
            
            user = get_object_or_404(User, id=user_id)
            
            # Processa a mensagem
            response = process_whatsapp_message(user, from_number, message_body)
            
            # Registra a mensagem recebida
            Mensagem.objects.create(
                user=user,
                phone_number=from_number,
                body=message_body,
                direction='received'
            )
            
            # Registra a resposta
            Mensagem.objects.create(
                user=user,
                phone_number=from_number,
                body=response,
                direction='sent'
            )
            
            # Envia a resposta
            user_token = get_object_or_404(UserToken, user=user)
            if not send_whatsapp_message(from_number, response, user_token.access_token, user_token.phone_number):
                return JsonResponse({'status': 'error', 'message': 'Failed to send WhatsApp message'}, status=500)
            
            return JsonResponse({'status': 'success'})
            
        except json.JSONDecodeError:
            return JsonResponse({'status': 'error', 'message': 'Invalid JSON'}, status=400)
        except Exception as e:
            logger.error(f"Error processing webhook: {str(e)}")
            return JsonResponse({'status': 'error', 'message': 'Internal server error'}, status=500)

def criar_novo_perfil(telefone, tipo):
    novo_user = User.objects.create_user(
        username=f"user_{telefone}",
        password=User.objects.make_random_password()
    )
    
    Perfil.objects.create(
        user=novo_user,
        tipo=tipo,
        telefone=telefone
    )
    
    if tipo == 'cliente':
        Cliente.objects.create(perfil=novo_user.perfil)
        return "Cadastro como cliente realizado! Como posso ajudar?"
    else:
        Prestador.objects.create(perfil=novo_user.perfil)
        return "Cadastro como prestador realizado! Como posso ajudar?"

def mensagem_boas_vindas():
    return ("Olá! Parece que você é novo por aqui.\n"
           "Você é um:\n"
           "1. Cliente buscando serviços\n"
           "2. Prestador oferecendo serviços\n\n"
           "Responda com o número da opção ou digite 'cliente'/'prestador'")

def process_whatsapp_message(user, from_number, message_body):
    try:
        # Check if we have conversation history
        conversa, created = Conversa.objects.get_or_create(
            user=user,
            telefone=from_number,
            defaults={'etapa': 'inicio', 'dados': {}}
        )
        
        # Get user profile if exists
        try:
            perfil = Perfil.objects.get(telefone=from_number)
            is_new_user = False
        except Perfil.DoesNotExist:
            is_new_user = True
        
        # For new users, handle the onboarding flow
        if is_new_user:
            return handle_new_user_flow(from_number, message_body, conversa)
        
        # For existing users, get relevant data and generate response
        if perfil.tipo == 'cliente':
            context = get_cliente_context(perfil.cliente)
        else:
            context = get_prestador_context(perfil.prestador)
        
        # Prepare prompt for ChatGPT
        prompt = f"""
        Usuário: {message_body}
        
        Contexto:
        - Tipo de usuário: {perfil.tipo}
        - Dados relevantes: {json.dumps(context, ensure_ascii=False)}
        
        Responda de forma humanizada, amigável e sucinta em português brasileiro.
        """
        
        # Get ChatGPT response
        response = get_chatgpt_response(user, prompt)
        
        # Update conversation
        conversa.dados['last_interaction'] = timezone.now().isoformat()
        conversa.save()
        
        return response
    
    except Exception as e:
        logger.error(f"Error processing message: {str(e)}")
        return "Desculpe, ocorreu um erro ao processar sua mensagem."

def get_cliente_context(cliente):
    # Get relevant data for client
    servicos = Servico.objects.filter(cliente=cliente).order_by('-criado_em')[:3]
    interesses = cliente.interesses.all()
    regioes = cliente.regioes.all()
    
    return {
        'servicos_recentes': [{
            'id': s.id,
            'especialidade': s.especialidade.nome,
            'status': s.status,
            'data': s.data_servico.strftime('%d/%m/%Y')
        } for s in servicos],
        'interesses': [i.nome for i in interesses],
        'regioes': [str(r) for r in regioes]
    }

def get_prestador_context(prestador):
    # Get relevant data for service provider
    servicos = Servico.objects.filter(prestador=prestador).order_by('-criado_em')[:3]
    especialidades = prestador.especialidades.all()
    regioes = prestador.regioes.all()
    
    return {
        'servicos_recentes': [{
            'id': s.id,
            'especialidade': s.especialidade.nome,
            'status': s.status,
            'data': s.data_servico.strftime('%d/%m/%Y')
        } for s in servicos],
        'especialidades': [e.nome for e in especialidades],
        'regioes': [str(r) for r in regioes],
        'disponibilidade': prestador.disponibilidade,
        'avaliacao': prestador.avaliacao
    }

from django.contrib.auth.hashers import make_password
import secrets
import string

def generate_random_password(length=12):
    """Gera uma senha aleatória segura"""
    alphabet = string.ascii_letters + string.digits + "!@#$%^&*"
    return ''.join(secrets.choice(alphabet) for _ in range(length))

def handle_new_user_flow(from_number, message_body, conversa):
    lower_msg = message_body.lower().strip()
    
    if conversa.etapa == 'inicio':
        if any(palavra in lower_msg for palavra in ['cliente', '1', 'preciso de serviço']):
            conversa.etapa = 'cadastrando_cliente'
            conversa.save()
            return ("Ótimo! Vou te cadastrar como cliente. Qual tipo de serviço você geralmente precisa?\n"
                   "Exemplos: pedreiro, pintor, eletricista, encanador, diarista")
        
        elif any(palavra in lower_msg for palavra in ['prestador', '2', 'ofereço serviço']):
            conversa.etapa = 'cadastrando_prestador'
            conversa.save()
            return ("Ótimo! Vou te cadastrar como prestador. Qual sua especialidade principal?\n"
                   "Exemplos: pedreiro, pintor, eletricista, encanador, diarista")
        
        return mensagem_boas_vindas()
    
    elif conversa.etapa in ['cadastrando_cliente', 'cadastrando_prestador']:
        especialidade = extract_especialidade(message_body)
        if not especialidade:
            return ("Não consegui identificar a especialidade. Poderia informar novamente?\n"
                   "Exemplos: pedreiro, pintor, eletricista, encanador, diarista")
        
        # Criação do usuário com senha aleatória - FORMA CORRIGIDA
        try:
            password = generate_random_password()
            novo_user = User.objects.create_user(
                username=from_number,
                password=password
            )
            
            tipo = 'cliente' if conversa.etapa == 'cadastrando_cliente' else 'prestador'
            
            perfil = Perfil.objects.create(
                user=novo_user,
                tipo=tipo,
                telefone=from_number
            )
            
            if tipo == 'cliente':
                Cliente.objects.create(perfil=perfil)
            else:
                Prestador.objects.create(perfil=perfil)
            
            # Tenta associar a especialidade
            esp_obj, created = Especialidade.objects.get_or_create(
                nome__iexact=especialidade,
                defaults={'nome': especialidade.capitalize()}
            )
            
            if tipo == 'cliente':
                perfil.cliente.interesses.add(esp_obj)
            else:
                perfil.prestador.especialidades.add(esp_obj)
            
            conversa.etapa = 'cadastrado'
            conversa.user = novo_user
            conversa.save()
            
            return (f"Cadastro como {tipo} concluído! Especialidade: {esp_obj.nome}\n"
                    "Como posso ajudar você hoje?")
            
        except Exception as e:
            logger.error(f"Erro ao criar usuário: {str(e)}")
            return "Ocorreu um erro ao processar seu cadastro. Por favor, tente novamente mais tarde."

def handle_cliente_message(cliente, message):
    # Get relevant context
    context = get_cliente_context(cliente)
    
    # Prepare prompt for ChatGPT
    prompt = f"""
    Cliente {cliente.perfil.user.get_full_name()} enviou mensagem:
    "{message}"
    
    Contexto:
    - Serviços recentes: {context['servicos_recentes']}
    - Interesses: {context['interesses']}
    - Regiões: {context['regioes']}
    
    Responda de forma útil e humanizada, considerando o histórico do cliente.
    """
    
    return get_chatgpt_response(cliente.perfil.user, prompt)

def handle_prestador_message(prestador, message):
    # Get relevant context
    context = get_prestador_context(prestador)
    
    # Prepare prompt for ChatGPT
    prompt = f"""
    Prestador {prestador.perfil.user.get_full_name()} enviou mensagem:
    "{message}"
    
    Contexto:
    - Serviços recentes: {context['servicos_recentes']}
    - Especialidades: {context['especialidades']}
    - Regiões atendidas: {context['regioes']}
    - Disponibilidade: {context['disponibilidade']}
    - Avaliação: {context['avaliacao']}
    
    Responda de forma útil e humanizada, considerando o perfil do prestador.
    """
    
    return get_chatgpt_response(prestador.perfil.user, prompt)

# Views de Serviços
@login_required
def solicitar_servico(request):
    if request.method == 'POST':
        form = ServicoForm(request.user, request.POST)
        if form.is_valid():
            servico = form.save(commit=False)
            servico.cliente = request.user.perfil.cliente
            servico.save()
            
            # Encontrar prestadores compatíveis
            prestadores = find_prestadores(
                servico.especialidade,
                servico.regiao
            )
            
            # Notificar prestadores (simplificado)
            for p in prestadores[:5]:
                Mensagem.objects.create(
                    remetente=request.user,
                    destinatario=p.perfil.user,
                    conteudo=f"Novo serviço disponível: {servico.descricao}"
                )
            
            messages.success(request, "Serviço solicitado com sucesso!")
            return redirect('dashboard')
    else:
        form = ServicoForm(request.user)
    return render(request, 'core/solicitar_servico.html', {'form': form})

@login_required
def aceitar_servico(request, servico_id):
    servico = get_object_or_404(Servico, id=servico_id, prestador=request.user.perfil.prestador)
    servico.status = 'aceito'
    servico.save()
    
    # Criar link de pagamento no Mercado Pago
    preference_data = {
        "items": [
            {
                "title": f"Serviço de {servico.especialidade}",
                "quantity": 1,
                "unit_price": float(servico.valor_acordado),
            }
        ],
        "payer": {
            "name": servico.cliente.perfil.user.get_full_name(),
            "email": servico.cliente.perfil.user.email,
        },
        "back_urls": {
            "success": request.build_absolute_uri('/pagamento/sucesso/'),
            "failure": request.build_absolute_uri('/pagamento/falha/'),
            "pending": request.build_absolute_uri('/pagamento/pendente/'),
        },
        "auto_return": "approved",
    }
    
    preference = mp.preference().create(preference_data)
    servico.link_pagamento = preference["response"]["init_point"]
    servico.save()
    
    # Notificar cliente
    Mensagem.objects.create(
        remetente=request.user,
        destinatario=servico.cliente.perfil.user,
        conteudo=f"Seu serviço foi aceito! Pagamento: {servico.link_pagamento}"
    )
    
    messages.success(request, "Serviço aceito e cliente notificado!")
    return redirect('dashboard')

# Views de Configuração
@login_required
def configurar_whatsapp(request):
    if request.method == 'POST':
        form = WhatsAppConfigForm(request.POST, instance=request.user.usertoken)
        if form.is_valid():
            form.save()
            messages.success(request, "Configurações do WhatsApp atualizadas!")
            return redirect('dashboard')
    else:
        form = WhatsAppConfigForm(instance=getattr(request.user, 'usertoken', None))
    return render(request, 'core/config_whatsapp.html', {'form': form})

@login_required
def configurar_openai(request):
    if request.method == 'POST':
        form = OpenAIConfigForm(request.POST, instance=request.user.useropenaittoken)
        if form.is_valid():
            form.save()
            messages.success(request, "Configurações da OpenAI atualizadas!")
            return redirect('dashboard')
    else:
        form = OpenAIConfigForm(instance=getattr(request.user, 'useropenaittoken', None))
    return render(request, 'core/config_openai.html', {'form': form})

# Funções auxiliares
def find_prestadores(especialidade, regiao):
    return Prestador.objects.filter(
        especialidades=especialidade,
        regioes=regiao,
        ativo=True
    ).order_by('-avaliacao')

def extract_especialidade(text):
    # Try to match with existing specialties first
    especialidades = Especialidade.objects.all()
    for esp in especialidades:
        if esp.nome.lower() in text.lower():
            return esp.nome
    
    # Common service mappings
    service_mapping = {
        'pedreiro': ['pedreiro', 'alvenaria', 'construção'],
        'pintor': ['pintor', 'pintura'],
        'eletricista': ['eletricista', 'elétrica', 'instalação elétrica'],
        'encanador': ['encanador', 'encanamento', 'hidráulica'],
        'gesseiro': ['gesseiro', 'drywall', 'sanca']
    }
    
    text_lower = text.lower()
    for especialidade, keywords in service_mapping.items():
        if any(kw in text_lower for kw in keywords):
            return especialidade
    
    return None

def extract_regiao(text):
    # Simple extraction - could be enhanced with NLP
    import re
    patterns = [
        r'(?:em|no|na)\s+([A-Za-záàâãéèêíïóôõöúçñ\s]+)',
        r'(?:bairro|b\.)\s*([A-Za-záàâãéèêíïóôõöúçñ\s]+)',
        r'(?:cidade|município)\s*de\s*([A-Za-záàâãéèêíïóôõöúçñ\s]+)'
    ]
    
    for pattern in patterns:
        match = re.search(pattern, text, re.IGNORECASE)
        if match:
            return match.group(1).strip()
    
    return None

def send_whatsapp_message(to_number, message, access_token, phone_number_id):
    url = f"https://graph.facebook.com/v17.0/{phone_number_id}/messages"
    headers = {
        'Authorization': f'Bearer {access_token}',
        'Content-Type': 'application/json'
    }
    payload = {
        "messaging_product": "whatsapp",
        "recipient_type": "individual",
        "to": to_number,
        "type": "text",
        "text": {
            "body": message
        }
    }
    
    try:
        response = requests.post(url, headers=headers, json=payload)
        response.raise_for_status()
        return True
    except requests.exceptions.HTTPError as e:
        logger.error(f"HTTP Error: {e.response.status_code} - {e.response.text}")
    except Exception as e:
        logger.error(f"Error sending message: {str(e)}")
    
    return False
    
class ChatbotView(View):
    def post(self, request):
        try:
            data = json.loads(request.body)
            message = data.get('message')
            user = request.user
            
            # Verificar se é um comando específico
            if message.lower().startswith('/cadastrar'):
                return self.handle_cadastro(user, message)
            
            # Usar OpenAI para respostas gerais
            response = self.get_chatgpt_response(user, message)
            return JsonResponse({'response': response})
        except Exception as e:
            return JsonResponse({'error': str(e)}, status=400)
    
    def handle_cadastro(self, user, message):
        parts = message.split()
        if len(parts) < 2:
            return JsonResponse({'response': "Comando incompleto. Use '/cadastrar cliente' ou '/cadastrar prestador'"})
        
        tipo = parts[1].lower()
        if tipo not in ['cliente', 'prestador']:
            return JsonResponse({'response': "Tipo inválido. Use 'cliente' ou 'prestador'"})
        
        # Atualizar perfil do usuário
        perfil, created = Perfil.objects.get_or_create(user=user)
        perfil.tipo = tipo
        perfil.save()
        
        if tipo == 'prestador':
            Prestador.objects.get_or_create(perfil=perfil)
        else:
            Cliente.objects.get_or_create(perfil=perfil)
        
        return JsonResponse({'response': f"Você foi cadastrado como {tipo}. Agora podemos continuar."})
    
    # core/utils.py
from openai import OpenAI
from .models import UserOpenAIToken

def get_chatgpt_response(user, prompt, conversation_history=None):
    try:
        # Get user's OpenAI configuration
        user_token = UserOpenAIToken.objects.get(user=user)
        client = OpenAI(api_key=user_token.api_key)
        
        # Prepare messages with system prompt
        messages = [
            {
                "role": "system", 
                "content": (
                    "Você é um assistente amigável que ajuda clientes e prestadores de serviço a se conectarem. "
                    "Siga estas diretrizes:\n"
                    "1. Seja natural e conversacional\n"
                    "2. Use português brasileiro informal mas profissional\n"
                    "3. Mantenha respostas curtas (1-2 frases)\n"
                    "4. Para perguntas complexas, sugira continuar no app/web\n"
                    "5. Em dúvida, peça mais informações\n"
                    "6. Use emojis moderadamente 👍"
                )
            }
        ]
        
        # Add conversation history if available
        if conversation_history:
            messages.extend(conversation_history)
            
        # Add current prompt
        messages.append({"role": "user", "content": prompt})
        
        # Get response from OpenAI
        response = client.chat.completions.create(
            model=user_token.model,
            messages=messages,
            max_tokens=150,  # Keep responses short
            temperature=0.7,  # Balanced creativity
        )
        
        return response.choices[0].message.content.strip()
    except Exception as e:
        logger.error(f"Error in ChatGPT response: {str(e)}")
        return "Desculpe, estou tendo dificuldades para responder agora. Poderia tentar novamente mais tarde?"