-- Create enum for card types
CREATE TYPE public.card_type AS ENUM ('trigger', 'message', 'condition', 'ai', 'human', 'action');

-- Create enum for automation status
CREATE TYPE public.automation_status AS ENUM ('active', 'paused', 'draft');

-- Create table for Instagram automation flows
CREATE TABLE public.instagram_flows (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  status automation_status NOT NULL DEFAULT 'draft',
  trigger_post_id TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create table for flow cards
CREATE TABLE public.flow_cards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  flow_id UUID NOT NULL REFERENCES public.instagram_flows(id) ON DELETE CASCADE,
  card_type card_type NOT NULL,
  name TEXT NOT NULL,
  content JSONB NOT NULL DEFAULT '{}',
  position JSONB NOT NULL DEFAULT '{"x": 0, "y": 0}',
  connections JSONB NOT NULL DEFAULT '[]',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create table for automation logs
CREATE TABLE public.automation_interactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  flow_id UUID NOT NULL REFERENCES public.instagram_flows(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  instagram_username TEXT NOT NULL,
  current_card_id UUID REFERENCES public.flow_cards(id),
  interaction_data JSONB NOT NULL DEFAULT '{}',
  status TEXT NOT NULL DEFAULT 'active',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.instagram_flows ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.flow_cards ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.automation_interactions ENABLE ROW LEVEL SECURITY;

-- RLS policies for instagram_flows
CREATE POLICY "Users can view their own flows"
  ON public.instagram_flows FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own flows"
  ON public.instagram_flows FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own flows"
  ON public.instagram_flows FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own flows"
  ON public.instagram_flows FOR DELETE
  USING (auth.uid() = user_id);

-- RLS policies for flow_cards
CREATE POLICY "Users can view cards from their flows"
  ON public.flow_cards FOR SELECT
  USING (flow_id IN (SELECT id FROM public.instagram_flows WHERE user_id = auth.uid()));

CREATE POLICY "Users can create cards in their flows"
  ON public.flow_cards FOR INSERT
  WITH CHECK (flow_id IN (SELECT id FROM public.instagram_flows WHERE user_id = auth.uid()));

CREATE POLICY "Users can update cards in their flows"
  ON public.flow_cards FOR UPDATE
  USING (flow_id IN (SELECT id FROM public.instagram_flows WHERE user_id = auth.uid()));

CREATE POLICY "Users can delete cards from their flows"
  ON public.flow_cards FOR DELETE
  USING (flow_id IN (SELECT id FROM public.instagram_flows WHERE user_id = auth.uid()));

-- RLS policies for automation_interactions
CREATE POLICY "Users can view their automation interactions"
  ON public.automation_interactions FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Users can create automation interactions"
  ON public.automation_interactions FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update their automation interactions"
  ON public.automation_interactions FOR UPDATE
  USING (user_id = auth.uid());

-- Triggers for updated_at
CREATE TRIGGER update_instagram_flows_updated_at
  BEFORE UPDATE ON public.instagram_flows
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_automation_interactions_updated_at
  BEFORE UPDATE ON public.automation_interactions
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();