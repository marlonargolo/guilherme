-- Adicionar campo is_system_template para diferenciar templates do sistema dos templates de usuário
ALTER TABLE user_templates ADD COLUMN IF NOT EXISTS is_system_template BOOLEAN DEFAULT FALSE;

-- Criar índice para melhorar performance
CREATE INDEX IF NOT EXISTS idx_user_templates_system ON user_templates(is_system_template) WHERE is_system_template = TRUE;

-- Atualizar RLS policies para permitir que todos vejam templates do sistema
DROP POLICY IF EXISTS "Users can view their own templates" ON user_templates;

CREATE POLICY "Users can view their own templates and system templates"
ON user_templates FOR SELECT
USING (
  auth.uid() = user_id OR is_system_template = TRUE
);

-- Apenas superadmins podem criar templates do sistema
CREATE POLICY "Superadmins can create system templates"
ON user_templates FOR INSERT
WITH CHECK (
  (auth.uid() = user_id AND is_system_template = FALSE) OR
  (has_role(auth.uid(), 'superadmin') AND is_system_template = TRUE)
);

-- Apenas superadmins podem atualizar templates do sistema
CREATE POLICY "Superadmins can update system templates"
ON user_templates FOR UPDATE
USING (
  (auth.uid() = user_id AND is_system_template = FALSE) OR
  (has_role(auth.uid(), 'superadmin') AND is_system_template = TRUE)
);

-- Apenas superadmins podem deletar templates do sistema
CREATE POLICY "Superadmins can delete system templates"
ON user_templates FOR DELETE
USING (
  (auth.uid() = user_id AND is_system_template = FALSE) OR
  (has_role(auth.uid(), 'superadmin') AND is_system_template = TRUE)
);