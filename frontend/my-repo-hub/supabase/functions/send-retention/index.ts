import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { Resend } from "https://esm.sh/resend@2.0.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface RetentionRequest {
  userEmail: string;
  userName: string;
  userId: string;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseClient = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
  );

  try {
    const { userEmail, userName, userId }: RetentionRequest = await req.json();

    console.log(`Processing retention for user: ${userEmail}`);

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
      console.log("No active retention coupon found");
      return new Response(
        JSON.stringify({ error: "No active coupon available" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 }
      );
    }

    const resendApiKey = Deno.env.get("RESEND_API_KEY");
    if (!resendApiKey) {
      return new Response(
        JSON.stringify({ error: "Email service not configured (missing RESEND_API_KEY)" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
      );
    }
    const resend = new Resend(resendApiKey);

    // Enviar Email com cupom
    const emailResponse = await resend.emails.send({
      from: "SocialFlow <onboarding@resend.dev>",
      to: [userEmail],
      subject: `🎁 Espera! Você ganhou ${activeCoupon.discount_percent}% OFF!`,
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
            .coupon { background: linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%); padding: 30px; border-radius: 12px; text-align: center; margin: 30px 0; box-shadow: 0 10px 30px rgba(251, 191, 36, 0.3); }
            .coupon-code { font-size: 36px; font-weight: bold; color: #1e1b4b; letter-spacing: 4px; margin: 10px 0; }
            .discount { font-size: 48px; font-weight: bold; color: white; margin-bottom: 10px; }
            .cta-button { display: inline-block; background: linear-gradient(135deg, #8b5cf6 0%, #ec4899 100%); color: white; padding: 16px 40px; text-decoration: none; border-radius: 8px; font-weight: bold; margin: 20px 0; box-shadow: 0 10px 25px rgba(139, 92, 246, 0.4); transition: transform 0.2s; }
            .cta-button:hover { transform: translateY(-2px); }
            .benefits { background: rgba(139, 92, 246, 0.1); padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #8b5cf6; }
            .benefits ul { list-style: none; padding: 0; margin: 10px 0; }
            .benefits li { padding: 8px 0; padding-left: 25px; position: relative; }
            .benefits li:before { content: "✓"; position: absolute; left: 0; color: #8b5cf6; font-weight: bold; }
            .urgent { color: #fbbf24; font-weight: bold; text-align: center; margin: 20px 0; }
            .footer { text-align: center; padding: 20px; color: #94a3b8; font-size: 12px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>🎉 Não Vá Embora!</h1>
            </div>
            <div class="content">
              <p style="font-size: 18px; margin-bottom: 20px;">Olá, <strong>${userName || "Amigo"}</strong>!</p>
              
              <p style="font-size: 16px; line-height: 1.6;">
                Notamos que você estava navegando pela nossa plataforma e queremos muito que você fique! 🚀
              </p>

              <div class="coupon">
                <div class="discount">${activeCoupon.discount_percent}% OFF</div>
                <p style="color: #1e1b4b; margin: 10px 0; font-weight: bold;">Use o cupom:</p>
                <div class="coupon-code">${activeCoupon.code}</div>
                <p style="color: #78350f; margin-top: 15px; font-size: 14px;">⏰ Válido por ${activeCoupon.valid_hours} horas!</p>
              </div>

              <div class="benefits">
                <h3 style="color: #8b5cf6; margin-top: 0;">O que você ganha com nosso plano:</h3>
                <ul>
                  <li>Automação completa para Instagram e WhatsApp</li>
                  <li>IA avançada para respostas automáticas</li>
                  <li>Templates profissionais exclusivos</li>
                  <li>Analytics e relatórios em tempo real</li>
                  <li>Suporte prioritário 24/7</li>
                  <li>Integração com +100 ferramentas</li>
                </ul>
              </div>

              <p class="urgent">⚡ Esta é uma oferta exclusiva e expira em ${activeCoupon.valid_hours} horas!</p>

              <div style="text-align: center;">
                <a href="${Deno.env.get("VITE_SUPABASE_URL")}/planos?coupon=${activeCoupon.code}&user=${userId}" class="cta-button">
                  APROVEITAR DESCONTO AGORA
                </a>
              </div>

              <p style="font-size: 14px; color: #94a3b8; margin-top: 30px; line-height: 1.6;">
                Não perca essa chance de revolucionar sua presença digital com ${activeCoupon.discount_percent}% de desconto! 
                Junte-se a milhares de empresas que já confiam na nossa plataforma.
              </p>
            </div>
            <div class="footer">
              <p>© 2025 SocialFlow. Todos os direitos reservados.</p>
              <p>Esta é uma oferta especial e limitada.</p>
            </div>
          </div>
        </body>
        </html>
      `,
    });

    console.log("Email sent:", emailResponse);

    // Registrar uso do cupom
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + activeCoupon.valid_hours);

    await supabaseClient
      .from("coupon_usage")
      .insert({
        coupon_id: activeCoupon.id,
        user_id: userId,
        user_email: userEmail,
        expires_at: expiresAt.toISOString(),
        status: "sent",
      });

    // Simular envio WhatsApp (você pode integrar com API real)
    console.log(`WhatsApp message would be sent to user ${userId}`);
    
    // Log para analytics
    console.log(`Retention campaign triggered for ${userEmail} with ${activeCoupon.discount_percent}% discount`);

    return new Response(
      JSON.stringify({
        success: true,
        message: "Retention campaign sent successfully",
        email: emailResponse,
      }),
      {
        status: 200,
        headers: {
          "Content-Type": "application/json",
          ...corsHeaders,
        },
      }
    );
  } catch (error: any) {
    console.error("Error in send-retention function:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);
