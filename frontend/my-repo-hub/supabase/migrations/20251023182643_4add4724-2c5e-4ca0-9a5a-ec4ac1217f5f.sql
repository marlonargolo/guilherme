-- Tabela de planos de assinatura
CREATE TABLE IF NOT EXISTS public.subscription_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  stripe_product_id TEXT NOT NULL UNIQUE,
  stripe_price_id TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  price NUMERIC NOT NULL,
  currency TEXT NOT NULL DEFAULT 'BRL',
  recurrence TEXT NOT NULL DEFAULT 'monthly',
  token_limit INTEGER NOT NULL DEFAULT 80000,
  features JSONB NOT NULL DEFAULT '[]'::JSONB,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Tabela de uso de tokens por usuário
CREATE TABLE IF NOT EXISTS public.user_token_usage (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  plan_id UUID REFERENCES public.subscription_plans(id) ON DELETE SET NULL,
  tokens_used INTEGER NOT NULL DEFAULT 0,
  tokens_limit INTEGER NOT NULL DEFAULT 80000,
  period_start TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT date_trunc('month', now()),
  period_end TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT (date_trunc('month', now()) + INTERVAL '1 month'),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, period_start)
);

-- Tabela de packs extras adquiridos
CREATE TABLE IF NOT EXISTS public.token_packs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  pack_name TEXT NOT NULL,
  tokens_added INTEGER NOT NULL,
  price NUMERIC NOT NULL,
  stripe_payment_id TEXT,
  purchased_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  applied_at TIMESTAMP WITH TIME ZONE
);

-- Tabela de features extras adquiridos
CREATE TABLE IF NOT EXISTS public.feature_packs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  pack_name TEXT NOT NULL,
  features JSONB NOT NULL DEFAULT '[]'::JSONB,
  price NUMERIC NOT NULL,
  stripe_payment_id TEXT,
  purchased_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  expires_at TIMESTAMP WITH TIME ZONE,
  is_active BOOLEAN NOT NULL DEFAULT true
);

-- Enable RLS
ALTER TABLE public.subscription_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_token_usage ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.token_packs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.feature_packs ENABLE ROW LEVEL SECURITY;

-- RLS Policies for subscription_plans (público para leitura)
CREATE POLICY "Anyone can view active plans"
ON public.subscription_plans
FOR SELECT
USING (is_active = true);

CREATE POLICY "Only superadmins can manage plans"
ON public.subscription_plans
FOR ALL
USING (public.has_role(auth.uid(), 'superadmin'::app_role));

-- RLS Policies for user_token_usage
CREATE POLICY "Users can view their own token usage"
ON public.user_token_usage
FOR SELECT
USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'superadmin'::app_role));

CREATE POLICY "System can create token usage records"
ON public.user_token_usage
FOR INSERT
WITH CHECK (true);

CREATE POLICY "System can update token usage"
ON public.user_token_usage
FOR UPDATE
USING (true);

-- RLS Policies for token_packs
CREATE POLICY "Users can view their own token packs"
ON public.token_packs
FOR SELECT
USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'superadmin'::app_role));

CREATE POLICY "System can create token pack records"
ON public.token_packs
FOR INSERT
WITH CHECK (true);

-- RLS Policies for feature_packs
CREATE POLICY "Users can view their own feature packs"
ON public.feature_packs
FOR SELECT
USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'superadmin'::app_role));

CREATE POLICY "System can create feature pack records"
ON public.feature_packs
FOR INSERT
WITH CHECK (true);

-- Inserir os planos criados no Stripe
INSERT INTO public.subscription_plans (stripe_product_id, stripe_price_id, name, price, token_limit, features)
VALUES 
  ('prod_TI3Ipo6zYMRU1N', 'price_1SLTBoCn7iEIWiur6v7ubvbT', 'Bronze', 120, 80000, '["DM IA", "Comentários IA básicos", "Templates", "Relatórios básicos"]'::JSONB),
  ('prod_TI3Jb3EXyj0fEj', 'price_1SLTCpCn7iEIWiurAH3GWGtL', 'Prata', 210, 200000, '["DM IA", "Comentários IA", "Estúdio de criação", "Gerente de Prompt", "Templates", "Relatórios"]'::JSONB),
  ('prod_TI3JOu0phUeBqT', 'price_1SLTD5Cn7iEIWiurkbjpo7ae', 'Ouro', 400, 350000, '["Todas funções anteriores", "IA avançada", "Geração limitada de vídeos", "Prioridade de suporte"]'::JSONB);

-- Trigger para atualizar updated_at
CREATE TRIGGER update_subscription_plans_updated_at
BEFORE UPDATE ON public.subscription_plans
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_user_token_usage_updated_at
BEFORE UPDATE ON public.user_token_usage
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Função para resetar tokens mensalmente
CREATE OR REPLACE FUNCTION public.reset_monthly_tokens()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Arquivar uso antigo e criar novos registros para o novo mês
  INSERT INTO public.user_token_usage (user_id, plan_id, tokens_used, tokens_limit, period_start, period_end)
  SELECT 
    u.user_id,
    u.plan_id,
    0,
    u.tokens_limit,
    date_trunc('month', now()),
    date_trunc('month', now()) + INTERVAL '1 month'
  FROM public.user_token_usage u
  WHERE u.period_end <= now()
  ON CONFLICT (user_id, period_start) DO NOTHING;
END;
$$;