import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const { password, petName } = await req.json();

    const adminPass = Deno.env.get("ADMIN_PASSWORD");
    const adminPet = Deno.env.get("ADMIN_PET_NAME");

    if (!adminPass || !adminPet || password !== adminPass || petName !== adminPet) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    // Get users
    const { data: usersData } = await supabaseAdmin.auth.admin.listUsers({ perPage: 1000 });
    const users = (usersData?.users || []).map(u => ({
      id: u.id,
      email: u.email || "N/A",
      created_at: u.created_at,
      last_sign_in_at: u.last_sign_in_at,
    }));

    // Get aggregate counts
    const { count: totalTodos } = await supabaseAdmin.from("todos").select("*", { count: "exact", head: true });
    const { count: totalEvents } = await supabaseAdmin.from("scheduled_events").select("*", { count: "exact", head: true });
    const { count: totalJournals } = await supabaseAdmin.from("mood_notes").select("*", { count: "exact", head: true });
    const { count: totalProfiles } = await supabaseAdmin.from("profiles").select("*", { count: "exact", head: true });

    return new Response(JSON.stringify({
      users,
      totalRegistered: users.length,
      totalProfiles: totalProfiles || 0,
      totalTodos: totalTodos || 0,
      totalEvents: totalEvents || 0,
      totalJournals: totalJournals || 0,
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
