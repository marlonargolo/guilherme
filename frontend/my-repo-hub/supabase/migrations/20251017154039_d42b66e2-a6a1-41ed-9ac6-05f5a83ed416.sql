-- Criar tabela de logs de webhook
CREATE TABLE public.webhook_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  endpoint_id UUID NOT NULL REFERENCES public.custom_endpoints(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  status_code INTEGER,
  request_payload JSONB NOT NULL DEFAULT '{}'::jsonb,
  response_payload JSONB,
  executed_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  execution_time_ms INTEGER,
  error_message TEXT,
  success BOOLEAN NOT NULL DEFAULT false
);

-- Habilitar RLS
ALTER TABLE public.webhook_logs ENABLE ROW LEVEL SECURITY;

-- Políticas RLS
CREATE POLICY "Users can view their own webhook logs"
ON public.webhook_logs
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own webhook logs"
ON public.webhook_logs
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Índices para performance
CREATE INDEX idx_webhook_logs_endpoint_id ON public.webhook_logs(endpoint_id);
CREATE INDEX idx_webhook_logs_user_id ON public.webhook_logs(user_id);
CREATE INDEX idx_webhook_logs_executed_at ON public.webhook_logs(executed_at DESC);