from django.db import models
from django.contrib.auth.models import User
from django.utils import timezone
from django.core.validators import MinValueValidator, MaxValueValidator

class Perfil(models.Model):
    TIPO_CHOICES = [
        ('cliente', 'Cliente'),
        ('prestador', 'Prestador de Serviço'),
    ]
    
    user = models.OneToOneField(User, on_delete=models.CASCADE)
    tipo = models.CharField(max_length=10, choices=TIPO_CHOICES)
    telefone = models.CharField(max_length=20)
    foto = models.ImageField(upload_to='perfis/', null=True, blank=True)
    criado_em = models.DateTimeField(default=timezone.now)
    
    def __str__(self):
        return f"{self.user.get_full_name()} ({self.tipo})"

class Especialidade(models.Model):
    nome = models.CharField(max_length=100)
    descricao = models.TextField(blank=True)
    
    def __str__(self):
        return self.nome

class Regiao(models.Model):
    estado = models.CharField(max_length=2)
    cidade = models.CharField(max_length=100)
    bairro = models.CharField(max_length=100)
    
    class Meta:
        unique_together = ['estado', 'cidade', 'bairro']
    
    def __str__(self):
        return f"{self.bairro}, {self.cidade}-{self.estado}"

class Prestador(models.Model):
    perfil = models.OneToOneField(Perfil, on_delete=models.CASCADE)
    especialidades = models.ManyToManyField(Especialidade)
    regioes = models.ManyToManyField(Regiao)
    disponibilidade = models.TextField()
    valor_hora = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    avaliacao = models.FloatField(
        validators=[MinValueValidator(0), MaxValueValidator(5)],
        null=True,
        blank=True
    )
    ativo = models.BooleanField(default=True)
    
    def __str__(self):
        return f"Prestador: {self.perfil.user.get_full_name()}"

class Cliente(models.Model):
    perfil = models.OneToOneField(Perfil, on_delete=models.CASCADE)
    interesses = models.ManyToManyField(Especialidade, related_name='clientes_interessados')
    regioes = models.ManyToManyField(Regiao, related_name='clientes_na_regiao')
    
    def __str__(self):
        return f"Cliente: {self.perfil.user.get_full_name()}"

class Servico(models.Model):
    STATUS_CHOICES = [
        ('pendente', 'Pendente'),
        ('aceito', 'Aceito'),
        ('recusado', 'Recusado'),
        ('concluido', 'Concluído'),
        ('cancelado', 'Cancelado'),
    ]
    
    cliente = models.ForeignKey(Cliente, on_delete=models.CASCADE)
    prestador = models.ForeignKey(Prestador, on_delete=models.CASCADE, null=True, blank=True)
    especialidade = models.ForeignKey(Especialidade, on_delete=models.CASCADE)
    descricao = models.TextField()
    regiao = models.ForeignKey(Regiao, on_delete=models.CASCADE)
    data_servico = models.DateTimeField()
    valor_acordado = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    status = models.CharField(max_length=10, choices=STATUS_CHOICES, default='pendente')
    criado_em = models.DateTimeField(default=timezone.now)
    
    def __str__(self):
        return f"Serviço de {self.especialidade} para {self.cliente}"

class Mensagem(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='mensagens')
    phone_number = models.CharField(max_length=20)  # Número do WhatsApp
    body = models.TextField()  # Conteúdo da mensagem
    direction = models.CharField(max_length=10, choices=[('received', 'Received'), ('sent', 'Sent')])
    timestamp = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        ordering = ['-timestamp']
    
    def __str__(self):
        return f"{self.direction} message to {self.phone_number}"

class UserToken(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE)
    access_token = models.CharField(max_length=255)
    verify_token = models.CharField(max_length=255)
    phone_number = models.CharField(max_length=20)
    
    def __str__(self):
        return f"Tokens de {self.user.username}"

# models.py
class UserOpenAIToken(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE)
    api_key = models.CharField(max_length=255)
    model = models.CharField(max_length=50, default='gpt-3.5-turbo')
    system_prompt = models.TextField(default="Você é um assistente útil para conectar clientes e prestadores de serviço via WhatsApp.")
    
    def __str__(self):
        return f"OpenAI Token de {self.user.username}"
    
class Conversa(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    telefone = models.CharField(max_length=20)
    etapa = models.CharField(max_length=50, default='inicio')
    dados = models.JSONField(default=dict)
    updated_at = models.DateTimeField(auto_now=True)