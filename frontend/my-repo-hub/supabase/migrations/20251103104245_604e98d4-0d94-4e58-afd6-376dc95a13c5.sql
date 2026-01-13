-- Criar tabela de cancelamentos se não existir
CREATE TABLE IF NOT EXISTS public.subscription_cancellations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  user_email TEXT NOT NULL,
  stripe_subscription_id TEXT NOT NULL,
  stripe_customer_id TEXT,
  plan_name TEXT,
  canceled_at TIMESTAMPTZ DEFAULT now(),
  coupon_sent BOOLEAN DEFAULT false,
  app_type TEXT[] DEFAULT ARRAY[]::TEXT[]
);

-- Adicionar colunas faltantes na tabela coupon_usage se não existirem
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name='coupon_usage' AND column_name='user_email'
  ) THEN
    ALTER TABLE public.coupon_usage ADD COLUMN user_email TEXT NOT NULL DEFAULT '';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name='coupon_usage' AND column_name='sent_at'
  ) THEN
    ALTER TABLE public.coupon_usage ADD COLUMN sent_at TIMESTAMPTZ DEFAULT now();
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name='coupon_usage' AND column_name='stripe_subscription_id'
  ) THEN
    ALTER TABLE public.coupon_usage ADD COLUMN stripe_subscription_id TEXT;
  END IF;
END $$;

-- Habilitar RLS na tabela de cancelamentos
ALTER TABLE public.subscription_cancellations ENABLE ROW LEVEL SECURITY;

-- Política RLS para subscription_cancellations (apenas super-admins)
DROP POLICY IF EXISTS "Super admins can view cancellations" ON public.subscription_cancellations;
CREATE POLICY "Super admins can view cancellations"
ON public.subscription_cancellations
FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid() AND role = 'superadmin'
  )
);

-- Atualizar políticas de coupon_usage
DROP POLICY IF EXISTS "Super admins can view coupon usage" ON public.coupon_usage;
CREATE POLICY "Super admins can view coupon usage"
ON public.coupon_usage
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid() AND role = 'superadmin'
  )
);

-- Criar índices para performance
CREATE INDEX IF NOT EXISTS idx_cancellations_user_email ON public.subscription_cancellations(user_email);
CREATE INDEX IF NOT EXISTS idx_cancellations_stripe_sub ON public.subscription_cancellations(stripe_subscription_id);
CREATE INDEX IF NOT EXISTS idx_coupon_usage_user_email ON public.coupon_usage(user_email);