import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log("Running subscription status check...");

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const now = new Date();
    const threeDaysFromNow = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000);
    const sevenDaysFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

    // 1. Check for expired subscriptions and mark them as expired
    const { data: expiredSubs, error: expiredError } = await supabase
      .from('user_subscriptions')
      .select('*')
      .eq('status', 'active')
      .lt('expires_at', now.toISOString());

    if (expiredError) throw expiredError;

    console.log(`Found ${expiredSubs?.length || 0} expired subscriptions`);

    for (const sub of expiredSubs || []) {
      // Update subscription status to expired
      await supabase
        .from('user_subscriptions')
        .update({ status: 'expired' })
        .eq('id', sub.id);

      // Send expiration notification
      await supabase.functions.invoke('send-subscription-notification', {
        body: {
          user_id: sub.user_id,
          notification_type: 'expired',
        },
      });

      console.log(`Marked subscription ${sub.id} as expired and sent notification`);
    }

    // 2. Check for subscriptions expiring in 3 days
    const { data: expiringSoon3Days, error: expiring3Error } = await supabase
      .from('user_subscriptions')
      .select('*')
      .eq('status', 'active')
      .gte('expires_at', now.toISOString())
      .lte('expires_at', threeDaysFromNow.toISOString());

    if (expiring3Error) throw expiring3Error;

    console.log(`Found ${expiringSoon3Days?.length || 0} subscriptions expiring in 3 days`);

    for (const sub of expiringSoon3Days || []) {
      const daysRemaining = Math.ceil((new Date(sub.expires_at).getTime() - now.getTime()) / (24 * 60 * 60 * 1000));
      
      await supabase.functions.invoke('send-subscription-notification', {
        body: {
          user_id: sub.user_id,
          notification_type: 'expiring_soon',
          expires_at: sub.expires_at,
          days_remaining: daysRemaining,
        },
      });

      console.log(`Sent 3-day expiry reminder for subscription ${sub.id}`);
    }

    // 3. Check for subscriptions expiring in 7 days (only if not already reminded)
    const { data: expiringSoon7Days, error: expiring7Error } = await supabase
      .from('user_subscriptions')
      .select('*')
      .eq('status', 'active')
      .gt('expires_at', threeDaysFromNow.toISOString())
      .lte('expires_at', sevenDaysFromNow.toISOString());

    if (expiring7Error) throw expiring7Error;

    console.log(`Found ${expiringSoon7Days?.length || 0} subscriptions expiring in 7 days`);

    for (const sub of expiringSoon7Days || []) {
      const daysRemaining = Math.ceil((new Date(sub.expires_at).getTime() - now.getTime()) / (24 * 60 * 60 * 1000));
      
      await supabase.functions.invoke('send-subscription-notification', {
        body: {
          user_id: sub.user_id,
          notification_type: 'expiring_soon',
          expires_at: sub.expires_at,
          days_remaining: daysRemaining,
        },
      });

      console.log(`Sent 7-day expiry reminder for subscription ${sub.id}`);
    }

    // 4. Check for pending payments older than 24 hours
    const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    
    const { data: pendingSubs, error: pendingError } = await supabase
      .from('user_subscriptions')
      .select('*')
      .eq('status', 'pending')
      .lt('created_at', oneDayAgo.toISOString());

    if (pendingError) throw pendingError;

    console.log(`Found ${pendingSubs?.length || 0} pending subscriptions older than 24h`);

    for (const sub of pendingSubs || []) {
      await supabase.functions.invoke('send-subscription-notification', {
        body: {
          user_id: sub.user_id,
          notification_type: 'payment_reminder',
        },
      });

      console.log(`Sent payment reminder for pending subscription ${sub.id}`);
    }

    return new Response(
      JSON.stringify({
        success: true,
        expired: expiredSubs?.length || 0,
        expiringIn3Days: expiringSoon3Days?.length || 0,
        expiringIn7Days: expiringSoon7Days?.length || 0,
        pendingReminders: pendingSubs?.length || 0,
      }),
      { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  } catch (error: any) {
    console.error("Error checking subscription status:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
};

serve(handler);
