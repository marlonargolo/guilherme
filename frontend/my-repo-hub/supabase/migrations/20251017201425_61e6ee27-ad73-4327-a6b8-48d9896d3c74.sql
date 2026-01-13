-- FASE 1: Criar estrutura do banco de dados para Inbox Omnichannel

-- 1.1. Criar tabela contacts
CREATE TABLE IF NOT EXISTS public.contacts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  platform TEXT NOT NULL,
  platform_user_id TEXT NOT NULL,
  name TEXT NOT NULL,
  username TEXT,
  avatar_url TEXT,
  phone_number TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, platform, platform_user_id)
);

-- RLS Policies para contacts
ALTER TABLE public.contacts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own contacts" 
  ON public.contacts FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own contacts" 
  ON public.contacts FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own contacts" 
  ON public.contacts FOR UPDATE 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own contacts" 
  ON public.contacts FOR DELETE 
  USING (auth.uid() = user_id);

-- Trigger para updated_at em contacts
CREATE TRIGGER update_contacts_updated_at 
  BEFORE UPDATE ON public.contacts
  FOR EACH ROW 
  EXECUTE FUNCTION public.update_updated_at_column();

-- 1.2. Criar tabela conversations
CREATE TABLE IF NOT EXISTS public.conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  contact_id UUID NOT NULL REFERENCES public.contacts(id) ON DELETE CASCADE,
  platform TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'active',
  ai_status TEXT DEFAULT 'idle',
  ai_confidence DECIMAL(3,2),
  unread_count INTEGER DEFAULT 0,
  last_message_at TIMESTAMPTZ DEFAULT NOW(),
  last_message_preview TEXT,
  assigned_to UUID REFERENCES auth.users(id),
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices para performance
CREATE INDEX idx_conversations_user_id ON public.conversations(user_id);
CREATE INDEX idx_conversations_contact_id ON public.conversations(contact_id);
CREATE INDEX idx_conversations_last_message_at ON public.conversations(last_message_at DESC);
CREATE INDEX idx_conversations_status ON public.conversations(status);

-- RLS Policies para conversations
ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own conversations" 
  ON public.conversations FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own conversations" 
  ON public.conversations FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own conversations" 
  ON public.conversations FOR UPDATE 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own conversations" 
  ON public.conversations FOR DELETE 
  USING (auth.uid() = user_id);

-- Trigger para updated_at em conversations
CREATE TRIGGER update_conversations_updated_at 
  BEFORE UPDATE ON public.conversations
  FOR EACH ROW 
  EXECUTE FUNCTION public.update_updated_at_column();

-- 1.3. Criar tabela omnichannel_messages
CREATE TABLE IF NOT EXISTS public.omnichannel_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID NOT NULL REFERENCES public.conversations(id) ON DELETE CASCADE,
  sender_type TEXT NOT NULL,
  message_type TEXT NOT NULL DEFAULT 'text',
  content TEXT NOT NULL,
  media_url TEXT,
  status TEXT DEFAULT 'sent',
  ai_generated BOOLEAN DEFAULT FALSE,
  ai_confidence DECIMAL(3,2),
  ai_explanation TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  read_at TIMESTAMPTZ
);

-- Índices para performance
CREATE INDEX idx_omnichannel_messages_conversation_id ON public.omnichannel_messages(conversation_id);
CREATE INDEX idx_omnichannel_messages_created_at ON public.omnichannel_messages(created_at);

-- RLS Policies para omnichannel_messages
ALTER TABLE public.omnichannel_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view messages from their conversations" 
  ON public.omnichannel_messages FOR SELECT 
  USING (
    conversation_id IN (
      SELECT id FROM public.conversations WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create messages in their conversations" 
  ON public.omnichannel_messages FOR INSERT 
  WITH CHECK (
    conversation_id IN (
      SELECT id FROM public.conversations WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update messages in their conversations" 
  ON public.omnichannel_messages FOR UPDATE 
  USING (
    conversation_id IN (
      SELECT id FROM public.conversations WHERE user_id = auth.uid()
    )
  );

-- Habilitar Realtime para as tabelas
ALTER PUBLICATION supabase_realtime ADD TABLE public.conversations;
ALTER PUBLICATION supabase_realtime ADD TABLE public.omnichannel_messages;
ALTER PUBLICATION supabase_realtime ADD TABLE public.contacts;