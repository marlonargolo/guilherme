import mercadopago
from django.conf import settings
from .models import Servico

sdk = mercadopago.SDK(settings.MP_ACCESS_TOKEN)

def create_payment_link(servico_id):
    """
    Cria um link de pagamento no Mercado Pago para um serviço
    """
    try:
        servico = Servico.objects.get(id=servico_id)
        
        preference_data = {
            "items": [
                {
                    "title": f"Serviço de {servico.especialidade.nome}",
                    "quantity": 1,
                    "unit_price": float(servico.valor_acordado),
                    "description": servico.descricao,
                }
            ],
            "payer": {
                "name": servico.cliente.perfil.user.get_full_name(),
                "email": servico.cliente.perfil.user.email,
            },
            "notification_url": f"{settings.BASE_URL}/mp/webhook/",
            "external_reference": str(servico.id),
            "statement_descriptor": "WhatsAppAgent",
            "back_urls": {
                "success": f"{settings.BASE_URL}/servicos/{servico.id}/",
                "failure": f"{settings.BASE_URL}/servicos/{servico.id}/",
                "pending": f"{settings.BASE_URL}/servicos/{servico.id}/",
            },
            "auto_return": "approved",
        }
        
        preference_response = sdk.preference().create(preference_data)
        payment_link = preference_response["response"]["init_point"]
        
        servico.link_pagamento = payment_link
        servico.save()
        
        return payment_link
    except Exception as e:
        print(f"Erro ao criar link de pagamento: {e}")
        return None

def handle_webhook(data):
    """
    Processa webhook do Mercado Pago
    """
    try:
        payment_id = data.get('data', {}).get('id')
        if not payment_id:
            return False
        
        payment_info = sdk.payment().get(payment_id)
        if payment_info["status"] != 200:
            return False
        
        payment = payment_info["response"]
        servico_id = payment["external_reference"]
        servico = Servico.objects.get(id=servico_id)
        
        if payment["status"] == "approved":
            servico.status = 'pago'
            servico.save()
            # Notificar prestador e cliente
            return True
        
        return False
    except Exception as e:
        print(f"Erro ao processar webhook: {e}")
        return False