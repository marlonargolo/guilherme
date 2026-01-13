-- Criar tabela para armazenar tentativas de login (rate limiting)
CREATE TABLE IF NOT EXISTS public.login_attempts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL,
  ip_address TEXT,
  attempt_time TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  success BOOLEAN NOT NULL DEFAULT FALSE
);

-- Índice para consultas rápidas por email e tempo
CREATE INDEX idx_login_attempts_email_time ON public.login_attempts(email, attempt_time DESC);
CREATE INDEX idx_login_attempts_ip_time ON public.login_attempts(ip_address, attempt_time DESC);

-- Função para verificar rate limit (máximo 5 tentativas em 15 minutos)
CREATE OR REPLACE FUNCTION public.check_login_rate_limit(
  p_email TEXT,
  p_ip_address TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_failed_attempts INTEGER;
  v_last_attempt TIMESTAMP WITH TIME ZONE;
  v_blocked BOOLEAN := FALSE;
  v_message TEXT;
BEGIN
  -- Contar tentativas falhadas nos últimos 15 minutos
  SELECT COUNT(*), MAX(attempt_time)
  INTO v_failed_attempts, v_last_attempt
  FROM public.login_attempts
  WHERE email = p_email
    AND attempt_time > NOW() - INTERVAL '15 minutes'
    AND success = FALSE;
  
  -- Verificar se está bloqueado
  IF v_failed_attempts >= 5 THEN
    v_blocked := TRUE;
    v_message := 'Muitas tentativas de login. Tente novamente em 15 minutos.';
  ELSE
    v_message := 'Login permitido';
  END IF;
  
  RETURN jsonb_build_object(
    'blocked', v_blocked,
    'failed_attempts', v_failed_attempts,
    'message', v_message,
    'last_attempt', v_last_attempt
  );
END;
$$;

-- Função para registrar tentativa de login
CREATE OR REPLACE FUNCTION public.record_login_attempt(
  p_email TEXT,
  p_ip_address TEXT DEFAULT NULL,
  p_success BOOLEAN DEFAULT FALSE
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.login_attempts (email, ip_address, success)
  VALUES (p_email, p_ip_address, p_success);
  
  -- Limpar tentativas antigas (mais de 24 horas)
  DELETE FROM public.login_attempts
  WHERE attempt_time < NOW() - INTERVAL '24 hours';
END;
$$;

-- Habilitar RLS na tabela
ALTER TABLE public.login_attempts ENABLE ROW LEVEL SECURITY;

-- Apenas funções do sistema podem acessar esta tabela
CREATE POLICY "Sistema pode gerenciar login_attempts"
ON public.login_attempts
FOR ALL
TO authenticated
USING (FALSE)
WITH CHECK (FALSE);