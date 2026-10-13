import { serverConnection } from "../../shared/config.ts";
import { withHttp, authorize } from "../../shared/http.ts";
import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

serve(withHttp(async (req) => {
  try {
    const connection = serverConnection();
    const supabase = createClient(connection.url, connection.key, {auth:{persistSession:false, autoRefreshToken:false}});
    const user = await authorize(req, supabase, 'job');
    const today = new Date().toISOString().split('T')[0];

    // Get all active subscriptions
    const { data: activeSubs, error: subsError } = await supabase
      .from("subscriptions")
      .select("*")
      .eq("status", "active");

    if (subsError) {
      return new Response(
        JSON.stringify({ error: subsError.message }),
        { status: 500, headers: { "Content-Type": "application/json" } }
      );
    }

    // Filter expired subscriptions
    const expired = activeSubs?.filter(s => s.end_date && s.end_date < today) || [];

    // Update expired subscriptions to inactive
    let deactivated = 0;
    for (const s of expired) {
      const { error: updateError } = await supabase
        .from("subscriptions")
        .update({
          status: "inactive",
          updated_at: new Date().toISOString()
        })
        .eq("id", s.id);

      if (!updateError) deactivated++;
    }

    return new Response(
      JSON.stringify({
        expired: expired.length,
        deactivated,
        message: `Deactivated ${deactivated} expired subscription(s).`
      }),
      { headers: { "Content-Type": "application/json" } }
    );

  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: error.status || 500, headers: { "Content-Type": "application/json" } }
    );
  }
}));
