import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[OMNICHANNEL-WEBHOOK] ${step}${detailsStr}`);
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    logStep("Webhook received");

    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );

    const payload = await req.json();
    logStep("Payload received", { payload });

    const { platform, sender, message, media_url, platform_id } = payload;

    if (!platform || !sender || !message) {
      throw new Error("Missing required fields: platform, sender, message");
    }

    logStep("Processing message", { platform, sender });

    // Find or create contact
    let contact = null;
    const { data: existingContact } = await supabaseClient
      .from("contacts")
      .select("*")
      .eq("platform", platform)
      .eq("platform_id", platform_id || sender)
      .maybeSingle();

    if (existingContact) {
      contact = existingContact;
      logStep("Found existing contact", { id: contact.id });
    } else {
      const { data: newContact, error: contactError } = await supabaseClient
        .from("contacts")
        .insert({
          name: sender,
          platform,
          platform_id: platform_id || sender,
          username: sender,
        })
        .select()
        .single();

      if (contactError) throw contactError;
      contact = newContact;
      logStep("Created new contact", { id: contact.id });
    }

    // Find or create conversation
    let conversation = null;
    const { data: existingConversation } = await supabaseClient
      .from("conversations")
      .select("*")
      .eq("contact_id", contact.id)
      .eq("platform", platform)
      .maybeSingle();

    if (existingConversation) {
      conversation = existingConversation;
      
      // Update conversation
      await supabaseClient
        .from("conversations")
        .update({
          last_message_preview: message.substring(0, 100),
          last_message_at: new Date().toISOString(),
          unread_count: (existingConversation.unread_count || 0) + 1,
        })
        .eq("id", conversation.id);
        
      logStep("Updated existing conversation", { id: conversation.id });
    } else {
      // Get first user to assign conversation
      const { data: users } = await supabaseClient
        .from("profiles")
        .select("id")
        .limit(1)
        .single();

      const { data: newConversation, error: convError } = await supabaseClient
        .from("conversations")
        .insert({
          contact_id: contact.id,
          user_id: users?.id,
          platform,
          status: "active",
          last_message_preview: message.substring(0, 100),
          last_message_at: new Date().toISOString(),
          unread_count: 1,
        })
        .select()
        .single();

      if (convError) throw convError;
      conversation = newConversation;
      logStep("Created new conversation", { id: conversation.id });
    }

    // Insert message
    const { error: messageError } = await supabaseClient
      .from("omnichannel_messages")
      .insert({
        conversation_id: conversation.id,
        sender_type: "customer",
        message_type: media_url ? "media" : "text",
        content: message,
        media_url,
        status: "delivered",
      });

    if (messageError) throw messageError;
    logStep("Message inserted successfully");

    return new Response(
      JSON.stringify({ success: true, conversation_id: conversation.id }),
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
