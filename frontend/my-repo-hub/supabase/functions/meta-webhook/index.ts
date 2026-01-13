import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.47.10";
import { z } from "https://deno.land/x/zod@v3.22.4/mod.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Validation schemas
const messageEventSchema = z.object({
  sender: z.object({
    id: z.string().max(100)
  }),
  message: z.object({
    mid: z.string().optional(),
    text: z.string().max(10000).optional()
  }).optional()
}).passthrough();

const commentValueSchema = z.object({
  id: z.string().max(100),
  text: z.string().max(10000).optional(),
  from: z.object({
    username: z.string().max(100).optional(),
    name: z.string().max(200).optional()
  }).optional(),
  media: z.object({
    id: z.string().max(100).optional()
  }).optional(),
  created_time: z.string().optional()
}).passthrough();

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Verificação do webhook (GET request)
    if (req.method === 'GET') {
      const url = new URL(req.url);
      const mode = url.searchParams.get('hub.mode');
      const token = url.searchParams.get('hub.verify_token');
      const challenge = url.searchParams.get('hub.challenge');

      const VERIFY_TOKEN = Deno.env.get('META_VERIFY_TOKEN') || 'socialflow_webhook_2025';

      console.log('[META-WEBHOOK] Verification request:', { mode, token });

      if (mode === 'subscribe' && token === VERIFY_TOKEN) {
        console.log('[META-WEBHOOK] Webhook verified successfully');
        return new Response(challenge, { 
          status: 200,
          headers: { 'Content-Type': 'text/plain' }
        });
      } else {
        console.error('[META-WEBHOOK] Verification failed');
        return new Response('Forbidden', { status: 403 });
      }
    }

    // Processar webhook (POST request)
    if (req.method === 'POST') {
      const body = await req.json();
      console.log('[META-WEBHOOK] Received webhook:', JSON.stringify(body, null, 2));

      // Processar cada entrada do webhook
      for (const entry of body.entry || []) {
        // Instagram/Facebook Messages
        if (entry.messaging) {
          for (const event of entry.messaging) {
            await processMessage(supabase, event, 'instagram');
          }
        }

        // Instagram Comments
        if (entry.changes) {
          for (const change of entry.changes) {
            if (change.field === 'comments') {
              await processComment(supabase, change.value);
            }
          }
        }
      }

      return new Response(
        JSON.stringify({ success: true }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response('Method not allowed', { status: 405 });
  } catch (error) {
    console.error('[META-WEBHOOK] Error:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

async function processMessage(supabase: any, event: any, platform: string) {
  try {
    // Validate event structure
    const validatedEvent = messageEventSchema.parse(event);
    
    const senderId = validatedEvent.sender?.id;
    const messageText = validatedEvent.message?.text;
    
    if (!senderId || !messageText) {
      console.log('[META-WEBHOOK] Skipping event without sender or message');
      return;
    }

    console.log('[META-WEBHOOK] Processing message:', { senderId, messageText, platform });

    // Buscar ou criar contato
    let { data: contact, error: contactError } = await supabase
      .from('contacts')
      .select('*')
      .eq('platform_id', senderId)
      .eq('platform', platform)
      .single();

    if (contactError && contactError.code === 'PGRST116') {
      // Contato não existe, criar novo
      const { data: newContact, error: createError } = await supabase
        .from('contacts')
        .insert({
          platform_id: senderId,
          platform: platform,
          name: `User ${senderId.substring(0, 8)}`,
          username: senderId
        })
        .select()
        .single();

      if (createError) {
        console.error('[META-WEBHOOK] Error creating contact:', createError);
        return;
      }
      contact = newContact;
    }

    if (!contact) {
      console.error('[META-WEBHOOK] Could not find or create contact');
      return;
    }

    // Buscar ou criar conversa
    let { data: conversation, error: convError } = await supabase
      .from('conversations')
      .select('*')
      .eq('contact_id', contact.id)
      .eq('platform', platform)
      .single();

    if (convError && convError.code === 'PGRST116') {
      // Conversa não existe, criar nova
      // Aqui você precisaria do user_id - por simplicidade, usando o primeiro usuário
      const { data: users } = await supabase
        .from('profiles')
        .select('id')
        .limit(1);

      if (!users || users.length === 0) {
        console.error('[META-WEBHOOK] No users found');
        return;
      }

      const { data: newConversation, error: createConvError } = await supabase
        .from('conversations')
        .insert({
          user_id: users[0].id,
          contact_id: contact.id,
          platform: platform,
          status: 'active',
          last_message: messageText,
          last_message_at: new Date().toISOString(),
          unread_count: 1
        })
        .select()
        .single();

      if (createConvError) {
        console.error('[META-WEBHOOK] Error creating conversation:', createConvError);
        return;
      }
      conversation = newConversation;
    } else {
      // Atualizar conversa existente
      await supabase
        .from('conversations')
        .update({
          last_message: messageText,
          last_message_at: new Date().toISOString(),
          unread_count: (conversation.unread_count || 0) + 1
        })
        .eq('id', conversation.id);
    }

    // Inserir mensagem
    const { error: messageError } = await supabase
      .from('omnichannel_messages')
      .insert({
        conversation_id: conversation.id,
        message_content: messageText,
        sender_type: 'contact',
        platform_message_id: event.message.mid
      });

    if (messageError) {
      console.error('[META-WEBHOOK] Error inserting message:', messageError);
      return;
    }

    console.log('[META-WEBHOOK] Message processed successfully');
  } catch (error) {
    console.error('[META-WEBHOOK] Error processing message:', error);
  }
}

async function processComment(supabase: any, commentData: any) {
  try {
    // Validate comment data
    const validatedComment = commentValueSchema.parse(commentData);
    
    console.log('[META-WEBHOOK] Processing comment:', JSON.stringify(validatedComment, null, 2));
    
    // Salvar comentário no banco
    const { error } = await supabase
      .from('comments')
      .insert({
        platform: 'instagram',
        post_id: validatedComment.media?.id,
        comment_id: validatedComment.id,
        author_username: validatedComment.from?.username,
        author_name: validatedComment.from?.name,
        comment_text: validatedComment.text,
        created_time: validatedComment.created_time
      });

    if (error) {
      console.error('[META-WEBHOOK] Error saving comment:', error);
    } else {
      console.log('[META-WEBHOOK] Comment saved successfully');
    }
  } catch (error) {
    console.error('[META-WEBHOOK] Error processing comment:', error);
  }
}
