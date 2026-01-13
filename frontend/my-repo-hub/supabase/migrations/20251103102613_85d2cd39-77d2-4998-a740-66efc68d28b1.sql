-- Add app_type column to profiles to track which apps users belong to
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS app_type text[] DEFAULT ARRAY['social_flow'];

-- Create index for better query performance
CREATE INDEX IF NOT EXISTS idx_profiles_app_type ON public.profiles USING GIN(app_type);

-- Add comment explaining the column
COMMENT ON COLUMN public.profiles.app_type IS 'Array of apps the user belongs to: social_flow, intelligent_agent';
