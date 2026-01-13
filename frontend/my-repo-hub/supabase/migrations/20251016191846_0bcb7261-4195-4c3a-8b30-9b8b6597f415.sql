-- Add unique constraint to prevent duplicate integrations per user
ALTER TABLE public.integrations 
ADD CONSTRAINT integrations_user_channel_unique UNIQUE (user_id, channel);