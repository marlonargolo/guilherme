import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.74.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { conversationId, messageContent, senderType = 'human' } = await req.json();

    console.log('Sending omnichannel message:', { conversationId, senderType });

    // 1. Buscar dados da conversa e contato
    const { data: conversation, error: convError } = await supabase
      .from('conversations')
      .select(`
        *,
        contact:contacts(*)
      `)
      .eq('id', conversationId)
      .single();

    if (convError || !conversation) {
      throw new Error('Conversation not found');
    }

    console.log('Conversation found:', { platform: conversation.platform, contactId: conversation.contact.id });

    // 2. Salvar mensagem no banco
    const { data: message, error: messageError } = await supabase
      .from('omnichannel_messages')
      .insert({
        conversation_id: conversationId,
        sender_type: senderType,
        message_type: 'text',
        content: messageContent,
        status: 'sending',
        ai_generated: senderType === 'ai'
      })
      .select()
      .single();

    if (messageError) throw messageError;
    console.log('Message saved:', message.id);

    // 3. Atualizar conversa
    await supabase
      .from('conversations')
      .update({
        last_message_at: new Date().toISOString(),
        last_message_preview: messageContent.substring(0, 100),
        ai_status: senderType === 'human' ? 'idle' : conversation.ai_status
      })
      .eq('id', conversationId);

    // 4. Buscar webhook correto baseado na plataforma
    const platformName = conversation.platform.toLowerCase();
    const { data: endpoints } = await supabase
      .from('custom_endpoints')
      .select('*')
      .eq('user_id', conversation.user_id)
      .ilike('name', `%${platformName}%send%`);

    console.log('Found endpoints:', endpoints?.length || 0);

    if (endpoints && endpoints.length > 0) {
      const endpoint = endpoints[0];
      console.log('Using endpoint:', endpoint.name);

      // Preparar payload baseado na plataforma
      let payload: any = {
        message: messageContent
      };

      if (platformName === 'whatsapp') {
        // Buscar instanceName das credenciais da integração
        const { data: integration } = await supabase
          .from('integrations')
          .select('credentials, phone_number')
          .eq('user_id', conversation.user_id)
          .eq('channel', 'whatsapp')
          .single();

        const instanceName = integration?.credentials?.instanceName || `socialflow_${conversation.user_id}`;
        
        payload = {
          instanceName: instanceName,
          phone: conversation.contact.phone_number || conversation.contact.platform_user_id,
          message: messageContent
        };
      } else if (platformName === 'instagram') {
        payload = {
          recipientId: conversation.contact.platform_user_id,
          message: messageContent
        };
      } else if (platformName === 'telegram') {
        payload = {
          chatId: conversation.contact.platform_user_id,
          text: messageContent
        };
      }

      console.log('Sending to webhook with payload:', payload);

      // 5. Chamar webhook do n8n para enviar mensagem
      const webhookResponse = await fetch(endpoint.url, {
        method: endpoint.method || 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(endpoint.headers || {})
        },
        body: JSON.stringify(payload)
      });

      const responseText = await webhookResponse.text();
      console.log('Webhook response:', webhookResponse.status, responseText);

      // 6. Atualizar status da mensagem
      const newStatus = webhookResponse.ok ? 'sent' : 'failed';
      await supabase
        .from('omnichannel_messages')
        .update({ status: newStatus })
        .eq('id', message.id);

      if (!webhookResponse.ok) {
        throw new Error(`Failed to send message via webhook: ${responseText}`);
      }

      return new Response(
        JSON.stringify({ 
          success: true, 
          message: 'Message sent successfully',
          messageId: message.id,
          status: newStatus
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    } else {
      // Nenhum webhook configurado
      console.log('No webhook configured for platform:', platformName);
      
      // Ainda assim marcar como "sent" (assumir que será processado posteriormente)
      await supabase
        .from('omnichannel_messages')
        .update({ status: 'sent' })
        .eq('id', message.id);

      return new Response(
        JSON.stringify({ 
          success: true, 
          message: 'Message saved but no webhook configured',
          messageId: message.id,
          warning: 'No webhook endpoint found for this platform'
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

  } catch (error: any) {
    console.error('Error sending omnichannel message:', error);
    return new Response(
      JSON.stringify({ 
        error: error.message,
        details: error.toString()
      }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});
