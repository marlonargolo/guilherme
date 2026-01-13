import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[CHECK-SUBSCRIPTION] ${step}${detailsStr}`);
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

    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    if (!stripeKey) throw new Error("STRIPE_SECRET_KEY not set");

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("No authorization header");

    const token = authHeader.replace("Bearer ", "");
    const { data: userData, error: userError } = await supabaseClient.auth.getUser(token);
    
    if (userError) throw new Error(`Auth error: ${userError.message}`);
    const user = userData.user;
    
    if (!user?.email) throw new Error("User not authenticated");
    logStep("User authenticated", { userId: user.id, email: user.email });

    // Whitelist de emails de teste sem cobrança
    const testEmails = [
      "gabrielsagui@gmail.com",
      "samaras.rei@gmail.com"
    ];

    if (testEmails.includes(user.email.toLowerCase())) {
      logStep("Test user - granting free access", { email: user.email });
      return new Response(JSON.stringify({
        subscribed: true,
        product_id: "test-account",
        subscription_end: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(), // 1 ano
        plan: "test",
        plan_name: "Conta de Teste",
        tokens_used: 0,
        tokens_limit: 1000000,
        tokens_remaining: 1000000
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    const stripe = new Stripe(stripeKey, { apiVersion: "2025-08-27.basil" });
    
    const customers = await stripe.customers.list({ email: user.email, limit: 1 });
    
    if (customers.data.length === 0) {
      logStep("No customer found");
      return new Response(JSON.stringify({ subscribed: false }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    const customerId = customers.data[0].id;
    logStep("Customer found", { customerId });

    const subscriptions = await stripe.subscriptions.list({
      customer: customerId,
      status: "active",
      limit: 1,
    });

    const hasActiveSub = subscriptions.data.length > 0;
    let productId = null;
    let subscriptionEnd = null;
    let plan = null;
    let planName = null;
    let tokenLimit = 80000;
    let tokensUsed = 0;

    if (hasActiveSub) {
      const subscription = subscriptions.data[0];
      subscriptionEnd = new Date(subscription.current_period_end * 1000).toISOString();
      productId = subscription.items.data[0].price.product as string;
      
      // Determine plan type based on interval
      const interval = subscription.items.data[0].price.recurring?.interval;
      plan = interval === "year" ? "annual" : "monthly";
      
      logStep("Active subscription found", { 
        subscriptionId: subscription.id, 
        endDate: subscriptionEnd,
        plan,
        productId 
      });

      // Get plan details from database
      const { data: planData } = await supabaseClient
        .from('subscription_plans')
        .select('name, token_limit')
        .eq('stripe_product_id', productId)
        .single();

      if (planData) {
        planName = planData.name;
        tokenLimit = planData.token_limit;
        logStep("Plan details loaded", { planName, tokenLimit });

        // Get or create token usage record for current period
        const periodStart = new Date();
        periodStart.setDate(1);
        periodStart.setHours(0, 0, 0, 0);

        const { data: usageData } = await supabaseClient
          .from('user_token_usage')
          .select('*')
          .eq('user_id', user.id)
          .gte('period_start', periodStart.toISOString())
          .maybeSingle();

        if (usageData) {
          tokensUsed = usageData.tokens_used;
          logStep("Token usage found", { tokensUsed, tokenLimit });
        } else {
          // Create new usage record
          const { data: newUsage } = await supabaseClient
            .from('user_token_usage')
            .insert({
              user_id: user.id,
              tokens_used: 0,
              tokens_limit: tokenLimit,
              period_start: periodStart.toISOString(),
              period_end: new Date(periodStart.getFullYear(), periodStart.getMonth() + 1, 1).toISOString()
            })
            .select()
            .single();

          if (newUsage) {
            tokensUsed = 0;
            logStep("Created new token usage record");
          }
        }
      }
    } else {
      logStep("No active subscription");
    }

    return new Response(JSON.stringify({
      subscribed: hasActiveSub,
      product_id: productId,
      subscription_end: subscriptionEnd,
      plan: plan,
      plan_name: planName,
      tokens_used: tokensUsed,
      tokens_limit: tokenLimit,
      tokens_remaining: tokenLimit - tokensUsed
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("ERROR", { message: errorMessage });
    return new Response(JSON.stringify({ error: errorMessage }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
