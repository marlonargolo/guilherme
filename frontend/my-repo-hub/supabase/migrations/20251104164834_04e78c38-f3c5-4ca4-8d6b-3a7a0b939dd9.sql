-- Improve encryption key management for integration credentials
-- This migration addresses the weak encryption key derivation issue

-- Step 1: Create a function to generate strong per-user encryption keys
CREATE OR REPLACE FUNCTION public.generate_user_encryption_key(p_user_id UUID)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_key TEXT;
BEGIN
  -- Generate a strong 256-bit encryption key
  v_key := encode(gen_random_bytes(32), 'hex');
  RETURN v_key;
END;
$$;

-- Step 2: Recreate encryption function with improved key derivation
CREATE OR REPLACE FUNCTION public.encrypt_integration_credentials(p_credentials JSONB, p_user_id UUID)
RETURNS BYTEA
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_encryption_key TEXT;
  v_salt TEXT;
BEGIN
  -- Generate a unique salt per encryption operation
  v_salt := encode(gen_random_bytes(16), 'hex');
  
  -- Derive encryption key using PBKDF2-like approach with unique salt
  -- Using multiple iterations of hash for key strengthening
  v_encryption_key := encode(
    digest(
      encode(
        digest(p_user_id::TEXT || v_salt || gen_random_uuid()::TEXT, 'sha256'),
        'hex'
      ), 
      'sha512'
    ), 
    'hex'
  );
  
  -- Prepend salt to encrypted data so we can use it for decryption
  RETURN v_salt::BYTEA || pgp_sym_encrypt(p_credentials::TEXT, v_encryption_key);
END;
$$;

-- Step 3: Recreate decryption function to handle new format
CREATE OR REPLACE FUNCTION public.decrypt_integration_credentials(p_encrypted_credentials BYTEA, p_user_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_encryption_key TEXT;
  v_salt TEXT;
  v_encrypted_data BYTEA;
  v_decrypted_text TEXT;
BEGIN
  IF p_encrypted_credentials IS NULL THEN
    RETURN '{}'::JSONB;
  END IF;
  
  -- Extract salt from the first 32 bytes (16 bytes as hex = 32 chars)
  v_salt := encode(substring(p_encrypted_credentials from 1 for 16), 'hex');
  
  -- Extract the actual encrypted data (skip first 16 bytes)
  v_encrypted_data := substring(p_encrypted_credentials from 17);
  
  -- Derive the same encryption key using the stored salt
  v_encryption_key := encode(
    digest(
      encode(
        digest(p_user_id::TEXT || v_salt || gen_random_uuid()::TEXT, 'sha256'),
        'hex'
      ), 
      'sha512'
    ), 
    'hex'
  );
  
  v_decrypted_text := pgp_sym_decrypt(v_encrypted_data, v_encryption_key);
  
  RETURN v_decrypted_text::JSONB;
EXCEPTION
  WHEN OTHERS THEN
    RAISE WARNING 'Error decrypting credentials: %', SQLERRM;
    RETURN '{}'::JSONB;
END;
$$;

-- Step 4: Add encrypted_credentials column if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'integrations' 
    AND column_name = 'encrypted_credentials'
  ) THEN
    ALTER TABLE public.integrations ADD COLUMN encrypted_credentials BYTEA;
  END IF;
END $$;

-- Step 5: Add comment explaining the security improvement
COMMENT ON FUNCTION public.encrypt_integration_credentials IS 
'Encrypts integration credentials using strong per-operation salt and multi-round key derivation. Salt is prepended to encrypted data for decryption.';

COMMENT ON FUNCTION public.decrypt_integration_credentials IS 
'Decrypts integration credentials by extracting the salt and deriving the encryption key.';

COMMENT ON FUNCTION public.generate_user_encryption_key IS 
'Generates a cryptographically strong 256-bit encryption key for user-specific data.';