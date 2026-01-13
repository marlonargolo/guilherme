-- Criar tabela de logs de auditoria
CREATE TABLE IF NOT EXISTS public.audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  action TEXT NOT NULL,
  resource TEXT NOT NULL,
  details TEXT,
  ip_address TEXT,
  level TEXT NOT NULL DEFAULT 'info' CHECK (level IN ('info', 'warning', 'error')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Índices para melhor performance
CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id ON public.audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON public.audit_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON public.audit_logs(action);
CREATE INDEX IF NOT EXISTS idx_audit_logs_level ON public.audit_logs(level);

-- Habilitar RLS
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- Políticas RLS: Apenas superadmins podem visualizar logs
CREATE POLICY "Superadmins can view all audit logs"
  ON public.audit_logs
  FOR SELECT
  TO authenticated
  USING (has_role(auth.uid(), 'superadmin'));

-- Sistema pode inserir logs (via service_role)
CREATE POLICY "System can insert audit logs"
  ON public.audit_logs
  FOR INSERT
  TO service_role
  WITH CHECK (true);