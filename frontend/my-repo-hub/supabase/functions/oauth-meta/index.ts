import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { data: { user } } = await supabase.auth.getUser(
      req.headers.get('Authorization')?.replace('Bearer ', '') ?? ''
    );

    if (!user) {
      throw new Error('Unauthorized');
    }

    const url = new URL(req.url);
    const action = url.searchParams.get('action');
    const appType = url.searchParams.get('app_type') || 'omnichannel';

    // Buscar configuração OAuth para Meta
    const { data: oauthConfig } = await supabase
      .from('oauth_configs')
      .select('*')
      .eq('channel', 'facebook')
      .eq('app_type', appType)
      .single();

    if (!oauthConfig) {
      throw new Error('OAuth configuration not found for Meta/Facebook');
    }

    if (action === 'authorize') {
      // Gerar URL de autorização do Facebook
      const state = crypto.randomUUID();
      const redirectUri = oauthConfig.redirect_uri;
      
      const authUrl = new URL('https://www.facebook.com/v24.0/dialog/oauth');
      authUrl.searchParams.set('client_id', oauthConfig.client_id);
      authUrl.searchParams.set('redirect_uri', redirectUri);
      authUrl.searchParams.set('state', state);
      authUrl.searchParams.set('scope', oauthConfig.scopes.join(','));

      // Salvar state para validação posterior
      await supabase
        .from('oauth_states')
        .insert({
          user_id: user.id,
          state,
          channel: 'facebook',
          app_type: appType,
          expires_at: new Date(Date.now() + 10 * 60 * 1000).toISOString(), // 10 minutos
        });

      return new Response(
        JSON.stringify({ authUrl: authUrl.toString() }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (action === 'callback') {
      const body = await req.json();
      const { code, state } = body;

      // Validar state
      const { data: stateData } = await supabase
        .from('oauth_states')
        .select('*')
        .eq('user_id', user.id)
        .eq('state', state)
        .eq('channel', 'facebook')
        .single();

      if (!stateData) {
        throw new Error('Invalid state');
      }

      // Trocar code por access token
      const tokenResponse = await fetch('https://graph.facebook.com/v24.0/oauth/access_token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          client_id: oauthConfig.client_id,
          client_secret: oauthConfig.client_secret,
          redirect_uri: oauthConfig.redirect_uri,
          code,
        }),
      });

      const tokenData = await tokenResponse.json();

      if (!tokenData.access_token) {
        throw new Error('Failed to get access token');
      }

      // Buscar informações da conta
      const accountResponse = await fetch(
        `https://graph.facebook.com/v24.0/me?access_token=${tokenData.access_token}&fields=id,name`
      );
      const accountData = await accountResponse.json();

      // Salvar integração
      await supabase
        .from('integrations')
        .upsert({
          user_id: user.id,
          channel: 'facebook',
          app_type: appType,
          status: 'connected',
          oauth_token: tokenData.access_token,
          oauth_expires_at: tokenData.expires_in 
            ? new Date(Date.now() + tokenData.expires_in * 1000).toISOString()
            : null,
          account_id: accountData.id,
          account_name: accountData.name,
          last_sync: new Date().toISOString(),
        });

      // Deletar state usado
      await supabase
        .from('oauth_states')
        .delete()
        .eq('state', state);

      return new Response(
        JSON.stringify({ success: true, account: accountData }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    throw new Error('Invalid action');
  } catch (error) {
    console.error('OAuth Meta error:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});
