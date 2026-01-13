-- Adicionar suporte a criptografia para credenciais sensíveis
-- Criar extensão pgcrypto para funções de criptografia (se ainda não existir)
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Adicionar coluna para armazenar credenciais criptografadas
ALTER TABLE public.integrations 
ADD COLUMN IF NOT EXISTS encrypted_credentials BYTEA;

-- Função para criptografar credenciais
CREATE OR REPLACE FUNCTION public.encrypt_integration_credentials(
  p_credentials JSONB,
  p_user_id UUID
)
RETURNS BYTEA
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_encryption_key TEXT;
BEGIN
  -- Usar uma chave derivada do user_id para criptografia
  -- Em produção, usar um sistema de gerenciamento de chaves mais robusto
  v_encryption_key := encode(digest(p_user_id::TEXT || 'salt_secreto', 'sha256'), 'hex');
  
  RETURN pgp_sym_encrypt(p_credentials::TEXT, v_encryption_key);
END;
$$;

-- Função para descriptografar credenciais
CREATE OR REPLACE FUNCTION public.decrypt_integration_credentials(
  p_encrypted_credentials BYTEA,
  p_user_id UUID
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_encryption_key TEXT;
  v_decrypted_text TEXT;
BEGIN
  IF p_encrypted_credentials IS NULL THEN
    RETURN '{}'::JSONB;
  END IF;
  
  v_encryption_key := encode(digest(p_user_id::TEXT || 'salt_secreto', 'sha256'), 'hex');
  v_decrypted_text := pgp_sym_decrypt(p_encrypted_credentials, v_encryption_key);
  
  RETURN v_decrypted_text::JSONB;
EXCEPTION
  WHEN OTHERS THEN
    RAISE WARNING 'Erro ao descriptografar credenciais: %', SQLERRM;
    RETURN '{}'::JSONB;
END;
$$;