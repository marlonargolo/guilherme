-- Criar função para atualizar updated_at
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Criar tabela para automações de DM
CREATE TABLE IF NOT EXISTS public.dm_automations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  name TEXT NOT NULL,
  trigger_type TEXT NOT NULL,
  trigger_keyword TEXT,
  platforms TEXT[] NOT NULL,
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Criar tabela para mensagens da automação
CREATE TABLE IF NOT EXISTS public.dm_automation_messages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  automation_id UUID NOT NULL REFERENCES public.dm_automations(id) ON DELETE CASCADE,
  message_order INTEGER NOT NULL DEFAULT 1,
  message_type TEXT NOT NULL,
  content TEXT NOT NULL,
  media_url TEXT,
  delay_seconds INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Criar tabela para logs de automações enviadas
CREATE TABLE IF NOT EXISTS public.dm_automation_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  automation_id UUID NOT NULL REFERENCES public.dm_automations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  recipient_username TEXT NOT NULL,
  platform TEXT NOT NULL,
  trigger_content TEXT,
  sent_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  status TEXT NOT NULL DEFAULT 'sent'
);

-- Enable RLS
ALTER TABLE public.dm_automations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.dm_automation_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.dm_automation_logs ENABLE ROW LEVEL SECURITY;

-- Policies para dm_automations
CREATE POLICY "Users can view their own automations" ON public.dm_automations
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own automations" ON public.dm_automations
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own automations" ON public.dm_automations
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own automations" ON public.dm_automations
  FOR DELETE USING (auth.uid() = user_id);

-- Policies para dm_automation_messages
CREATE POLICY "Users can view messages from their automations" ON public.dm_automation_messages
  FOR SELECT USING (
    automation_id IN (
      SELECT id FROM public.dm_automations WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create messages for their automations" ON public.dm_automation_messages
  FOR INSERT WITH CHECK (
    automation_id IN (
      SELECT id FROM public.dm_automations WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update messages from their automations" ON public.dm_automation_messages
  FOR UPDATE USING (
    automation_id IN (
      SELECT id FROM public.dm_automations WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete messages from their automations" ON public.dm_automation_messages
  FOR DELETE USING (
    automation_id IN (
      SELECT id FROM public.dm_automations WHERE user_id = auth.uid()
    )
  );

-- Policies para dm_automation_logs
CREATE POLICY "Users can view their automation logs" ON public.dm_automation_logs
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create automation logs" ON public.dm_automation_logs
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Criar índices para performance
CREATE INDEX idx_dm_automations_user_id ON public.dm_automations(user_id);
CREATE INDEX idx_dm_automations_active ON public.dm_automations(active);
CREATE INDEX idx_dm_automation_messages_automation_id ON public.dm_automation_messages(automation_id);
CREATE INDEX idx_dm_automation_logs_automation_id ON public.dm_automation_logs(automation_id);
CREATE INDEX idx_dm_automation_logs_sent_at ON public.dm_automation_logs(sent_at);

-- Trigger para atualizar updated_at
CREATE TRIGGER update_dm_automations_updated_at
  BEFORE UPDATE ON public.dm_automations
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();