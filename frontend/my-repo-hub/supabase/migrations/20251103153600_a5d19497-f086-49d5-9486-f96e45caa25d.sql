-- Adicionar coluna app_type nas integrações para separar Social Flow e Intelligent Agent
ALTER TABLE public.integrations 
ADD COLUMN IF NOT EXISTS app_type TEXT CHECK (app_type IN ('social_flow', 'intelligent_agent', 'omnichannel'));

-- Adicionar campos OAuth
ALTER TABLE public.integrations 
ADD COLUMN IF NOT EXISTS oauth_token TEXT,
ADD COLUMN IF NOT EXISTS oauth_refresh_token TEXT,
ADD COLUMN IF NOT EXISTS oauth_expires_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS account_id TEXT,
ADD COLUMN IF NOT EXISTS account_name TEXT;

-- Criar tabela para armazenar configurações OAuth das aplicações
CREATE TABLE IF NOT EXISTS public.oauth_configs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  channel TEXT NOT NULL,
  app_type TEXT NOT NULL CHECK (app_type IN ('social_flow', 'intelligent_agent', 'omnichannel')),
  client_id TEXT NOT NULL,
  client_secret TEXT NOT NULL,
  redirect_uri TEXT NOT NULL,
  scopes TEXT[] NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(channel, app_type)
);

-- Enable RLS
ALTER TABLE public.oauth_configs ENABLE ROW LEVEL SECURITY;

-- Policy: Super admins podem gerenciar configurações OAuth
CREATE POLICY "Super admins can manage oauth configs"
  ON public.oauth_configs
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid()
      AND role = 'superadmin'
    )
  );

-- Criar tabela para logs de automações
CREATE TABLE IF NOT EXISTS public.automation_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  app_type TEXT NOT NULL,
  automation_type TEXT NOT NULL,
  channel TEXT NOT NULL,
  trigger_event TEXT NOT NULL,
  action_taken TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('success', 'failed', 'pending')),
  error_message TEXT,
  metadata JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.automation_logs ENABLE ROW LEVEL SECURITY;

-- Policy: Usuários veem seus próprios logs
CREATE POLICY "Users can view own automation logs"
  ON public.automation_logs
  FOR SELECT
  USING (auth.uid() = user_id);

-- Policy: Super admins veem todos os logs
CREATE POLICY "Super admins can view all automation logs"
  ON public.automation_logs
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid()
      AND role = 'superadmin'
    )
  );

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_integrations_app_type ON public.integrations(app_type);
CREATE INDEX IF NOT EXISTS idx_integrations_oauth_expires ON public.integrations(oauth_expires_at);
CREATE INDEX IF NOT EXISTS idx_automation_logs_user_app ON public.automation_logs(user_id, app_type);
CREATE INDEX IF NOT EXISTS idx_automation_logs_created ON public.automation_logs(created_at DESC);