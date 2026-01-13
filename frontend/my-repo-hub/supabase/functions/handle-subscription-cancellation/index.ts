import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { Resend } from "https://esm.sh/resend@2.0.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[SUBSCRIPTION-CANCELLATION] ${step}${detailsStr}`);
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

    const { subscriptionId, customerId, userEmail, planName, appType } = await req.json();

    if (!subscriptionId || !userEmail) {
      throw new Error("Missing required fields");
    }

    // Buscar perfil do usuário
    const { data: profile } = await supabaseClient
      .from("profiles")
      .select("id, name, email")
      .eq("email", userEmail)
      .single();

    if (!profile) {
      logStep("User profile not found", { userEmail });
      throw new Error("User profile not found");
    }

    // Registrar cancelamento
    const { error: cancellationError } = await supabaseClient
      .from("subscription_cancellations")
      .insert({
        user_id: profile.id,
        user_email: userEmail,
        stripe_subscription_id: subscriptionId,
        stripe_customer_id: customerId,
        plan_name: planName,
        app_type: appType || [],
        coupon_sent: false,
      });

    if (cancellationError) throw cancellationError;

    logStep("Cancellation recorded", { userId: profile.id });

    // Buscar cupom ativo de retenção
    const { data: activeCoupon } = await supabaseClient
      .from("retention_coupons")
      .select("*")
      .eq("is_active", true)
      .eq("target_audience", "churned_users")
      .order("created_at", { ascending: false })
      .limit(1)
      .single();

    if (!activeCoupon) {
      logStep("No active retention coupon found");
      return new Response(JSON.stringify({ 
        success: true, 
        message: "Cancellation recorded, but no active coupon" 
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    // Calcular data de expiração
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + activeCoupon.valid_hours);

    // Registrar uso do cupom
    const { error: usageError } = await supabaseClient
      .from("coupon_usage")
      .insert({
        coupon_id: activeCoupon.id,
        user_id: profile.id,
        user_email: userEmail,
        stripe_subscription_id: subscriptionId,
        expires_at: expiresAt.toISOString(),
        status: "sent",
      });

    if (usageError) throw usageError;

    // Marcar cupom como enviado no cancelamento
    await supabaseClient
      .from("subscription_cancellations")
      .update({ coupon_sent: true })
      .eq("stripe_subscription_id", subscriptionId);

    // Enviar email com cupom
    const resendApiKey = Deno.env.get("RESEND_API_KEY");
    if (resendApiKey) {
      const resend = new Resend(resendApiKey);
      
      await resend.emails.send({
        from: "Aitonomy <onboarding@resend.dev>",
        to: [userEmail],
        subject: `🎁 Espera! ${activeCoupon.discount_percent}% OFF só para você!`,
        html: `
          <!DOCTYPE html>
          <html>
          <head>
            <style>
              body { font-family: Arial, sans-serif; background-color: #0f172a; color: #e2e8f0; margin: 0; padding: 20px; }
              .container { max-width: 600px; margin: 0 auto; background: linear-gradient(135deg, #1e1b4b 0%, #312e81 100%); border-radius: 16px; overflow: hidden; box-shadow: 0 20px 60px rgba(0,0,0,0.3); }
              .header { background: linear-gradient(135deg, #8b5cf6 0%, #ec4899 100%); padding: 40px 20px; text-align: center; }
              .header h1 { color: white; margin: 0; font-size: 32px; font-weight: bold; }
              .content { padding: 40px 30px; }
              .coupon { background: linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%); padding: 30px; border-radius: 12px; text-align: center; margin: 30px 0; }
              .coupon-code { font-size: 36px; font-weight: bold; color: #1e1b4b; letter-spacing: 4px; margin: 10px 0; }
              .discount { font-size: 48px; font-weight: bold; color: white; margin-bottom: 10px; }
              .cta-button { display: inline-block; background: linear-gradient(135deg, #8b5cf6 0%, #ec4899 100%); color: white; padding: 16px 40px; text-decoration: none; border-radius: 8px; font-weight: bold; margin: 20px 0; }
              .urgent { color: #fbbf24; font-weight: bold; text-align: center; margin: 20px 0; }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <h1>😔 Sentimos sua saída!</h1>
              </div>
              <div class="content">
                <p style="font-size: 18px;">Olá, <strong>${profile.name || "Amigo"}</strong>!</p>
                
                <p style="font-size: 16px; line-height: 1.6;">
                  Notamos que você cancelou sua assinatura e sentimos muito por isso. Gostaríamos muito de ter você de volta! 🚀
                </p>

                <div class="coupon">
                  <div class="discount">${activeCoupon.discount_percent}% OFF</div>
                  <p style="color: #1e1b4b; margin: 10px 0; font-weight: bold;">Use o cupom:</p>
                  <div class="coupon-code">${activeCoupon.code}</div>
                  <p style="color: #78350f; margin-top: 15px; font-size: 14px;">⏰ Válido por ${activeCoupon.valid_hours} horas!</p>
                </div>

                <p class="urgent">⚡ Esta oferta exclusiva expira em ${activeCoupon.valid_hours} horas!</p>

                <div style="text-align: center;">
                  <a href="${Deno.env.get("VITE_SUPABASE_URL")}/planos?coupon=${activeCoupon.code}" class="cta-button">
                    VOLTAR COM DESCONTO
                  </a>
                </div>
              </div>
            </div>
          </body>
          </html>
        `,
      });

      logStep("Retention email sent", { userEmail, couponCode: activeCoupon.code });
    }

    return new Response(JSON.stringify({ 
      success: true, 
      couponSent: true,
      couponCode: activeCoupon.code,
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
