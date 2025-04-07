import requests
from django.conf import settings
from .models import UserToken

def send_template_message(user_id, to_number, template_name, components):
    """
    Envia uma mensagem de template via WhatsApp Business API
    """
    try:
        user_token = UserToken.objects.get(user_id=user_id)
        
        url = f"https://graph.facebook.com/v17.0/{user_token.phone_number}/messages"
        headers = {
            'Authorization': f'Bearer {user_token.access_token}',
            'Content-Type': 'application/json'
        }
        
        data = {
            "messaging_product": "whatsapp",
            "to": to_number,
            "type": "template",
            "template": {
                "name": template_name,
                "language": {"code": "pt_BR"},
                "components": components
            }
        }
        
        response = requests.post(url, headers=headers, json=data)
        response.raise_for_status()
        return True
    except Exception as e:
        print(f"Erro ao enviar mensagem de template: {e}")
        return False

def send_welcome_message(user_id, to_number):
    """
    Envia mensagem de boas-vindas para novos usuários
    """
    components = [
        {
            "type": "body",
            "parameters": [
                {"type": "text", "text": "WhatsApp Agent"}
            ]
        }
    ]
    return send_template_message(user_id, to_number, "welcome_message", components)

def send_service_confirmation(user_id, to_number, service_details):
    """
    Envia confirmação de serviço agendado
    """
    components = [
        {
            "type": "body",
            "parameters": [
                {"type": "text", "text": service_details['prestador']},
                {"type": "text", "text": service_details['data']},
                {"type": "text", "text": service_details['endereco']}
            ]
        }
    ]
    return send_template_message(user_id, to_number, "service_confirmation", components)