import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[USE-TOKENS] ${step}${detailsStr}`);
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseClient = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    { auth: { persistSession: false } }
  );

  try {
    logStep("Function started");

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("No authorization header");

    const token = authHeader.replace("Bearer ", "");
    const { data: userData, error: userError } = await supabaseClient.auth.getUser(token);
    
    if (userError) throw new Error(`Auth error: ${userError.message}`);
    const user = userData.user;
    
    if (!user) throw new Error("User not authenticated");
    logStep("User authenticated", { userId: user.id });

    const { tokensToUse } = await req.json();
    
    if (!tokensToUse || tokensToUse <= 0) {
      throw new Error("Invalid token amount");
    }

    logStep("Tokens to use", { tokensToUse });

    // Get current period start
    const periodStart = new Date();
    periodStart.setDate(1);
    periodStart.setHours(0, 0, 0, 0);

    // Get or create token usage record
    let { data: usageData, error: usageError } = await supabaseClient
      .from('user_token_usage')
      .select('*')
      .eq('user_id', user.id)
      .gte('period_start', periodStart.toISOString())
      .maybeSingle();

    if (usageError) {
      logStep("Error fetching usage", { error: usageError });
      throw usageError;
    }

    if (!usageData) {
      // Create new usage record with default limit (free tier)
      logStep("Creating new usage record");
      const { data: newUsage, error: createError } = await supabaseClient
        .from('user_token_usage')
        .insert({
          user_id: user.id,
          tokens_used: 0,
          tokens_limit: 80000, // Default free tier limit
          period_start: periodStart.toISOString(),
          period_end: new Date(periodStart.getFullYear(), periodStart.getMonth() + 1, 1).toISOString()
        })
        .select()
        .single();

      if (createError) throw createError;
      usageData = newUsage;
    }

    // Check if user has enough tokens
    const remainingTokens = usageData.tokens_limit - usageData.tokens_used;
    
    if (remainingTokens < tokensToUse) {
      logStep("Insufficient tokens", { 
        remaining: remainingTokens, 
        requested: tokensToUse,
        limit: usageData.tokens_limit,
        used: usageData.tokens_used
      });
      
      return new Response(JSON.stringify({
        success: false,
        error: "INSUFFICIENT_TOKENS",
        message: `Você atingiu o limite do seu plano. Tokens restantes: ${remainingTokens}. Faça upgrade para continuar.`,
        tokens_remaining: remainingTokens,
        tokens_limit: usageData.tokens_limit,
        tokens_used: usageData.tokens_used
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 402, // Payment Required
      });
    }

    // Update token usage
    const newTokensUsed = usageData.tokens_used + tokensToUse;
    
    const { error: updateError } = await supabaseClient
      .from('user_token_usage')
      .update({ 
        tokens_used: newTokensUsed,
        updated_at: new Date().toISOString()
      })
      .eq('id', usageData.id);

    if (updateError) throw updateError;

    logStep("Tokens used successfully", { 
      previous: usageData.tokens_used, 
      current: newTokensUsed,
      remaining: usageData.tokens_limit - newTokensUsed
    });

    return new Response(JSON.stringify({
      success: true,
      tokens_used: newTokensUsed,
      tokens_remaining: usageData.tokens_limit - newTokensUsed,
      tokens_limit: usageData.tokens_limit
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("ERROR", { message: errorMessage });
    return new Response(JSON.stringify({ 
      success: false,
      error: errorMessage 
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
