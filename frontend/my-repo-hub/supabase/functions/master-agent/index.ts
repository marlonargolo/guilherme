import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const openAIApiKey = Deno.env.get('OPENAI_API_KEY');
const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { 
      message, 
      context, 
      user_id, 
      platform, 
      conversation_id,
      sender_username 
    } = await req.json();

    console.log('Master Agent received:', { message, platform, sender_username });

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Buscar prompts ativos do usuário
    const { data: prompts } = await supabase
      .from('ai_prompts')
      .select('*')
      .eq('user_id', user_id)
      .eq('is_active', true)
      .order('is_main', { ascending: false });

    const mainPrompt = prompts?.find(p => p.is_main) || prompts?.[0];
    
    const systemPrompt = mainPrompt?.prompt || `Você é o agente mestre do SocialFlow — um sistema SaaS omnichannel que centraliza mensagens diretas, comentários e postagens de Facebook, Instagram, TikTok, WhatsApp e LinkedIn. 
Sua função é atuar como a camada inteligente de automação e orquestração, interpretando eventos recebidos, gerando respostas naturais, decidindo próximos passos e acionando ações quando necessário.

REGRAS DE RESPOSTA:
- Seja humano, breve e simpático
- Use emojis com moderação
- Entenda a intenção e classifique (interesse, dúvida, negativa, etc.)
- Retorne sempre em JSON válido

FORMATO DE SAÍDA OBRIGATÓRIO:
{
  "reply": "texto gerado para resposta",
  "action": "send | await | end",
  "next_step": número da próxima etapa ou null,
  "tags": ["intenção", "canal", "tipo"],
  "confidence": 0.0-1.0
}`;

    // Montar contexto da conversa
    const conversationContext = context || [];
    conversationContext.push({
      role: 'user',
      content: `Mensagem recebida de ${sender_username} via ${platform}: "${message}"`
    });

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-5-mini-2025-08-07',
        max_completion_tokens: 800,
        messages: [
          { role: 'system', content: systemPrompt },
          ...conversationContext
        ],
        response_format: { type: "json_object" }
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      console.error('OpenAI API error:', error);
      throw new Error(`OpenAI API error: ${error}`);
    }

    const data = await response.json();
    const agentResponse = JSON.parse(data.choices[0].message.content);

    console.log('Agent response:', agentResponse);

    // Salvar resposta no banco se houver conversation_id
    if (conversation_id) {
      await supabase
        .from('omnichannel_messages')
        .insert({
          conversation_id,
          content: agentResponse.reply,
          sender_type: 'ai',
          ai_generated: true,
          ai_confidence: agentResponse.confidence || 0.85,
          ai_explanation: JSON.stringify({
            action: agentResponse.action,
            next_step: agentResponse.next_step,
            tags: agentResponse.tags
          }),
          metadata: {
            platform,
            sender_username,
            processed_at: new Date().toISOString()
          }
        });
    }

    return new Response(
      JSON.stringify({
        success: true,
        agent_response: agentResponse,
        model_used: 'gpt-5-mini-2025-08-07'
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Master Agent error:', error);
    return new Response(
      JSON.stringify({ 
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});
