from django.urls import path
from . import views

urlpatterns = [
    path('home', views.dashboard, name='home'),
    path('register/', views.register, name='register'),
    path('dashboard/', views.dashboard, name='dashboard'),
    
    # WhatsApp
    path('', views.whatsapp_webhook, name='whatsapp_webhook'),
    
    # Serviços
    path('solicitar/', views.solicitar_servico, name='solicitar_servico'),
    path('aceitar/<int:servico_id>/', views.aceitar_servico, name='aceitar_servico'),
    
    # Configurações
    path('config/whatsapp/', views.configurar_whatsapp, name='config_whatsapp'),
    path('config/openai/', views.configurar_openai, name='config_openai'),
    
    # Mensagens
  #  path('mensagens/', views.wh, name='messages'),
]