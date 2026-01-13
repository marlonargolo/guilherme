-- Adicionar suporte a botões interativos nas mensagens de automação
ALTER TABLE public.dm_automation_messages
ADD COLUMN buttons JSONB DEFAULT NULL;

-- Comentário explicativo
COMMENT ON COLUMN public.dm_automation_messages.buttons IS 'Array de botões interativos: [{"type": "quick_reply", "title": "Texto do Botão", "payload": "PAYLOAD_DATA"}, ...]';

-- Exemplos de estrutura:
-- Quick Reply: {"type": "quick_reply", "title": "Sim", "payload": "YES"}
-- URL Button: {"type": "url", "title": "Ver Produto", "url": "https://exemplo.com/produto"}
-- Postback Button: {"type": "postback", "title": "Continuar", "payload": "CONTINUE_FLOW"}