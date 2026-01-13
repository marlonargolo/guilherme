-- Permitir superadmins visualizarem todos os tickets e mensagens de suporte
CREATE POLICY "Superadmins can view all tickets"
ON public.support_tickets
FOR SELECT
TO authenticated
USING (has_role(auth.uid(), 'superadmin'::app_role));

CREATE POLICY "Superadmins can update all tickets"
ON public.support_tickets
FOR UPDATE
TO authenticated
USING (has_role(auth.uid(), 'superadmin'::app_role));

CREATE POLICY "Superadmins can view all ticket messages"
ON public.support_ticket_messages
FOR SELECT
TO authenticated
USING (has_role(auth.uid(), 'superadmin'::app_role));

CREATE POLICY "Superadmins can view all live chat messages"
ON public.live_chat_messages
FOR SELECT
TO authenticated
USING (has_role(auth.uid(), 'superadmin'::app_role));

-- Adicionar campo cover_image na tabela scheduled_posts
ALTER TABLE public.scheduled_posts
ADD COLUMN IF NOT EXISTS cover_image TEXT;