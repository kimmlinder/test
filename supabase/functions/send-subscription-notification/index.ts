import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "https://esm.sh/resend@2.0.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface SubscriptionNotificationRequest {
  user_id: string;
  notification_type: 'activated' | 'renewed' | 'expiring_soon' | 'expired' | 'payment_reminder';
  expires_at?: string;
  days_remaining?: number;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { user_id, notification_type, expires_at, days_remaining }: SubscriptionNotificationRequest = await req.json();

    console.log(`Processing ${notification_type} notification for user ${user_id}`);

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get user profile and email
    const { data: profile } = await supabase
      .from('profiles')
      .select('full_name')
      .eq('id', user_id)
      .single();

    const { data: authData } = await supabase.auth.admin.getUserById(user_id);
    const userEmail = authData?.user?.email;
    const userName = profile?.full_name || 'Valued Member';

    if (!userEmail) {
      console.error('No email found for user:', user_id);
      return new Response(
        JSON.stringify({ error: 'User email not found' }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Get payment settings for payment link
    const { data: paymentSettings } = await supabase
      .from('payment_settings')
      .select('premium_payment_link, default_revolut_link')
      .single();
    
    const paymentLink = paymentSettings?.premium_payment_link || paymentSettings?.default_revolut_link || '#';

    let subject = '';
    let htmlContent = '';

    switch (notification_type) {
      case 'activated':
        subject = '🎉 Welcome to Premium! Your Subscription is Active';
        htmlContent = `
          <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 40px 20px;">
            <div style="text-align: center; margin-bottom: 40px;">
              <h1 style="color: #f59e0b; font-size: 48px; margin: 0;">👑</h1>
            </div>
            <h1 style="color: #1f2937; font-size: 28px; margin-bottom: 16px;">Welcome to Premium, ${userName}!</h1>
            <p style="color: #6b7280; font-size: 16px; line-height: 1.6; margin-bottom: 24px;">
              Your Premium subscription is now active. You now have unlimited access to all features including:
            </p>
            <ul style="color: #374151; font-size: 16px; line-height: 2; margin-bottom: 24px;">
              <li>✨ Unlimited AI Creations</li>
              <li>🖼️ Unlimited Mockup Generations</li>
              <li>📥 Unlimited Resource Downloads</li>
              <li>⚡ Priority Support</li>
            </ul>
            <p style="color: #6b7280; font-size: 16px; line-height: 1.6; margin-bottom: 24px;">
              Your subscription will renew monthly. We'll send you a reminder before your renewal date.
            </p>
            <div style="text-align: center; margin-top: 32px;">
              <a href="https://pixency.com/member/features" style="display: inline-block; background: linear-gradient(135deg, #f59e0b, #d97706); color: white; text-decoration: none; padding: 14px 32px; border-radius: 8px; font-weight: 600;">
                Start Creating
              </a>
            </div>
            <p style="color: #9ca3af; font-size: 14px; margin-top: 40px; text-align: center;">
              Thank you for supporting PixenCy!
            </p>
          </div>
        `;
        break;

      case 'renewed':
        subject = '✅ Your Premium Subscription Has Been Renewed';
        htmlContent = `
          <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 40px 20px;">
            <div style="text-align: center; margin-bottom: 40px;">
              <h1 style="color: #10b981; font-size: 48px; margin: 0;">✓</h1>
            </div>
            <h1 style="color: #1f2937; font-size: 28px; margin-bottom: 16px;">Subscription Renewed!</h1>
            <p style="color: #6b7280; font-size: 16px; line-height: 1.6; margin-bottom: 24px;">
              Hi ${userName}, your Premium subscription has been successfully renewed. You can continue enjoying unlimited access to all features.
            </p>
            ${expires_at ? `<p style="color: #6b7280; font-size: 16px; line-height: 1.6;">
              <strong>Next renewal date:</strong> ${new Date(expires_at).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
            </p>` : ''}
            <p style="color: #9ca3af; font-size: 14px; margin-top: 40px; text-align: center;">
              Thank you for your continued support!
            </p>
          </div>
        `;
        break;

      case 'expiring_soon':
        subject = `⏰ Your Premium Subscription Expires in ${days_remaining} Days`;
        htmlContent = `
          <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 40px 20px;">
            <div style="text-align: center; margin-bottom: 40px;">
              <h1 style="color: #f59e0b; font-size: 48px; margin: 0;">⏰</h1>
            </div>
            <h1 style="color: #1f2937; font-size: 28px; margin-bottom: 16px;">Renewal Reminder</h1>
            <p style="color: #6b7280; font-size: 16px; line-height: 1.6; margin-bottom: 24px;">
              Hi ${userName}, your Premium subscription will expire in <strong>${days_remaining} days</strong>.
            </p>
            <p style="color: #6b7280; font-size: 16px; line-height: 1.6; margin-bottom: 24px;">
              To continue enjoying unlimited access to AI creations, mockups, and premium features, please renew your subscription.
            </p>
            <div style="background: #fef3c7; border-radius: 8px; padding: 16px; margin-bottom: 24px;">
              <p style="color: #92400e; font-size: 14px; margin: 0;">
                ⚠️ If not renewed, your account will be limited to the free tier after expiry.
              </p>
            </div>
            <div style="text-align: center; margin-top: 32px;">
              <a href="${paymentLink}" style="display: inline-block; background: linear-gradient(135deg, #f59e0b, #d97706); color: white; text-decoration: none; padding: 14px 32px; border-radius: 8px; font-weight: 600;">
                Renew Now - €29/month
              </a>
            </div>
          </div>
        `;
        break;

      case 'expired':
        subject = '❌ Your Premium Subscription Has Expired';
        htmlContent = `
          <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 40px 20px;">
            <div style="text-align: center; margin-bottom: 40px;">
              <h1 style="color: #ef4444; font-size: 48px; margin: 0;">⚠️</h1>
            </div>
            <h1 style="color: #1f2937; font-size: 28px; margin-bottom: 16px;">Subscription Expired</h1>
            <p style="color: #6b7280; font-size: 16px; line-height: 1.6; margin-bottom: 24px;">
              Hi ${userName}, your Premium subscription has expired. Your account has been moved to the free tier with limited access.
            </p>
            <div style="background: #fee2e2; border-radius: 8px; padding: 16px; margin-bottom: 24px;">
              <p style="color: #991b1b; font-size: 14px; margin: 0;">
                Services have been paused. Renew now to restore unlimited access.
              </p>
            </div>
            <p style="color: #6b7280; font-size: 16px; line-height: 1.6; margin-bottom: 24px;">
              Renew your subscription to regain access to:
            </p>
            <ul style="color: #374151; font-size: 16px; line-height: 2; margin-bottom: 24px;">
              <li>✨ Unlimited AI Creations</li>
              <li>🖼️ Unlimited Mockup Generations</li>
              <li>📥 Unlimited Resource Downloads</li>
            </ul>
            <div style="text-align: center; margin-top: 32px;">
              <a href="${paymentLink}" style="display: inline-block; background: linear-gradient(135deg, #f59e0b, #d97706); color: white; text-decoration: none; padding: 14px 32px; border-radius: 8px; font-weight: 600;">
                Renew Now - €29/month
              </a>
            </div>
          </div>
        `;
        break;

      case 'payment_reminder':
        subject = '⚠️ Payment Required - Premium Services Will Be Paused';
        htmlContent = `
          <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 40px 20px;">
            <div style="text-align: center; margin-bottom: 40px;">
              <h1 style="color: #f59e0b; font-size: 48px; margin: 0;">💳</h1>
            </div>
            <h1 style="color: #1f2937; font-size: 28px; margin-bottom: 16px;">Payment Pending</h1>
            <p style="color: #6b7280; font-size: 16px; line-height: 1.6; margin-bottom: 24px;">
              Hi ${userName}, we noticed your Premium subscription payment is still pending.
            </p>
            <div style="background: #fef3c7; border-radius: 8px; padding: 16px; margin-bottom: 24px;">
              <p style="color: #92400e; font-size: 14px; margin: 0;">
                ⚠️ <strong>Important:</strong> Premium services will remain inactive until payment is confirmed.
              </p>
            </div>
            <p style="color: #6b7280; font-size: 16px; line-height: 1.6; margin-bottom: 24px;">
              Please complete your payment to activate your Premium subscription and unlock:
            </p>
            <ul style="color: #374151; font-size: 16px; line-height: 2; margin-bottom: 24px;">
              <li>✨ Unlimited AI Creations</li>
              <li>🖼️ Unlimited Mockup Generations</li>
              <li>📥 Unlimited Resource Downloads</li>
            </ul>
            <div style="text-align: center; margin-top: 32px;">
              <a href="${paymentLink}" style="display: inline-block; background: linear-gradient(135deg, #f59e0b, #d97706); color: white; text-decoration: none; padding: 14px 32px; border-radius: 8px; font-weight: 600;">
                Complete Payment - €29/month
              </a>
            </div>
            <p style="color: #9ca3af; font-size: 14px; margin-top: 40px; text-align: center;">
              If you've already made the payment, please wait for verification (usually within 24 hours).
            </p>
          </div>
        `;
        break;
    }

    const emailResponse = await resend.emails.send({
      from: "PixenCy Premium <onboarding@resend.dev>",
      to: [userEmail],
      subject,
      html: htmlContent,
    });

    console.log("Email sent successfully:", emailResponse);

    // Create in-app notification as well
    let notificationTitle = '';
    let notificationMessage = '';
    let notificationType = 'info';

    switch (notification_type) {
      case 'activated':
        notificationTitle = 'Premium Activated! 🎉';
        notificationMessage = 'Your Premium subscription is now active. Enjoy unlimited access!';
        notificationType = 'success';
        break;
      case 'renewed':
        notificationTitle = 'Subscription Renewed ✅';
        notificationMessage = 'Your Premium subscription has been successfully renewed.';
        notificationType = 'success';
        break;
      case 'expiring_soon':
        notificationTitle = `Subscription Expiring in ${days_remaining} Days ⏰`;
        notificationMessage = 'Please renew to continue enjoying Premium features.';
        notificationType = 'warning';
        break;
      case 'expired':
        notificationTitle = 'Subscription Expired ❌';
        notificationMessage = 'Your Premium subscription has expired. Services have been paused.';
        notificationType = 'error';
        break;
      case 'payment_reminder':
        notificationTitle = 'Payment Pending ⚠️';
        notificationMessage = 'Please complete your payment to activate Premium features.';
        notificationType = 'warning';
        break;
    }

    await supabase.from('notifications').insert({
      user_id,
      title: notificationTitle,
      message: notificationMessage,
      type: notificationType,
      link: '/member/features',
    });

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  } catch (error: any) {
    console.error("Error sending subscription notification:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
};

serve(handler);
