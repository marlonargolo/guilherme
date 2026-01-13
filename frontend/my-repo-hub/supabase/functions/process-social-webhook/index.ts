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
    const { platform, event_type, payload } = await req.json();
    
    console.log('Webhook received:', { platform, event_type });

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Processar baseado no tipo de evento
    if (event_type === 'comment') {
      return await handleComment(supabase, platform, payload);
    } else if (event_type === 'message' || event_type === 'dm') {
      return await handleDirectMessage(supabase, platform, payload);
    } else if (event_type === 'mention') {
      return await handleMention(supabase, platform, payload);
    }

    return new Response(
      JSON.stringify({ success: true, message: 'Event processed' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Webhook processing error:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

async function handleComment(supabase: any, platform: string, payload: any) {
  const { user_id, post_id, comment_id, comment_text, sender_username, sender_id } = payload;

  console.log('Processing comment:', { comment_text, sender_username });

  // Verificar se há automação ativa para comentários
  const { data: automation } = await supabase
    .from('dm_automations')
    .select('*')
    .eq('user_id', user_id)
    .eq('trigger_type', 'comment')
    .contains('platforms', [platform])
    .eq('active', true)
    .single();

  if (!automation) {
    console.log('No active automation found for comments');
    return new Response(
      JSON.stringify({ success: true, message: 'No automation configured' }),
      { headers: corsHeaders }
    );
  }

  // Verificar se deve disparar (por keyword se configurado)
  if (automation.trigger_keyword) {
    const hasKeyword = comment_text.toLowerCase().includes(automation.trigger_keyword.toLowerCase());
    if (!hasKeyword) {
      console.log('Comment does not match keyword trigger');
      return new Response(
        JSON.stringify({ success: true, message: 'Keyword not matched' }),
        { headers: corsHeaders }
      );
    }
  }

  // 1. Responder ao comentário publicamente
  const publicReply = "Oi 👋 te mandei um direct!";
  
  // Aqui você chamaria a API da rede social para responder
  // Por enquanto, apenas logamos
  console.log('Would reply to comment:', publicReply);

  // 2. Criar ou buscar contato
  let { data: contact } = await supabase
    .from('contacts')
    .select('*')
    .eq('user_id', user_id)
    .eq('platform', platform)
    .eq('platform_user_id', sender_id)
    .single();

  if (!contact) {
    const { data: newContact } = await supabase
      .from('contacts')
      .insert({
        user_id,
        platform,
        platform_user_id: sender_id,
        username: sender_username,
        name: sender_username,
        metadata: { discovered_from: 'comment', post_id, comment_id }
      })
      .select()
      .single();
    
    contact = newContact;
  }

  // 3. Criar conversa
  const { data: conversation } = await supabase
    .from('conversations')
    .insert({
      user_id,
      contact_id: contact.id,
      platform,
      ai_status: 'active',
      status: 'active',
      metadata: { triggered_by: 'comment', automation_id: automation.id }
    })
    .select()
    .single();

  // 4. Chamar Master Agent para processar e decidir próximo passo
  const agentResponse = await fetch(`${supabaseUrl}/functions/v1/master-agent`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${supabaseServiceKey}`
    },
    body: JSON.stringify({
      message: comment_text,
      context: [],
      user_id,
      platform,
      conversation_id: conversation.id,
      sender_username
    })
  });

  const agentData = await agentResponse.json();
  
  // 5. Disparar sequência de DM
  if (agentData.success && agentData.agent_response.action === 'send') {
    await fetch(`${supabaseUrl}/functions/v1/send-dm-sequence`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${supabaseServiceKey}`
      },
      body: JSON.stringify({
        automation_id: automation.id,
        conversation_id: conversation.id,
        user_id,
        platform,
        recipient_id: sender_id
      })
    });
  }

  return new Response(
    JSON.stringify({ 
      success: true, 
      message: 'Comment processed and DM sequence initiated',
      conversation_id: conversation.id
    }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  );
}

async function handleDirectMessage(supabase: any, platform: string, payload: any) {
  const { user_id, conversation_id, message_text, sender_username } = payload;

  console.log('Processing DM:', { message_text, sender_username });

  // Buscar conversa
  const { data: conversation } = await supabase
    .from('conversations')
    .select('*')
    .eq('id', conversation_id)
    .single();

  if (!conversation) {
    console.log('Conversation not found');
    return new Response(
      JSON.stringify({ success: false, error: 'Conversation not found' }),
      { status: 404, headers: corsHeaders }
    );
  }

  // Salvar mensagem recebida
  await supabase
    .from('omnichannel_messages')
    .insert({
      conversation_id,
      content: message_text,
      sender_type: 'contact',
      message_type: 'text'
    });

  // Se AI está ativa, chamar Master Agent
  if (conversation.ai_status === 'active') {
    const agentResponse = await fetch(`${supabaseUrl}/functions/v1/master-agent`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${supabaseServiceKey}`
      },
      body: JSON.stringify({
        message: message_text,
        context: [], // Aqui você pode buscar histórico da conversa
        user_id: conversation.user_id,
        platform,
        conversation_id,
        sender_username
      })
    });

    const agentData = await agentResponse.json();
    
    if (agentData.success && agentData.agent_response.action === 'send') {
      // Enviar resposta via API da rede social
      console.log('Would send DM response:', agentData.agent_response.reply);
    }
  }

  return new Response(
    JSON.stringify({ success: true, message: 'DM processed' }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  );
}

async function handleMention(supabase: any, platform: string, payload: any) {
  console.log('Processing mention:', payload);
  
  // Similar ao handleComment
  return new Response(
    JSON.stringify({ success: true, message: 'Mention processed' }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  );
}
