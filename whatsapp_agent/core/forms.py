from django import forms
from django.contrib.auth.forms import UserCreationForm
from django.contrib.auth.models import User
from .models import *

class UserRegistrationForm(UserCreationForm):
    tipo = forms.ChoiceField(choices=Perfil.TIPO_CHOICES)
    telefone = forms.CharField(max_length=20)
    
    class Meta:
        model = User
        fields = ['username', 'first_name', 'last_name', 'email', 'password1', 'password2', 'tipo', 'telefone']

class PerfilUpdateForm(forms.ModelForm):
    class Meta:
        model = Perfil
        fields = ['telefone', 'foto']

class PrestadorForm(forms.ModelForm):
    class Meta:
        model = Prestador
        fields = ['especialidades', 'regioes', 'disponibilidade', 'valor_hora']

class ServicoForm(forms.ModelForm):
    class Meta:
        model = Servico
        fields = ['especialidade', 'regiao', 'descricao', 'data_servico']
    
    def __init__(self, user, *args, **kwargs):
        super().__init__(*args, **kwargs)
        if user.perfil.tipo == 'cliente':
            self.fields['especialidade'].queryset = user.perfil.cliente.interesses.all()
            self.fields['regiao'].queryset = user.perfil.cliente.regioes.all()

class WhatsAppConfigForm(forms.ModelForm):
    class Meta:
        model = UserToken
        fields = ['access_token', 'verify_token', 'phone_number']

class OpenAIConfigForm(forms.ModelForm):
    class Meta:
        model = UserOpenAIToken
        fields = ['api_key', 'model']