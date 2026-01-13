-- Criar tabela para armazenar prompts da IA
CREATE TABLE public.ai_prompts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  prompt TEXT NOT NULL,
  category TEXT,
  is_main BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Adicionar índice para consultas rápidas
CREATE INDEX idx_ai_prompts_user_id ON public.ai_prompts(user_id);
CREATE INDEX idx_ai_prompts_is_main ON public.ai_prompts(user_id, is_main) WHERE is_main = true;

-- Habilitar RLS
ALTER TABLE public.ai_prompts ENABLE ROW LEVEL SECURITY;

-- Políticas RLS
CREATE POLICY "Usuários podem ver seus próprios prompts"
ON public.ai_prompts
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Usuários podem criar seus próprios prompts"
ON public.ai_prompts
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Usuários podem atualizar seus próprios prompts"
ON public.ai_prompts
FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Usuários podem deletar seus próprios prompts"
ON public.ai_prompts
FOR DELETE
USING (auth.uid() = user_id);

-- Trigger para atualizar updated_at
CREATE TRIGGER update_ai_prompts_updated_at
BEFORE UPDATE ON public.ai_prompts
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();