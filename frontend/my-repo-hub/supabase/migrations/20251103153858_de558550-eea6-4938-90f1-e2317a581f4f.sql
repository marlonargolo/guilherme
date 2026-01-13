-- Criar tabela para estados OAuth temporários
CREATE TABLE IF NOT EXISTS public.oauth_states (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  state TEXT NOT NULL UNIQUE,
  channel TEXT NOT NULL,
  app_type TEXT NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.oauth_states ENABLE ROW LEVEL SECURITY;

-- Policy: Usuários gerenciam seus próprios states
CREATE POLICY "Users can manage own oauth states"
  ON public.oauth_states
  FOR ALL
  USING (auth.uid() = user_id);

-- Índice para limpeza de states expirados
CREATE INDEX IF NOT EXISTS idx_oauth_states_expires ON public.oauth_states(expires_at);

-- Função para limpar states expirados (pode ser chamada por um cron job)
CREATE OR REPLACE FUNCTION public.cleanup_expired_oauth_states()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  DELETE FROM public.oauth_states
  WHERE expires_at < now();
END;
$$;