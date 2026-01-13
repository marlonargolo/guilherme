-- Tabela de automações Python registradas
CREATE TABLE IF NOT EXISTS public.python_automations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  automation_key TEXT NOT NULL UNIQUE,
  webhook_url TEXT NOT NULL,
  webhook_secret TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  timeout_seconds INTEGER NOT NULL DEFAULT 30,
  retry_attempts INTEGER NOT NULL DEFAULT 3,
  config JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by UUID REFERENCES auth.users(id)
);

-- Tabela de fila de automações
CREATE TABLE IF NOT EXISTS public.automation_queue (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  automation_id UUID NOT NULL REFERENCES public.python_automations(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed', 'cancelled')),
  priority INTEGER NOT NULL DEFAULT 5,
  payload JSONB NOT NULL DEFAULT '{}',
  result JSONB,
  error_message TEXT,
  attempts INTEGER NOT NULL DEFAULT 0,
  max_attempts INTEGER NOT NULL DEFAULT 3,
  scheduled_for TIMESTAMPTZ NOT NULL DEFAULT now(),
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Tabela de logs de execução
CREATE TABLE IF NOT EXISTS public.automation_execution_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  queue_id UUID NOT NULL REFERENCES public.automation_queue(id) ON DELETE CASCADE,
  automation_id UUID NOT NULL REFERENCES public.python_automations(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  status TEXT NOT NULL,
  execution_time_ms INTEGER,
  request_payload JSONB,
  response_payload JSONB,
  error_details TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_automation_queue_status ON public.automation_queue(status, scheduled_for);
CREATE INDEX IF NOT EXISTS idx_automation_queue_automation ON public.automation_queue(automation_id);
CREATE INDEX IF NOT EXISTS idx_automation_queue_user ON public.automation_queue(user_id);
CREATE INDEX IF NOT EXISTS idx_execution_logs_queue ON public.automation_execution_logs(queue_id);
CREATE INDEX IF NOT EXISTS idx_execution_logs_automation ON public.automation_execution_logs(automation_id);

-- Enable RLS
ALTER TABLE public.python_automations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.automation_queue ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.automation_execution_logs ENABLE ROW LEVEL SECURITY;

-- Policies para python_automations
CREATE POLICY "Superadmins can manage python automations"
  ON public.python_automations
  FOR ALL
  USING (has_role(auth.uid(), 'superadmin'::app_role));

CREATE POLICY "Users can view active automations"
  ON public.python_automations
  FOR SELECT
  USING (is_active = true);

-- Policies para automation_queue
CREATE POLICY "Superadmins can view all queue items"
  ON public.automation_queue
  FOR SELECT
  USING (has_role(auth.uid(), 'superadmin'::app_role));

CREATE POLICY "Users can view their own queue items"
  ON public.automation_queue
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "System can create queue items"
  ON public.automation_queue
  FOR INSERT
  WITH CHECK (true);

CREATE POLICY "System can update queue items"
  ON public.automation_queue
  FOR UPDATE
  USING (true);

-- Policies para automation_execution_logs
CREATE POLICY "Superadmins can view all execution logs"
  ON public.automation_execution_logs
  FOR SELECT
  USING (has_role(auth.uid(), 'superadmin'::app_role));

CREATE POLICY "Users can view their own execution logs"
  ON public.automation_execution_logs
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "System can create execution logs"
  ON public.automation_execution_logs
  FOR INSERT
  WITH CHECK (true);

-- Trigger para atualizar updated_at
CREATE TRIGGER update_python_automations_updated_at
  BEFORE UPDATE ON public.python_automations
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();