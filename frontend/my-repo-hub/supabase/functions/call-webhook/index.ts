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
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('Unauthorized');
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_ANON_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey, {
      global: { headers: { Authorization: authHeader } }
    });

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      throw new Error('Unauthorized');
    }

    const { endpointId, payload, testPayload } = await req.json();
    
    if (!endpointId) {
      throw new Error('endpointId é obrigatório');
    }

    console.log('Buscando endpoint:', endpointId);

    // Buscar configuração do endpoint
    const { data: endpoint, error: endpointError } = await supabase
      .from('custom_endpoints')
      .select('*')
      .eq('id', endpointId)
      .eq('user_id', user.id)
      .single();

    if (endpointError || !endpoint) {
      console.error('Erro ao buscar endpoint:', endpointError);
      throw new Error('Endpoint não encontrado');
    }

    console.log('Endpoint encontrado:', endpoint.name);

    // Preparar payload
    const finalPayload = payload || testPayload || endpoint.body || {};
    const headers = endpoint.headers || {};
    
    console.log('Payload recebido do frontend:', payload);
    console.log('TestPayload recebido:', testPayload);
    console.log('Payload final enviado ao n8n:', finalPayload);

    // Adicionar Content-Type se não existir
    if (!headers['Content-Type'] && !headers['content-type']) {
      headers['Content-Type'] = 'application/json';
    }

    const startTime = Date.now();
    let statusCode = 0;
    let responseData: any = null;
    let errorMessage: string | null = null;
    let success = false;

    try {
      console.log('Executando webhook:', endpoint.url);
      
      // Executar requisição HTTP
      const webhookResponse = await fetch(endpoint.url, {
        method: endpoint.method,
        headers: headers,
        body: endpoint.method !== 'GET' ? JSON.stringify(finalPayload) : undefined,
        signal: AbortSignal.timeout(30000), // 30 segundos timeout
      });

      statusCode = webhookResponse.status;
      success = webhookResponse.ok;

      // Processar resposta baseado no Content-Type
      const contentType = webhookResponse.headers.get('content-type');
      
      // Detectar se é imagem base64
      if (contentType && contentType.includes('image')) {
        // Converter resposta binária para base64
        const buffer = await webhookResponse.arrayBuffer();
        const base64 = btoa(String.fromCharCode(...new Uint8Array(buffer)));
        responseData = { qrCode: base64, contentType };
      } else if (contentType && contentType.includes('application/json')) {
        // Ler como texto primeiro para evitar erro com JSON vazio
        const text = await webhookResponse.text();
        const trimmedText = text.trim();
        if (trimmedText) {
          responseData = JSON.parse(trimmedText);
        } else {
          responseData = null;
        }
      } else {
        const text = await webhookResponse.text();
        // Tentar detectar se é base64 de imagem
        if (text.startsWith('iVBORw0KGgo') || text.startsWith('data:image')) {
          responseData = { qrCode: text.replace('data:image/png;base64,', '') };
        } else {
          responseData = { text };
        }
      }

      console.log('Webhook executado com sucesso:', statusCode);
      console.log('Response data type:', typeof responseData);
    } catch (error: any) {
      console.error('Erro ao executar webhook:', error);
      errorMessage = error.message;
      statusCode = 0;
      success = false; // Garantir que success seja false em caso de erro
    }

    const executionTime = Date.now() - startTime;

    // Registrar log no banco
    const { error: logError } = await supabase
      .from('webhook_logs')
      .insert({
        endpoint_id: endpointId,
        user_id: user.id,
        status_code: statusCode,
        request_payload: finalPayload,
        response_payload: responseData,
        execution_time_ms: executionTime,
        error_message: errorMessage,
        success: success,
      });

    if (logError) {
      console.error('Erro ao salvar log:', logError);
    }

    return new Response(
      JSON.stringify({
        success,
        statusCode,
        executionTime,
        response: responseData,
        error: errorMessage,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error: any) {
    console.error('Erro na função call-webhook:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});
