-- Fix encryption functions: remove random UUID from key derivation
-- This fixes the bug where encryption and decryption would generate different keys

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
  
  -- Derive encryption key using salt and user_id (deterministic for same salt+user)
  v_encryption_key := encode(
    digest(
      encode(
        digest(p_user_id::TEXT || v_salt, 'sha256'),
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
  
  -- Derive the same encryption key using the stored salt (must match encryption)
  v_encryption_key := encode(
    digest(
      encode(
        digest(p_user_id::TEXT || v_salt, 'sha256'),
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