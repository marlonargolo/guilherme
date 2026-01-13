-- Adicionar colunas para follow-up e resposta IA na tabela dm_automation_messages
ALTER TABLE dm_automation_messages 
ADD COLUMN is_followup BOOLEAN DEFAULT FALSE,
ADD COLUMN followup_delay_hours INTEGER,
ADD COLUMN use_ai_response BOOLEAN DEFAULT FALSE;

-- Adicionar comentários para documentar as colunas
COMMENT ON COLUMN dm_automation_messages.is_followup IS 'Se esta é uma mensagem de follow-up caso não haja resposta';
COMMENT ON COLUMN dm_automation_messages.followup_delay_hours IS 'Quantas horas aguardar antes de enviar o follow-up';
COMMENT ON COLUMN dm_automation_messages.use_ai_response IS 'Se a IA deve responder perguntas automaticamente nesta mensagem';