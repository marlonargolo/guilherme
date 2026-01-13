import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.74.0";
import { z } from "https://deno.land/x/zod@v3.22.4/mod.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-webhook-secret',
};

// Input validation schema
const webhookSchema = z.object({
  userId: z.string().uuid(),
  platform: z.enum(['instagram', 'whatsapp', 'telegram', 'facebook', 'tiktok']),
  contactData: z.object({
    platformUserId: z.string().max(100),
    name: z.string().max(200),
    username: z.string().max(100).optional(),
    phoneNumber: z.string().regex(/^\+?[1-9]\d{1,14}$/).optional(),
    avatarUrl: z.string().url().optional(),
    instanceName: z.string().max(100).optional()
  }),
  messageContent: z.string().max(10000),
  messageType: z.enum(['text', 'image', 'video', 'audio', 'file']).default('text'),
  mediaUrl: z.string().url().nullable().optional()
});

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Validate webhook secret
    const webhookSecret = Deno.env.get('WEBHOOK_SECRET');
    const providedSecret = req.headers.get('x-webhook-secret');
    
    if (!webhookSecret || providedSecret !== webhookSecret) {
      console.error('[WEBHOOK] Unauthorized: Invalid or missing webhook secret');
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Parse and validate input
    const rawBody = await req.json();
    const validatedData = webhookSchema.parse(rawBody);
    
    const { 
      userId, 
      platform, 
      contactData, 
      messageContent,
      messageType,
      mediaUrl
    } = validatedData;

    console.log('Processing incoming message:', { userId, platform, contactData });

    // 1. Buscar ou criar contato
    let contact;
    const { data: existingContact } = await supabase
      .from('contacts')
      .select('*')
      .eq('user_id', userId)
      .eq('platform', platform)
      .eq('platform_user_id', contactData.platformUserId)
      .single();

    if (existingContact) {
      contact = existingContact;
      // Atualizar dados do contato se necessário
      await supabase
        .from('contacts')
        .update({
          name: contactData.name,
          username: contactData.username,
          avatar_url: contactData.avatarUrl,
          phone_number: contactData.phoneNumber,
          updated_at: new Date().toISOString()
        })
        .eq('id', existingContact.id);
    } else {
      const { data: newContact, error } = await supabase
        .from('contacts')
        .insert({
          user_id: userId,
          platform,
          platform_user_id: contactData.platformUserId,
          name: contactData.name,
          username: contactData.username,
          avatar_url: contactData.avatarUrl,
          phone_number: contactData.phoneNumber
        })
        .select()
        .single();

      if (error) throw error;
      contact = newContact;
    }

    console.log('Contact found/created:', contact.id);

    // 2. Buscar ou criar conversa ativa
    let conversation;
    const { data: existingConversation } = await supabase
      .from('conversations')
      .select('*')
      .eq('user_id', userId)
      .eq('contact_id', contact.id)
      .eq('status', 'active')
      .single();

    if (existingConversation) {
      conversation = existingConversation;
    } else {
      const { data: newConversation, error } = await supabase
        .from('conversations')
        .insert({
          user_id: userId,
          contact_id: contact.id,
          platform,
          status: 'active',
          ai_status: 'idle'
        })
        .select()
        .single();

      if (error) throw error;
      conversation = newConversation;
    }

    console.log('Conversation found/created:', conversation.id);

    // 3. Inserir mensagem do cliente
    const { data: message, error: messageError } = await supabase
      .from('omnichannel_messages')
      .insert({
        conversation_id: conversation.id,
        sender_type: 'customer',
        message_type: messageType,
        content: messageContent,
        media_url: mediaUrl,
        status: 'sent'
      })
      .select()
      .single();

    if (messageError) throw messageError;
    console.log('Message saved:', message.id);

    // 4. Atualizar conversa com última mensagem
    await supabase
      .from('conversations')
      .update({
        last_message_at: new Date().toISOString(),
        last_message_preview: messageContent.substring(0, 100),
        unread_count: conversation.unread_count + 1
      })
      .eq('id', conversation.id);

    // 5. Análise IA com OpenAI
    const OPENAI_API_KEY = Deno.env.get('OPENAI_API_KEY');
    
    if (OPENAI_API_KEY) {
      console.log('Calling OpenAI for analysis...');
      
      // Buscar histórico recente da conversa para contexto
      const { data: recentMessages } = await supabase
        .from('omnichannel_messages')
        .select('sender_type, content')
        .eq('conversation_id', conversation.id)
        .order('created_at', { ascending: false })
        .limit(10);

      const conversationHistory = recentMessages?.reverse().map(m => 
        `${m.sender_type === 'customer' ? 'Cliente' : 'Assistente'}: ${m.content}`
      ).join('\n') || '';

      const aiResponse = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${OPENAI_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'gpt-4o-mini',
          messages: [
            {
              role: 'system',
              content: `Você é um assistente de atendimento ao cliente inteligente. 
              Analise a mensagem do cliente e forneça uma resposta apropriada.
              Avalie sua confiança na resposta (0.0 a 1.0).
              Seja educado, prestativo e objetivo.`
            },
            {
              role: 'user',
              content: `Histórico da conversa:\n${conversationHistory}\n\nNova mensagem do cliente: ${messageContent}\n\nForneça uma resposta adequada.`
            }
          ]
        }),
      });

      if (aiResponse.ok) {
        const aiData = await aiResponse.json();
        const aiMessageContent = aiData.choices[0]?.message?.content?.trim() || '';
        
        // Confiança baseada na qualidade da resposta (simplificado)
        const confidence = aiMessageContent.length > 50 ? 0.85 : 0.70;
        
        console.log('AI Response:', { aiMessageContent, confidence });

        // 6. Decidir se IA responde automaticamente
        if (confidence >= 0.85 && aiMessageContent) {
          console.log('AI confidence high enough, sending automatic response...');
          
          // Salvar resposta da IA no banco
          const { data: aiMessage } = await supabase
            .from('omnichannel_messages')
            .insert({
              conversation_id: conversation.id,
              sender_type: 'ai',
              message_type: 'text',
              content: aiMessageContent,
              status: 'sent',
              ai_generated: true,
              ai_confidence: confidence
            })
            .select()
            .single();

          // Atualizar status da conversa
          await supabase
            .from('conversations')
            .update({
              ai_status: 'responding',
              ai_confidence: confidence,
              last_message_at: new Date().toISOString(),
              last_message_preview: aiMessageContent.substring(0, 100)
            })
            .eq('id', conversation.id);

          // Chamar webhook para enviar mensagem pela plataforma
          const { data: endpoints } = await supabase
            .from('custom_endpoints')
            .select('*')
            .eq('user_id', userId)
            .ilike('name', `%${platform}%send%`)
            .single();

          if (endpoints) {
            console.log('Sending message via platform webhook...');
            await fetch(endpoints.url, {
              method: endpoints.method || 'POST',
              headers: {
                'Content-Type': 'application/json',
                ...(endpoints.headers || {})
              },
              body: JSON.stringify({
                instanceName: contactData.instanceName || `socialflow_${userId}`,
                phone: contactData.phoneNumber,
                message: aiMessageContent
              })
            });
          }

          return new Response(
            JSON.stringify({ 
              success: true, 
              aiResponded: true,
              message: 'Message processed and AI responded automatically',
              conversationId: conversation.id
            }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        } else {
          // Confiança baixa - marcar para revisão humana
          console.log('AI confidence too low, marking for human review...');
          await supabase
            .from('conversations')
            .update({
              ai_status: 'waiting_review',
              ai_confidence: confidence
            })
            .eq('id', conversation.id);

          return new Response(
            JSON.stringify({ 
              success: true, 
              aiResponded: false,
              message: 'Message processed, waiting for human review',
              conversationId: conversation.id
            }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }
      }
    }

    // Sem IA configurada, apenas salvar mensagem
    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Message processed without AI',
        conversationId: conversation.id
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: any) {
    console.error('Error processing incoming message:', error);
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
