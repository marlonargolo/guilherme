import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.74.0';

const openAIApiKey = Deno.env.get('OPENAI_API_KEY');
const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!;

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface CommentRequest {
  comment: string;
  platform: string;
  post: string;
  user: string;
  sentiment?: string;
  mainPrompt?: string;
}

function validateRequest(body: any): { valid: boolean; error?: string; data?: CommentRequest } {
  if (!body || typeof body !== 'object') {
    return { valid: false, error: 'Body inválido' };
  }
  
  const { comment, platform, post, user } = body;
  
  if (!comment || typeof comment !== 'string') {
    return { valid: false, error: 'Comentário é obrigatório' };
  }
  
  if (!platform || typeof platform !== 'string') {
    return { valid: false, error: 'Plataforma é obrigatória' };
  }
  
  if (!post || typeof post !== 'string') {
    return { valid: false, error: 'Post é obrigatório' };
  }
  
  if (!user || typeof user !== 'string') {
    return { valid: false, error: 'Usuário é obrigatório' };
  }
  
  return { 
    valid: true, 
    data: { 
      comment: comment.trim(),
      platform: platform.trim(),
      post: post.trim(),
      user: user.trim(),
      sentiment: body.sentiment,
      mainPrompt: body.mainPrompt
    } 
  };
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Verificar autenticação JWT
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Não autorizado' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return new Response(JSON.stringify({ error: 'Token inválido' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Validar entrada
    const body = await req.json();
    const validation = validateRequest(body);
    
    if (!validation.valid) {
      return new Response(JSON.stringify({ error: validation.error }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    
    const { comment, platform, post, user: commentUser, sentiment, mainPrompt } = validation.data!;
    
    console.log('Generate comment response request:', { comment, platform, post });

    // Buscar o prompt principal do usuário se não fornecido
    let systemPrompt = mainPrompt;
    if (!systemPrompt) {
      const { data: promptData, error: promptError } = await supabase
        .from('ai_prompts')
        .select('prompt')
        .eq('user_id', user.id)
        .eq('is_main', true)
        .maybeSingle();

      if (promptError) {
        console.error('Error loading prompt:', promptError);
      }

      systemPrompt = promptData?.prompt || "Você é um assistente virtual de atendimento. Responda de forma amigável, profissional e engajadora.";
    }

    const contextPrompt = `${systemPrompt}

Contexto do comentário:
- Plataforma: ${platform}
- Post original: "${post}"
- Usuário: ${commentUser}
- Comentário: "${comment}"
${sentiment ? `- Sentimento detectado: ${sentiment}` : ''}

Gere uma resposta apropriada e personalizada para este comentário, seguindo o tom e as diretrizes do prompt principal acima. A resposta deve ser:
- Natural e conversacional
- Adequada à plataforma (${platform})
- Respeitosa e profissional
- Engajadora e que incentive a interação

Responda APENAS com o texto da resposta, sem aspas ou formatação extra.`;

    if (!openAIApiKey) {
      throw new Error('OPENAI_API_KEY não configurado');
    }

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-5-mini-2025-08-07',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: contextPrompt }
        ],
        max_completion_tokens: 500,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('OpenAI error:', response.status, errorText);
      
      if (response.status === 429) {
        return new Response(JSON.stringify({ 
          error: 'Limite de requisições atingido. Tente novamente em alguns instantes.' 
        }), {
          status: 429,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      
      if (response.status === 402) {
        return new Response(JSON.stringify({ 
          error: 'Créditos insuficientes. Por favor, adicione créditos ao seu workspace.' 
        }), {
          status: 402,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      
      throw new Error(`Erro na API da OpenAI: ${response.status}`);
    }

    const data = await response.json();
    const generatedResponse = data.choices[0].message.content.trim();

    console.log('Comment response generated successfully');

    return new Response(JSON.stringify({ response: generatedResponse }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error in generate-comment-response function:', error);
    return new Response(JSON.stringify({ 
      error: error instanceof Error ? error.message : 'Erro ao gerar resposta' 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
