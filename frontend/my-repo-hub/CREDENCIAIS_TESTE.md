# 🔑 Credenciais de Teste - Social Flow

## Emails para Teste da Plataforma

### Gabriel Gentile de Magalhães - Testador 1
- **Email**: `gabrielsagui@gmail.com`
- **Nome**: Gabriel Gentile de Magalhães
- **Plano**: Acesso gratuito sem cobrança (conta de teste)

### Samara Gonçalves da Silva Rei - Testadora 2
- **Email**: `samaras.rei@gmail.com`
- **Nome**: Samara Gonçalves da Silva Rei
- **Plano**: Acesso gratuito sem cobrança (conta de teste)

## 📝 Instruções para Cadastro

1. Acesse a página de **Cadastro**: `/cadastro`
2. Use os emails listados acima
3. Crie sua senha (qualquer senha válida - mínimo 8 caracteres)
4. Confirme o email (auto-confirmação está ativa)
5. Faça login
6. **Acesso instantâneo**: Esses emails têm acesso gratuito e ilimitado à plataforma!

---

## ✨ Funcionalidades para Testar

### 1. 🤖 Assistente de Voz (Microfone)
- **Onde está**: Botão flutuante no canto inferior direito (roxo/vermelho)
- **Como usar**:
  - Clique no botão do microfone
  - Fale sua pergunta ou comando
  - A IA responde em tempo real por voz
  - Veja a transcrição aparecer em tempo real
- **Disponível em**: TODA A PLATAFORMA (funciona em qualquer página)
- **Requisito**: É necessário configurar a chave OPENAI_API_KEY para usar o assistente de voz

### 2. 💬 Chat IA
- **Rota**: `/chat-ia`
- **Funcionalidades**:
  - Chat lateral direito com histórico completo
  - Perguntas rápidas
  - Respostas formatadas em Markdown
  - Histórico persistente

### 3. ⚡ Automações DM
- **Rota**: `/automations`
- **Novidade**: Palavra-chave agora é OPCIONAL!
- **Teste**: Criar automação sem palavra-chave

### 4. 💳 Sistema de Planos
- **Rota**: `/planos`
- **Novidades**:
  - Design focado em conversão
  - Urgência e escassez
  - Depoimentos e garantia
  - FAQ
- **IMPORTANTE**: Requer assinatura ativa para usar a plataforma

### 5. 🌐 Seletor de Idiomas
- **Onde está**: Header superior (ao lado do sino)
- **Idiomas**: 🇧🇷 Português, 🇪🇸 Español, 🇺🇸 English

---

## 🎯 Checklist de Testes

- [ ] Cadastro com email de teste
- [ ] Login na plataforma
- [ ] Testar microfone flutuante (em várias páginas)
- [ ] Usar Chat IA e verificar histórico lateral
- [ ] Criar automação SEM palavra-chave
- [ ] Visualizar página de Planos melhorada
- [ ] Trocar idioma no seletor
- [ ] Verificar proteção por assinatura

---

## 🔒 Proteção por Assinatura

**IMPORTANTE**: Os emails de teste têm acesso liberado:
- ✅ `gabrielsagui@gmail.com` - Acesso total gratuito
- ✅ `samaras.rei@gmail.com` - Acesso total gratuito
- Todos os outros usuários precisam de assinatura ativa
- Redirecionamento automático para página de Planos se não tiver assinatura

---

## 📊 Melhorias Implementadas

### 1. **Chat IA com Histórico Lateral**
   - Layout otimizado: chat principal à esquerda, histórico à direita
   - Visualização completa de todas as conversas
   - Timestamps em cada mensagem

### 2. **Página de Planos Otimizada para Conversão**
   - Hero section com proposta de valor clara
   - Social proof (números, depoimentos)
   - Senso de urgência ("30% OFF", "Últimas 5 vagas")
   - Garantia de 7 dias destacada
   - Depoimentos reais
   - FAQ para superar objeções
   - CTA final poderoso

### 3. **Seletor de Idiomas**
   - Português 🇧🇷
   - Español 🇪🇸
   - English 🇺🇸
   - Salvo no localStorage

### 4. **Automações Flexíveis**
   - Palavra-chave agora é opcional
   - Permite automações para TODOS os comentários

### 5. **Assistente de Voz Global**
   - Funciona em TODA a plataforma
   - Botão flutuante sempre visível
   - Feedback visual quando está falando
   - Status de conexão
   - Transcrições em tempo real

---

## 🐛 Reportar Bugs

Se encontrar qualquer problema, anote:
- Página onde ocorreu
- O que estava tentando fazer
- Mensagem de erro (se houver)
- Screenshot (se possível)

---

## 📞 Suporte

Em caso de dúvidas, contate o desenvolvedor.

**Data de criação**: 23/10/2025
**Versão**: 1.0 - Sistema de Assinatura Ativo
