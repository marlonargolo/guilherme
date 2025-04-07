from django.contrib import admin
from .models import Perfil, Especialidade, Regiao, Prestador, Cliente, Servico, Mensagem, UserToken, UserOpenAIToken

@admin.register(Perfil)
class PerfilAdmin(admin.ModelAdmin):
    list_display = ('user', 'tipo', 'telefone', 'criado_em')
    search_fields = ('user__username', 'user__first_name', 'user__last_name', 'telefone')
    list_filter = ('tipo', 'criado_em')

@admin.register(Especialidade)
class EspecialidadeAdmin(admin.ModelAdmin):
    list_display = ('nome',)
    search_fields = ('nome',)

@admin.register(Regiao)
class RegiaoAdmin(admin.ModelAdmin):
    list_display = ('estado', 'cidade', 'bairro')
    search_fields = ('estado', 'cidade', 'bairro')
    list_filter = ('estado', 'cidade')

@admin.register(Prestador)
class PrestadorAdmin(admin.ModelAdmin):
    list_display = ('perfil', 'ativo', 'valor_hora', 'avaliacao')
    search_fields = ('perfil__user__username', 'perfil__user__first_name', 'perfil__user__last_name')
    list_filter = ('ativo', 'especialidades')

@admin.register(Cliente)
class ClienteAdmin(admin.ModelAdmin):
    list_display = ('perfil',)
    search_fields = ('perfil__user__username', 'perfil__user__first_name', 'perfil__user__last_name')

@admin.register(Servico)
class ServicoAdmin(admin.ModelAdmin):
    list_display = ('cliente', 'prestador', 'especialidade', 'data_servico', 'status')
    search_fields = ('cliente__perfil__user__username', 'prestador__perfil__user__username')
    list_filter = ('status', 'data_servico')

from django.contrib import admin
from .models import Mensagem

@admin.register(Mensagem)
class MensagemAdmin(admin.ModelAdmin):
    list_display = ('user', 'phone_number', 'body', 'direction', 'timestamp')
    list_filter = ('direction', 'timestamp')
    search_fields = ('phone_number', 'body')
    readonly_fields = ('timestamp',)
    
    # Se precisar de campos personalizados na listagem
    def user_info(self, obj):
        return f"{obj.user.username} ({obj.user.get_full_name()})"
    user_info.short_description = 'Usuário'

    
@admin.register(UserToken)
class UserTokenAdmin(admin.ModelAdmin):
    list_display = ('user', 'phone_number')
    search_fields = ('user__username', 'phone_number')

@admin.register(UserOpenAIToken)
class UserOpenAITokenAdmin(admin.ModelAdmin):
    list_display = ('user', 'model')
    search_fields = ('user__username', 'model')
