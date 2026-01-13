import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.74.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Authenticate request
    const authHeader = req.headers.get('Authorization')!;
    const { data: { user }, error: authError } = await supabase.auth.getUser(
      authHeader.replace('Bearer ', '')
    );

    if (authError || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Check if user is superadmin
    const { data: roles } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .eq('role', 'superadmin');

    if (!roles || roles.length === 0) {
      return new Response(JSON.stringify({ error: 'Forbidden' }), {
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { action, userId, email } = await req.json();

    switch (action) {
      case 'add':
        // Create user if doesn't exist
        let targetUserId = userId;
        if (!targetUserId && email) {
          // List all users and find by email
          const { data: { users }, error: listError } = await supabase.auth.admin.listUsers();
          const existingUser = users?.find(u => u.email === email);
          
          if (existingUser) {
            targetUserId = existingUser.id;
          } else {
            // Send invitation email
            const { data: newUser, error: inviteError } = await supabase.auth.admin.inviteUserByEmail(email);
            if (inviteError) throw inviteError;
            targetUserId = newUser.user?.id;
          }
        }

        // Add superadmin role
        const { error: addError } = await supabase
          .from('user_roles')
          .insert({
            user_id: targetUserId,
            role: 'superadmin'
          });

        if (addError) throw addError;

        return new Response(JSON.stringify({ success: true, userId: targetUserId }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });

      case 'remove':
        // Remove superadmin role
        const { error: removeError } = await supabase
          .from('user_roles')
          .delete()
          .eq('user_id', userId)
          .eq('role', 'superadmin');

        if (removeError) throw removeError;

        return new Response(JSON.stringify({ success: true }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });

      case 'list':
        // List all superadmins
        const { data: superadmins, error: listError } = await supabase
          .from('user_roles')
          .select('user_id, profiles(name, email)')
          .eq('role', 'superadmin');

        if (listError) throw listError;

        return new Response(JSON.stringify({ superadmins }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });

      default:
        return new Response(JSON.stringify({ error: 'Invalid action' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
    }
  } catch (error) {
    console.error('Error:', error);
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
