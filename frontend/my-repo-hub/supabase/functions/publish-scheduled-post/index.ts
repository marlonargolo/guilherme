import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[PUBLISH-POST] ${step}${detailsStr}`);
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    logStep("Function started");

    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("No authorization header");

    const token = authHeader.replace("Bearer ", "");
    const { data: userData, error: userError } = await supabaseClient.auth.getUser(token);
    if (userError) throw userError;
    const user = userData.user;
    if (!user) throw new Error("User not authenticated");

    logStep("User authenticated", { userId: user.id });

    const { postId } = await req.json();
    if (!postId) throw new Error("Post ID is required");

    logStep("Publishing post", { postId });

    // Get post details
    const { data: post, error: postError } = await supabaseClient
      .from("scheduled_posts")
      .select("*")
      .eq("id", postId)
      .eq("user_id", user.id)
      .single();

    if (postError) throw postError;
    if (!post) throw new Error("Post not found");

    logStep("Post found", { platforms: post.platforms });

    // Get user integrations
    const { data: integrations, error: intError } = await supabaseClient
      .from("integrations")
      .select("*")
      .eq("user_id", user.id)
      .in("channel", post.platforms)
      .eq("status", "connected");

    if (intError) throw intError;

    logStep("Integrations found", { count: integrations?.length || 0 });

    const results = [];

    // Publish to each platform
    for (const integration of integrations || []) {
      try {
        logStep("Publishing to platform", { platform: integration.channel });

        // Here you would implement actual API calls to each platform
        // For now, we'll simulate success
        
        results.push({
          platform: integration.channel,
          success: true,
          message: "Post published successfully (simulated)",
        });
      } catch (error) {
        logStep("Error publishing to platform", {
          platform: integration.channel,
          error: error instanceof Error ? error.message : String(error),
        });
        
        results.push({
          platform: integration.channel,
          success: false,
          error: error instanceof Error ? error.message : String(error),
        });
      }
    }

    // Update post status
    const allSuccess = results.every(r => r.success);
    await supabaseClient
      .from("scheduled_posts")
      .update({
        status: allSuccess ? "published" : "failed",
        published_at: allSuccess ? new Date().toISOString() : null,
      })
      .eq("id", postId);

    logStep("Post status updated", { status: allSuccess ? "published" : "failed" });

    return new Response(
      JSON.stringify({
        success: true,
        results,
        post_id: postId,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("ERROR", { message: errorMessage });
    
    return new Response(
      JSON.stringify({ error: errorMessage }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      }
    );
  }
});
