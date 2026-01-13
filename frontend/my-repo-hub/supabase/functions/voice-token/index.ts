import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import "https://deno.land/x/xhr@0.1.0/mod.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const OPENAI_API_KEY = Deno.env.get('OPENAI_API_KEY');
    
    if (!OPENAI_API_KEY) {
      return new Response(
        JSON.stringify({ 
          error: 'OPENAI_API_KEY não configurada. Configure em Settings → Backend.' 
        }), 
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    console.log('Requesting ephemeral token from OpenAI...');
    
    const response = await fetch("https://api.openai.com/v1/realtime/sessions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${OPENAI_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-4o-realtime-preview-2024-12-17",
        voice: "alloy",
        instructions: `Você é o FLOW, agente oficial do SocialFlow - um sistema de automação inteligente para redes sociais.

ÁREAS DE ATUAÇÃO:

1. AUTOMATIONS (MiniChannel)
Criar fluxos automáticos baseados em gatilhos: comentário com palavra-chave, mensagem recebida ou novo seguidor. Criar, editar e excluir automações com base nos parâmetros informados.

2. CHATGA (Atendimento)
Responder clientes, leads e seguidores com mensagens personalizadas. Executar sequências como texto, imagem, vídeo, áudio ou link.

3. CREATOR STUDIO
Gerar artes, legendas e postagens automáticas com base em prompts. Agendar publicações para Instagram, Facebook, TikTok e outras redes.

4. PROMPT MANAGER
Cérebro da operação. Toda informação sobre empresa, tom de voz, produtos e respostas padrão ficam aqui. SEMPRE consulte o Prompt Manager antes de agir.

FUNÇÃO PRINCIPAL:
Interpretar comandos em linguagem natural e traduzi-los em ações diretas no sistema usando as ferramentas disponíveis.

EXEMPLOS DE COMANDOS:
- "Crie uma automação para responder comentários com a palavra promoção"
- "Publique o novo vídeo no Instagram amanhã às 18h"
- "Atualize o prompt base com as informações da nova campanha"
- "Responda todos os comentários do post X com a frase confere no direct"

ESTILO DE COMUNICAÇÃO:
Clareza, objetividade e proatividade. Se o comando for incompleto, peça os dados necessários antes de executar.

ESTRUTURA DE RESPOSTA:
Sempre confirme a ação que vai executar. Exemplo: "Perfeito, vou criar uma automação para responder comentários com 'promoção'. Qual mensagem devo enviar no direct?"

Execute as ações imediatamente quando solicitado. Sempre responda em português do Brasil.`,
        tools: [
          {
            type: "function",
            name: "navigate",
            description: "Navega para uma página específica da plataforma",
            parameters: {
              type: "object",
              properties: {
                page: { 
                  type: "string",
                  description: "Nome da página: dashboard, inbox, automações, chat, creator, comentários, prompts, analytics, conexões, suporte, planos, configurações"
                }
              },
              required: ["page"]
            }
          },
          {
            type: "function",
            name: "create_automation",
            description: "Cria uma nova automação com os parâmetros fornecidos",
            parameters: {
              type: "object",
              properties: {
                name: { type: "string", description: "Nome da automação" },
                trigger: { type: "string", description: "Gatilho da automação" },
                action: { type: "string", description: "Ação a ser executada" }
              }
            }
          },
          {
            type: "function",
            name: "create_post",
            description: "Cria um novo post nas redes sociais",
            parameters: {
              type: "object",
              properties: {
                caption: { type: "string", description: "Legenda do post" },
                platform: { type: "string", description: "Plataforma (instagram, facebook, tiktok)" }
              }
            }
          },
          {
            type: "function",
            name: "generate_content",
            description: "Gera conteúdo usando IA",
            parameters: {
              type: "object",
              properties: {
                prompt: { type: "string", description: "Descrição do conteúdo a ser gerado" }
              },
              required: ["prompt"]
            }
          },
          {
            type: "function",
            name: "fill_form",
            description: "Preenche campos de formulário automaticamente",
            parameters: {
              type: "object",
              properties: {
                fields: { 
                  type: "object",
                  description: "Objeto com pares campo-valor a serem preenchidos"
                }
              },
              required: ["fields"]
            }
          }
        ],
        tool_choice: "auto",
        // Rate-limit friendly defaults
        turn_detection: {
          type: "server_vad",
          threshold: 0.7,
          prefix_padding_ms: 400,
          silence_duration_ms: 2000,
          create_response: true,
          interrupt_response: true
        },
        input_audio_format: "pcm16",
        output_audio_format: "pcm16",
        input_audio_transcription: {
          model: "whisper-1"
        }
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("OpenAI API error:", response.status, errorText);
      return new Response(
        JSON.stringify({ error: "Erro ao gerar token OpenAI", details: errorText }), 
        { 
          status: response.status, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    const data = await response.json();
    console.log("Ephemeral token generated successfully");

    return new Response(JSON.stringify(data), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error("Error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }), 
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});