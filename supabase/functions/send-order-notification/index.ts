import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface OrderNotificationRequest {
  orderId: string;
  newStatus: string;
  trackingNumber?: string;
  message?: string;
}

const statusMessages: Record<string, { subject: string; heading: string; body: string }> = {
  accepted: {
    subject: "Order Accepted",
    heading: "Your order has been accepted!",
    body: "Great news! We've reviewed your order and confirmed we can proceed with it. We'll start working on it soon.",
  },
  in_progress: {
    subject: "Working on Your Order",
    heading: "We're working on your order",
    body: "Exciting update! We've started working on your order and are putting our best effort into creating something amazing for you.",
  },
  preview_sent: {
    subject: "Preview Ready for Review",
    heading: "Your preview is ready!",
    body: "We've completed a preview of your order and it's ready for your review. Please let us know if you'd like any changes before we finalize it.",
  },
  shipped: {
    subject: "Order Sent",
    heading: "Your order is on its way!",
    body: "Great news! Your order has been completed and is on its way to you.",
  },
  delivered: {
    subject: "Order Delivered",
    heading: "Your order has been delivered",
    body: "Your order has been successfully delivered. We hope you enjoy your purchase!",
  },
  cancelled: {
    subject: "Order Cancelled",
    heading: "Your order has been cancelled",
    body: "We're sorry to inform you that your order has been cancelled. If you have any questions, please contact our support team.",
  },
  // Legacy statuses
  confirmed: {
    subject: "Order Confirmed",
    heading: "Your order has been confirmed!",
    body: "Thank you for your order. We've received your payment and will begin processing your order shortly.",
  },
  processing: {
    subject: "Order Being Processed",
    heading: "We're preparing your order",
    body: "Great news! Your order is now being prepared and will be shipped soon.",
  },
};

const handler = async (req: Request): Promise<Response> => {
  console.log("send-order-notification function called");

  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { orderId, newStatus, trackingNumber, message }: OrderNotificationRequest = await req.json();
    console.log("Request payload:", { orderId, newStatus, trackingNumber, message });

    if (!orderId || !newStatus) {
      throw new Error("Missing required fields: orderId and newStatus");
    }

    // Skip sending email for pending status
    if (newStatus === "pending") {
      console.log("Skipping email for pending status");
      return new Response(
        JSON.stringify({ success: true, message: "No email sent for pending status" }),
        { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Create Supabase client
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Fetch order details
    const { data: order, error: orderError } = await supabase
      .from("orders")
      .select("*")
      .eq("id", orderId)
      .single();

    if (orderError || !order) {
      console.error("Error fetching order:", orderError);
      throw new Error("Order not found");
    }

    // Fetch profile for user name
    const { data: profile } = await supabase
      .from("profiles")
      .select("full_name")
      .eq("id", order.user_id)
      .maybeSingle();

    // Get user email from auth
    const { data: userData, error: userError } = await supabase.auth.admin.getUserById(order.user_id);

    if (userError || !userData.user?.email) {
      console.error("Error fetching user:", userError);
      throw new Error("User email not found");
    }

    const userEmail = userData.user.email;
    const userName = profile?.full_name || "Valued Customer";
    const statusInfo = statusMessages[newStatus] || {
      subject: `Order Update: ${newStatus}`,
      heading: `Order status updated to ${newStatus}`,
      body: message || `Your order status has been updated to ${newStatus}.`,
    };

    console.log("Sending email to:", userEmail);

    // Build order reference for tracking
    const orderRef = orderId.replace(/-/g, '').slice(0, 8).toUpperCase();
    const siteUrl = Deno.env.get("SITE_URL") || "https://pixency.co";
    const trackOrderUrl = `${siteUrl}/order?ref=${orderRef}&email=${encodeURIComponent(userEmail)}`;

    // Build email HTML
    const trackingHtml = trackingNumber
      ? `<p style="margin: 16px 0; padding: 12px; background-color: #f4f4f4; border-radius: 8px;"><strong>Tracking Number:</strong> ${trackingNumber}</p>`
      : "";

    const customMessageHtml = message
      ? `<p style="margin: 16px 0; padding: 12px; background-color: #e8f4fd; border-radius: 8px;">${message}</p>`
      : "";

    // Fetch bank details for bank_transfer orders when status is accepted
    let bankDetailsHtml = "";
    if (newStatus === "accepted" && order.payment_method === "bank_transfer") {
      const { data: paymentSettings } = await supabase
        .from("payment_settings")
        .select("*")
        .limit(1)
        .maybeSingle();

      if (paymentSettings) {
        bankDetailsHtml = `
          <div style="margin: 24px 0; padding: 20px; background-color: #f0f9ff; border: 2px solid #0ea5e9; border-radius: 12px;">
            <h3 style="margin: 0 0 16px 0; color: #0369a1; font-size: 18px;">💳 Bank Transfer Details</h3>
            <p style="margin: 0 0 12px 0; color: #333;">Please transfer <strong style="color: #0369a1; font-size: 18px;">€${Number(order.total_amount).toFixed(2)}</strong> to the following account:</p>
            
            <div style="background: white; padding: 16px; border-radius: 8px; margin-top: 12px;">
              <table style="width: 100%; border-collapse: collapse;">
                <tr style="border-bottom: 1px solid #e5e7eb;">
                  <td style="padding: 8px 0; color: #6b7280; width: 120px;">Beneficiary</td>
                  <td style="padding: 8px 0; font-weight: 600;">${paymentSettings.bank_beneficiary}</td>
                </tr>
                <tr style="border-bottom: 1px solid #e5e7eb;">
                  <td style="padding: 8px 0; color: #6b7280;">Bank</td>
                  <td style="padding: 8px 0; font-weight: 600;">${paymentSettings.bank_name}</td>
                </tr>
                <tr style="border-bottom: 1px solid #e5e7eb;">
                  <td style="padding: 8px 0; color: #6b7280;">IBAN</td>
                  <td style="padding: 8px 0; font-family: monospace; font-weight: 600;">${paymentSettings.bank_iban}</td>
                </tr>
                <tr style="border-bottom: 1px solid #e5e7eb;">
                  <td style="padding: 8px 0; color: #6b7280;">BIC / SWIFT</td>
                  <td style="padding: 8px 0; font-family: monospace; font-weight: 600;">${paymentSettings.bank_bic}</td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; color: #6b7280;">Reference</td>
                  <td style="padding: 8px 0; font-family: monospace; font-weight: 600; color: #0369a1;">${orderRef}</td>
                </tr>
              </table>
            </div>
            
            <p style="margin: 16px 0 0 0; color: #6b7280; font-size: 14px;">
              ⚠️ Please include the order reference <strong>${orderRef}</strong> in your payment so we can identify your transfer.
            </p>
          </div>
        `;
      }
    }

    const emailHtml = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <title>${statusInfo.subject}</title>
        </head>
        <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 24px; border-radius: 12px 12px 0 0;">
            <h1 style="color: white; margin: 0; font-size: 24px;">${statusInfo.heading}</h1>
          </div>
          <div style="background: #ffffff; padding: 24px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 12px 12px;">
            <p>Hi ${userName},</p>
            <p>${statusInfo.body}</p>
            ${bankDetailsHtml}
            ${trackingHtml}
            ${customMessageHtml}
            <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 24px 0;" />
            <div style="background: #f9fafb; padding: 16px; border-radius: 8px;">
              <p style="margin: 0 0 8px 0;"><strong>Order ID:</strong> #${orderRef}</p>
              <p style="margin: 0 0 8px 0;"><strong>Total:</strong> €${Number(order.total_amount).toFixed(2)}</p>
              <p style="margin: 0;"><strong>Status:</strong> ${newStatus.charAt(0).toUpperCase() + newStatus.slice(1)}</p>
            </div>
            <div style="margin-top: 20px; text-align: center;">
              <a href="${trackOrderUrl}" style="display: inline-block; background: #667eea; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: bold;">Track Your Order →</a>
            </div>
            <p style="margin-top: 24px; color: #6b7280; font-size: 14px;">
              If you have any questions, please don't hesitate to contact us.
            </p>
            <p style="color: #6b7280; font-size: 14px;">
              Best regards,<br>
              The Team
            </p>
          </div>
        </body>
      </html>
    `;

    const emailResponse = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: "Orders <orders@pixency.co>",
        to: [userEmail],
        subject: `${statusInfo.subject} - Order #${orderId.slice(0, 8)}`,
        html: emailHtml,
      }),
    });

    const emailData = await emailResponse.json();

    console.log("Email sent successfully:", emailData);

    if (!emailResponse.ok) {
      throw new Error(emailData.message || "Failed to send email");
    }

    return new Response(
      JSON.stringify({ success: true, data: emailData }),
      {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  } catch (error: any) {
    console.error("Error in send-order-notification function:", error);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);
