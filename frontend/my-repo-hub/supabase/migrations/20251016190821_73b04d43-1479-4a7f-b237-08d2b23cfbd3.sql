-- Create enum for integration types
CREATE TYPE integration_channel AS ENUM (
  'whatsapp',
  'instagram',
  'telegram',
  'facebook',
  'linkedin',
  'tiktok'
);

-- Create integrations table
CREATE TABLE public.integrations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  channel integration_channel NOT NULL,
  status TEXT NOT NULL DEFAULT 'disconnected',
  credentials JSONB DEFAULT '{}'::jsonb,
  phone_number TEXT,
  last_sync TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(user_id, channel)
);

-- Enable RLS
ALTER TABLE public.integrations ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view their own integrations"
  ON public.integrations FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own integrations"
  ON public.integrations FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own integrations"
  ON public.integrations FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own integrations"
  ON public.integrations FOR DELETE
  USING (auth.uid() = user_id);

-- Create custom endpoints table
CREATE TABLE public.custom_endpoints (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  url TEXT NOT NULL,
  method TEXT NOT NULL DEFAULT 'POST',
  headers JSONB DEFAULT '{}'::jsonb,
  body JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.custom_endpoints ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view their own endpoints"
  ON public.custom_endpoints FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own endpoints"
  ON public.custom_endpoints FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own endpoints"
  ON public.custom_endpoints FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own endpoints"
  ON public.custom_endpoints FOR DELETE
  USING (auth.uid() = user_id);

-- Trigger for updated_at
CREATE TRIGGER update_integrations_updated_at
  BEFORE UPDATE ON public.integrations
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();