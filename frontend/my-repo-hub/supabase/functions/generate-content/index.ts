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

// Validação de entrada
interface GenerateContentRequest {
  prompt: string;
  type: 'post-content' | 'hashtags' | 'test-prompt' | 'comment-response';
  customPrompt?: string;
}

function validateRequest(body: any): { valid: boolean; error?: string; data?: GenerateContentRequest } {
  if (!body || typeof body !== 'object') {
    return { valid: false, error: 'Body inválido' };
  }
  
  const { prompt, type, customPrompt } = body;
  
  if (!prompt || typeof prompt !== 'string') {
    return { valid: false, error: 'Prompt é obrigatório e deve ser texto' };
  }
  
  if (prompt.length === 0 || prompt.length > 1000) {
    return { valid: false, error: 'Prompt deve ter entre 1 e 1000 caracteres' };
  }
  
  if (!type || !['post-content', 'hashtags', 'test-prompt', 'comment-response'].includes(type)) {
    return { valid: false, error: 'Tipo inválido' };
  }
  
  if (customPrompt && (typeof customPrompt !== 'string' || customPrompt.length > 500)) {
    return { valid: false, error: 'Prompt customizado deve ser texto com até 500 caracteres' };
  }
  
  return { 
    valid: true, 
    data: { 
      prompt: prompt.trim(), 
      type,
      customPrompt: customPrompt?.trim()
    } 
  };
}

serve(async (req) => {
  // Handle CORS preflight requests
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
    
    const { prompt, type, customPrompt } = validation.data!;
    
    if (!openAIApiKey) {
      throw new Error('OPENAI_API_KEY não configurado');
    }

    console.log('Generating content with OpenAI:', { type, hasCustomPrompt: !!customPrompt });

    let systemPrompt = '';
    
    if (type === 'post-content') {
      systemPrompt = `Você é um especialista em copywriting para redes sociais. 
Crie conteúdos envolventes, persuasivos e adaptados para cada plataforma.
Use emojis com moderação e sempre inclua um call-to-action claro.
Mantenha o tom profissional mas acessível.`;
    } else if (type === 'hashtags') {
      systemPrompt = `Você é um especialista em hashtags para redes sociais.
Gere hashtags relevantes, populares e específicas para aumentar o alcance.
Misture hashtags amplas com nichos específicos.
Retorne apenas as hashtags separadas por espaço, começando com #.`;
    } else if (type === 'test-prompt') {
      systemPrompt = customPrompt || 'Você é um assistente virtual útil e prestativo.';
    } else if (type === 'comment-response') {
      systemPrompt = 'Você é um assistente especializado em responder comentários em redes sociais de forma profissional, amigável e engajadora. Adapte o tom para cada plataforma e sempre busque converter interesse em ação.';
    }

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: prompt }
        ],
        max_completion_tokens: 500,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('OpenAI error:', response.status, errorText);
      
      if (response.status === 429) {
        throw new Error('Limite de requisições atingido. Aguarde um momento e tente novamente.');
      }
      if (response.status === 402) {
        throw new Error('Saldo insuficiente na API da OpenAI.');
      }
      throw new Error(`Erro na OpenAI: ${response.status}`);
    }

    const data = await response.json();
    const generatedText = data.choices[0].message.content;

    console.log('Content generated successfully');

    return new Response(JSON.stringify({ generatedText }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error in generate-content function:', error);
    return new Response(JSON.stringify({ error: 'Erro ao processar solicitação' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
