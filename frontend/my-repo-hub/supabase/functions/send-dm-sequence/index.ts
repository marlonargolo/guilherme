import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { 
      automation_id, 
      conversation_id, 
      user_id, 
      platform, 
      recipient_id 
    } = await req.json();

    console.log('Starting DM sequence:', { automation_id, conversation_id });

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Buscar mensagens da automação em ordem
    const { data: messages } = await supabase
      .from('dm_automation_messages')
      .select('*')
      .eq('automation_id', automation_id)
      .order('message_order', { ascending: true });

    if (!messages || messages.length === 0) {
      throw new Error('No messages found for automation');
    }

    // Processar cada mensagem com delay
    for (const message of messages) {
      console.log(`Processing message ${message.message_order}:`, message.content);

      // Se usa resposta de IA, gerar via Master Agent
      let contentToSend = message.content;
      
      if (message.use_ai_response) {
        const agentResponse = await fetch(`${supabaseUrl}/functions/v1/master-agent`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${supabaseServiceKey}`
          },
          body: JSON.stringify({
            message: `Gerar mensagem de introdução para ${platform}`,
            context: [],
            user_id,
            platform,
            conversation_id,
            sender_username: 'system'
          })
        });

        const agentData = await agentResponse.json();
        if (agentData.success) {
          contentToSend = agentData.agent_response.reply;
        }
      }

      // Salvar mensagem no banco
      const { data: savedMessage } = await supabase
        .from('omnichannel_messages')
        .insert({
          conversation_id,
          content: contentToSend,
          sender_type: 'agent',
          message_type: message.message_type,
          media_url: message.media_url,
          ai_generated: message.use_ai_response,
          metadata: {
            automation_id,
            message_order: message.message_order,
            platform,
            buttons: message.buttons || null
          }
        })
        .select()
        .single();

      console.log('Message saved:', savedMessage.id);

      // Enviar via API da Meta (Instagram/Facebook)
      if (platform === 'instagram' || platform === 'facebook') {
        try {
          // Buscar credenciais OAuth do usuário
          const { data: integration } = await supabase
            .from('oauth_integrations')
            .select('access_token, page_id')
            .eq('user_id', user_id)
            .eq('channel', platform)
            .eq('app_type', 'social_flow')
            .single();

          if (integration?.access_token) {
            const messagePayload: any = {
              recipient: { id: recipient_id },
              message: { text: contentToSend }
            };

            // Adicionar mídia se houver
            if (message.media_url) {
              if (message.message_type === 'image') {
                messagePayload.message = {
                  attachment: {
                    type: 'image',
                    payload: { url: message.media_url }
                  }
                };
              } else if (message.message_type === 'video') {
                messagePayload.message = {
                  attachment: {
                    type: 'video',
                    payload: { url: message.media_url }
                  }
                };
              }
            }

            // Adicionar botões se houver
            if (message.buttons && message.buttons.length > 0) {
              messagePayload.message.quick_replies = message.buttons
                .filter((btn: any) => btn.type === 'quick_reply')
                .map((btn: any) => ({
                  content_type: 'text',
                  title: btn.title,
                  payload: btn.payload
                }));

              // Para botões de URL, usar template de botões
              const urlButtons = message.buttons.filter((btn: any) => btn.type === 'url');
              if (urlButtons.length > 0) {
                messagePayload.message = {
                  attachment: {
                    type: 'template',
                    payload: {
                      template_type: 'button',
                      text: contentToSend,
                      buttons: urlButtons.map((btn: any) => ({
                        type: 'web_url',
                        url: btn.url,
                        title: btn.title
                      }))
                    }
                  }
                };
              }
            }

            // Enviar mensagem via Graph API
            const graphUrl = platform === 'instagram' 
              ? `https://graph.facebook.com/v21.0/me/messages`
              : `https://graph.facebook.com/v21.0/${integration.page_id}/messages`;

            const sendResponse = await fetch(graphUrl, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${integration.access_token}`
              },
              body: JSON.stringify(messagePayload)
            });

            if (!sendResponse.ok) {
              const errorData = await sendResponse.json();
              console.error('Meta API error:', errorData);
              throw new Error(`Meta API error: ${JSON.stringify(errorData)}`);
            }

            console.log('Message sent via Meta API successfully');
          }
        } catch (apiError) {
          console.error('Error sending via Meta API:', apiError);
          // Continue mesmo com erro - a mensagem foi salva no banco
        }
      }
      
      // Log da automação
      await supabase
        .from('dm_automation_logs')
        .insert({
          automation_id,
          user_id,
          recipient_username: recipient_id,
          platform,
          status: 'sent',
          trigger_content: contentToSend
        });

      // Aguardar delay antes da próxima mensagem (se não for a última)
      if (message.message_order < messages.length && message.delay_seconds) {
        await new Promise(resolve => setTimeout(resolve, message.delay_seconds * 1000));
      }
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'DM sequence completed',
        messages_sent: messages.length
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('DM sequence error:', error);
    return new Response(
      JSON.stringify({ success: false, error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
