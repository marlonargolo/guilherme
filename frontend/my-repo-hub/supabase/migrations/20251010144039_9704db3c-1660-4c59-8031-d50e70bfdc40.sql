-- Create table for AI chat messages
CREATE TABLE public.ai_chat_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id),
  role text NOT NULL CHECK (role IN ('user', 'assistant')),
  content text NOT NULL,
  created_at timestamp with time zone DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.ai_chat_messages ENABLE ROW LEVEL SECURITY;

-- Policies for ai_chat_messages
CREATE POLICY "Users can view their own chat messages"
  ON public.ai_chat_messages FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own chat messages"
  ON public.ai_chat_messages FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own chat messages"
  ON public.ai_chat_messages FOR DELETE
  USING (auth.uid() = user_id);

-- Create table for scheduled posts
CREATE TABLE public.scheduled_posts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id),
  content text NOT NULL,
  platforms text[] NOT NULL,
  scheduled_date timestamp with time zone NOT NULL,
  status text NOT NULL DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'draft', 'published', 'failed')),
  media_url text,
  engagement_prediction text,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.scheduled_posts ENABLE ROW LEVEL SECURITY;

-- Policies for scheduled_posts
CREATE POLICY "Users can view their own posts"
  ON public.scheduled_posts FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own posts"
  ON public.scheduled_posts FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own posts"
  ON public.scheduled_posts FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own posts"
  ON public.scheduled_posts FOR DELETE
  USING (auth.uid() = user_id);

-- Create storage bucket for automation media
INSERT INTO storage.buckets (id, name, public)
VALUES ('automation-media', 'automation-media', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for automation media
CREATE POLICY "Users can upload their own automation media"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'automation-media' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Automation media is publicly accessible"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'automation-media');

CREATE POLICY "Users can update their own automation media"
  ON storage.objects FOR UPDATE
  USING (
    bucket_id = 'automation-media' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Users can delete their own automation media"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'automation-media' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

-- Trigger for updated_at
CREATE TRIGGER update_scheduled_posts_updated_at
  BEFORE UPDATE ON public.scheduled_posts
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();