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

type MessageRole = 'user' | 'assistant' | 'system';

interface ChatMessage {
  role: MessageRole;
  content: string;
}

interface ChatRequest {
  conversation: ChatMessage[];
  summary?: string | null;
  inbox_context?: string | null;
}

function validateRequest(body: any): { valid: boolean; error?: string; data?: ChatRequest } {
  if (!body || typeof body !== 'object') {
    return { valid: false, error: 'Body inválido' };
  }

  const sanitizeMessage = (msg: any, index: number): ChatMessage => {
    if (!msg || typeof msg !== 'object') {
      throw new Error(`Mensagem inválida na posição ${index}`);
    }
    const role = (msg.role || 'user').toLowerCase();
    if (!['user', 'assistant', 'system'].includes(role)) {
      throw new Error(`Role inválido: ${msg.role}`);
    }
    if (typeof msg.content !== 'string') {
      throw new Error(`Conteúdo deve ser texto (posição ${index})`);
    }
    const trimmed = msg.content.trim();
    if (trimmed.length === 0 || trimmed.length > 2000) {
      throw new Error(`Mensagens devem ter entre 1 e 2000 caracteres (posição ${index})`);
    }
    return { role: role as MessageRole, content: trimmed };
  };

  const hasSingleMessage = typeof body.message === 'string';
  const hasConversation = Array.isArray(body.messages);

  if (!hasSingleMessage && !hasConversation) {
    return { valid: false, error: 'Envie "message" (texto) ou "messages" (array).' };
  }

  try {
    if (hasSingleMessage) {
      const trimmed = body.message.trim();
      if (trimmed.length === 0 || trimmed.length > 2000) {
        return { valid: false, error: 'Mensagem deve ter entre 1 e 2000 caracteres' };
      }
      return { valid: true, data: { conversation: [{ role: 'user', content: trimmed }] } };
    }

    const sanitized = (body.messages as any[]).map((msg, idx) => sanitizeMessage(msg, idx));
    if (!sanitized.some((msg: ChatMessage) => msg.role === 'user')) {
      return { valid: false, error: 'Pelo menos uma mensagem deve ter role="user"' };
    }
    const summary =
      typeof body.summary === 'string' && body.summary.trim().length > 0
        ? body.summary.trim().slice(0, 1000)
        : null;
    const inboxContext =
      typeof body.inbox_context === 'string' && body.inbox_context.trim().length > 0
        ? body.inbox_context.trim().slice(0, 1000)
        : null;
    return { valid: true, data: { conversation: sanitized, summary, inbox_context: inboxContext } };
  } catch (error) {
    return { valid: false, error: error instanceof Error ? error.message : 'Entrada inválida' };
  }
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
    
    const { conversation, summary, inbox_context } = validation.data!;
    
    const lastMessage = conversation.at(-1);
    console.log('Chat IA request:', {
      messageCount: conversation.length,
      preview: lastMessage?.content?.slice(0, 200),
    });

    let systemPrompt = `Você é um especialista em marketing digital e redes sociais. 
Seu papel é ajudar profissionais a otimizar suas estratégias de conteúdo.

Você tem acesso a dados sobre:
- Tendências de temas e palavras-chave
- Melhores horários de postagem por público-alvo
- Tipos de conteúdo com melhor engajamento
- Análise de sentimento e tópicos em alta

Forneça respostas práticas, baseadas em dados, e sempre sugira ações concretas.
Use uma linguagem profissional mas acessível, com emojis ocasionais para tornar a conversa mais leve.
Seja direto e objetivo, priorizando insights acionáveis.`;
    const contextualBlocks: string[] = [];
    if (summary) {
      contextualBlocks.push(`Resumo da conversa até aqui: ${summary}`);
    }
    if (inbox_context) {
      contextualBlocks.push(`Principais tópicos da inbox: ${inbox_context}`);
    }
    if (contextualBlocks.length) {
      systemPrompt = `${systemPrompt}\n\n${contextualBlocks.join('\n\n')}`;
    }

    if (!openAIApiKey) {
      throw new Error('OPENAI_API_KEY não configurado');
    }

    const payloadMessages = [
      { role: 'system', content: systemPrompt },
      ...conversation,
    ];

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: payloadMessages,
        max_tokens: 800,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('AI provider error:', response.status, errorText);
      
      if (response.status === 429) {
        throw new Error('Limite de requisições atingido. Aguarde um momento e tente novamente.');
      }
      if (response.status === 402) {
        throw new Error('Saldo insuficiente na API da OpenAI.');
      }
      throw new Error(`Erro na OpenAI: ${response.status}`);
    }

    const data = await response.json();
    const aiResponse = data.choices[0].message.content;

    console.log('Chat IA response generated successfully');

    return new Response(JSON.stringify({ response: aiResponse }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error in chat-ia function:', error);
    const message = error instanceof Error ? error.message : 'Erro ao processar solicitação';
    const status = message.includes('não configurado') ? 503 : 500;
    return new Response(JSON.stringify({ error: message }), {
      status,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
