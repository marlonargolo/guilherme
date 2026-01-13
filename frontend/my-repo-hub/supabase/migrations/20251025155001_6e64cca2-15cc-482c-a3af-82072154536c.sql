-- Add avatar_url column to profiles table
ALTER TABLE public.profiles 
ADD COLUMN avatar_url text;

COMMENT ON COLUMN public.profiles.avatar_url IS 'URL da foto de perfil/logo da empresa';