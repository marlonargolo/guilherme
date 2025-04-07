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
from decouple import config
from .models import *
from .forms import *

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
            data = json.loads(request.body.decode('utf-8'))
            entry = data.get('entry', [{}])[0]
            changes = entry.get('changes', [{}])[0]
            value = changes.get('value', {})
            message = value.get('messages', [{}])[0]
            
            from_number = message.get('from')
            message_body = message.get('text', {}).get('body')
            
            user = get_object_or_404(User, id=user_id)
            response = process_whatsapp_message(user, from_number, message_body)
            
            user_token = get_object_or_404(UserToken, user=user)
            send_whatsapp_message(from_number, response, user_token.access_token, user_token.phone_number)
            
            return JsonResponse({'status': 'success'})
        except Exception as e:
            return JsonResponse({'status': 'error', 'message': str(e)}, status=400)
    
    return JsonResponse({'status': 'Method not allowed'}, status=405)

def process_whatsapp_message(user, from_number, message_body):
    # Lógica para processar mensagens e interagir com o usuário
    try:
        perfil = Perfil.objects.get(telefone=from_number)
    except Perfil.DoesNotExist:
        return ("Olá! Parece que você é novo por aqui. "
                "Você é um cliente buscando serviços ou um prestador oferecendo serviços? "
                "Responda 'cliente' ou 'prestador'.")
    
    if perfil.tipo == 'cliente':
        return handle_cliente_message(perfil.cliente, message_body)
    else:
        return handle_prestador_message(perfil.prestador, message_body)

def handle_cliente_message(cliente, message):
    # Implementar fluxo de conversa para clientes
    if "buscar" in message.lower() or "encontrar" in message.lower():
        especialidade = extract_especialidade(message)
        regiao = extract_regiao(message)
        
        if not especialidade or not regiao:
            return ("Para encontrar um prestador, preciso saber: "
                    "1. Qual serviço você precisa? (ex: pedreiro, pintor) "
                    "2. Em qual região? (cidade e bairro)")
        
        prestadores = find_prestadores(especialidade, regiao)
        if prestadores:
            response = "Encontrei os seguintes prestadores:\n"
            for p in prestadores[:3]:
                response += f"- {p.perfil.user.get_full_name()}, {p.perfil.telefone}\n"
            response += "Deseja entrar em contato com algum? Digite o número."
            return response
        else:
            return "Não encontrei prestadores disponíveis para esses critérios."
    
    return "Desculpe, não entendi. Poderia reformular?"

def handle_prestador_message(prestador, message):
    # Implementar fluxo de conversa para prestadores
    if "disponibilidade" in message.lower():
        return ("Para atualizar sua disponibilidade, informe: "
                "1. Dias da semana disponíveis "
                "2. Horários disponíveis "
                "Ex: 'Segunda a Sexta, das 8h às 18h'")
    
    return "Como posso ajudar você hoje?"

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
    # Implementar lógica de NLP para extrair especialidade do texto
    pass

def extract_regiao(text):
    # Implementar lógica de NLP para extrair região do texto
    pass

def send_whatsapp_message(to_number, message, access_token, phone_number_id):
    url = WHATSAPP_API_URL.format(phone_number_id=phone_number_id)
    headers = {
        'Authorization': f'Bearer {access_token}',
        'Content-Type': 'application/json'
    }
    data = {
        "messaging_product": "whatsapp",
        "to": to_number,
        "type": "text",
        "text": {"body": message}
    }
    
    try:
        response = requests.post(url, headers=headers, json=data)
        response.raise_for_status()
        return True
    except Exception as e:
        print(f"Erro ao enviar mensagem: {e}")
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
    
    def get_chatgpt_response(self, user, message):
        try:
            user_token = UserOpenAIToken.objects.get(user=user)
            client = OpenAI(api_key=user_token.api_key)
            
            response = client.chat.completions.create(
                model=user_token.model,
                messages=[
                    {"role": "system", "content": "Você é um assistente útil para conectar clientes e prestadores de serviço."},
                    {"role": "user", "content": message},
                ],
                max_tokens=150,
                temperature=0.7,
            )
            
            return response.choices[0].message.content.strip()
        except Exception as e:
            return f"Erro ao processar sua mensagem: {str(e)}"