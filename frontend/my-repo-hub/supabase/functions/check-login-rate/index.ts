import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.74.0';

const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface RateLimitRequest {
  email: string;
  action: 'check' | 'record';
  success?: boolean;
  ipAddress?: string;
}

function validateRequest(body: any): { valid: boolean; error?: string; data?: RateLimitRequest } {
  if (!body || typeof body !== 'object') {
    return { valid: false, error: 'Body inválido' };
  }
  
  const { email, action, success, ipAddress } = body;
  
  if (!email || typeof email !== 'string' || !email.includes('@')) {
    return { valid: false, error: 'Email inválido' };
  }
  
  if (!action || !['check', 'record'].includes(action)) {
    return { valid: false, error: 'Ação inválida' };
  }
  
  if (action === 'record' && typeof success !== 'boolean') {
    return { valid: false, error: 'Success deve ser booleano para ação record' };
  }
  
  return { 
    valid: true, 
    data: { 
      email: email.toLowerCase().trim(),
      action,
      success,
      ipAddress: ipAddress || null
    } 
  };
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body = await req.json();
    const validation = validateRequest(body);
    
    if (!validation.valid) {
      return new Response(JSON.stringify({ error: validation.error }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    
    const { email, action, success, ipAddress } = validation.data!;
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    if (action === 'check') {
      // Verificar rate limit
      const { data, error } = await supabase.rpc('check_login_rate_limit', {
        p_email: email,
        p_ip_address: ipAddress
      });
      
      if (error) {
        console.error('Error checking rate limit:', error);
        return new Response(JSON.stringify({ error: 'Erro ao verificar limite' }), {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      
      return new Response(JSON.stringify(data), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    } else {
      // Registrar tentativa
      const { error } = await supabase.rpc('record_login_attempt', {
        p_email: email,
        p_ip_address: ipAddress,
        p_success: success
      });
      
      if (error) {
        console.error('Error recording login attempt:', error);
        return new Response(JSON.stringify({ error: 'Erro ao registrar tentativa' }), {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      
      return new Response(JSON.stringify({ success: true }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
  } catch (error) {
    console.error('Error in check-login-rate function:', error);
    return new Response(JSON.stringify({ error: 'Erro ao processar solicitação' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
