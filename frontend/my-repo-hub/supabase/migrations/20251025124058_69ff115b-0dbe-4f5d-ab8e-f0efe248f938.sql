-- Fix function search path
DROP TRIGGER IF EXISTS update_support_tickets_timestamp ON public.support_tickets;
DROP FUNCTION IF EXISTS public.update_ticket_timestamp();

CREATE OR REPLACE FUNCTION public.update_ticket_timestamp()
RETURNS TRIGGER 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER update_support_tickets_timestamp
  BEFORE UPDATE ON public.support_tickets
  FOR EACH ROW
  EXECUTE FUNCTION public.update_ticket_timestamp();