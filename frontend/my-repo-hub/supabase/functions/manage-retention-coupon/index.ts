import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[MANAGE-RETENTION-COUPON] ${step}${detailsStr}`);
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseClient = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
  );

  try {
    logStep("Function started");

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("No authorization header");

    const token = authHeader.replace("Bearer ", "");
    const { data } = await supabaseClient.auth.getUser(token);
    const user = data.user;
    
    if (!user) throw new Error("User not authenticated");

    // Verificar se é superadmin
    const { data: roles } = await supabaseClient
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id)
      .eq("role", "superadmin")
      .single();

    if (!roles) throw new Error("Unauthorized - Superadmin only");

    const { action, couponData } = await req.json();
    logStep("Request received", { action });

    const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "", {
      apiVersion: "2025-08-27.basil",
    });

    if (action === "create") {
      // Criar cupom no Stripe
      const stripeCoupon = await stripe.coupons.create({
        percent_off: couponData.discount_percent,
        duration: "once",
        name: couponData.code,
      });

      // Criar cupom no banco
      const { data: newCoupon, error } = await supabaseClient
        .from("retention_coupons")
        .insert({
          code: couponData.code,
          discount_percent: couponData.discount_percent,
          valid_hours: couponData.valid_hours,
          stripe_coupon_id: stripeCoupon.id,
          is_active: true,
          created_by: user.id,
        })
        .select()
        .single();

      if (error) throw error;

      logStep("Coupon created", { couponId: newCoupon.id });
      return new Response(JSON.stringify({ success: true, coupon: newCoupon }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    if (action === "update") {
      const { couponId, updates } = couponData;

      // Se houver mudança no desconto, criar novo cupom no Stripe
      let stripeCouponId = updates.stripe_coupon_id;
      if (updates.discount_percent) {
        const stripeCoupon = await stripe.coupons.create({
          percent_off: updates.discount_percent,
          duration: "once",
          name: updates.code || "UPDATED",
        });
        stripeCouponId = stripeCoupon.id;
      }

      const { data: updatedCoupon, error } = await supabaseClient
        .from("retention_coupons")
        .update({
          ...updates,
          stripe_coupon_id: stripeCouponId,
          updated_at: new Date().toISOString(),
        })
        .eq("id", couponId)
        .select()
        .single();

      if (error) throw error;

      logStep("Coupon updated", { couponId });
      return new Response(JSON.stringify({ success: true, coupon: updatedCoupon }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    if (action === "list") {
      const { data: coupons, error } = await supabaseClient
        .from("retention_coupons")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;

      return new Response(JSON.stringify({ success: true, coupons }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    throw new Error("Invalid action");
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("ERROR", { message: errorMessage });
    return new Response(JSON.stringify({ error: errorMessage }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
