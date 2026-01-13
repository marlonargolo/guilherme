import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Authenticate user
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("No authorization header");

    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: userError } = await supabaseClient.auth.getUser(token);
    if (userError || !user) throw new Error("Unauthorized");

    // Check if user is superadmin
    const { data: roles } = await supabaseClient
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .eq('role', 'superadmin')
      .maybeSingle();

    if (!roles) {
      throw new Error("Unauthorized: User is not a superadmin");
    }

    const { priceId, productId, newPrice, planName, tokenLimit, features } = await req.json();

    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    if (!stripeKey) throw new Error("STRIPE_SECRET_KEY not configured");

    const stripe = new Stripe(stripeKey, { apiVersion: "2025-08-27.basil" });

    // Update product metadata and name
    if (productId) {
      await stripe.products.update(productId, {
        name: planName,
        metadata: {
          token_limit: tokenLimit.toString(),
          features: JSON.stringify(features),
        }
      });
    }

    // Create new price (Stripe doesn't allow updating existing prices)
    // Archive the old price and create a new one
    if (priceId) {
      await stripe.prices.update(priceId, {
        active: false,
      });
    }

    const newStripePrice = await stripe.prices.create({
      product: productId,
      unit_amount: Math.round(newPrice * 100), // Convert to cents
      currency: "brl",
      recurring: {
        interval: "month",
      },
      metadata: {
        plan_name: planName,
        token_limit: tokenLimit.toString(),
      }
    });

    return new Response(
      JSON.stringify({
        success: true,
        newPriceId: newStripePrice.id,
        message: "Price updated successfully in Stripe"
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );
  } catch (error) {
    console.error("Error updating Stripe price:", error);
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : "Unknown error",
        success: false
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      }
    );
  }
});
