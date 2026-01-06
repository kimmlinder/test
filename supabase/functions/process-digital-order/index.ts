import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface ProcessDigitalOrderRequest {
  order_id: string;
  payment_confirmed?: boolean;
}

const handler = async (req: Request): Promise<Response> => {
  console.log("process-digital-order function called");

  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const payload: ProcessDigitalOrderRequest = await req.json();
    console.log("Request payload:", payload);

    if (!payload.order_id) {
      return new Response(
        JSON.stringify({ success: false, error: "Order ID is required" }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Create Supabase client with service role
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Fetch order with items and product details
    const { data: order, error: orderError } = await supabase
      .from("orders")
      .select(`
        *,
        order_items (
          *,
          products (
            id,
            name,
            product_type,
            digital_file_url
          )
        )
      `)
      .eq("id", payload.order_id)
      .single();

    if (orderError || !order) {
      console.error("Error fetching order:", orderError);
      return new Response(
        JSON.stringify({ success: false, error: "Order not found" }),
        { status: 404, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    console.log("Order fetched:", order.id, "Status:", order.status, "Total:", order.total_amount);

    // Check if all items are digital products
    const allDigital = order.order_items?.every(
      (item: any) => item.products?.product_type === "digital"
    );

    if (!allDigital) {
      console.log("Order contains non-digital products, skipping auto-accept");
      return new Response(
        JSON.stringify({ 
          success: true, 
          message: "Order contains physical products, manual processing required",
          is_digital_only: false 
        }),
        { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    console.log("Order is digital-only");

    // Determine target status: free orders (€0) go directly to delivered
    const isFreeOrder = Number(order.total_amount) === 0;
    const targetStatus = isFreeOrder ? "delivered" : "accepted";
    
    console.log(`Order total: ${order.total_amount}, isFreeOrder: ${isFreeOrder}, targetStatus: ${targetStatus}`);

    // Check payment method - auto-accept if paid online OR if free
    const paymentMethod = order.payment_method;
    const shouldAutoAccept = payload.payment_confirmed || paymentMethod === "pay_online" || isFreeOrder;

    if (!shouldAutoAccept) {
      console.log("Payment not confirmed for digital order");
      return new Response(
        JSON.stringify({ 
          success: true, 
          message: "Digital order awaiting payment confirmation",
          is_digital_only: true,
          auto_accepted: false
        }),
        { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Auto-accept/deliver the order
    if (order.status === "pending") {
      const statusMessage = isFreeOrder 
        ? "[Auto-delivered: Free digital order]" 
        : "[Auto-accepted: Digital order with online payment]";
      
      const { error: updateError } = await supabase
        .from("orders")
        .update({ 
          status: targetStatus,
          notes: (order.notes || "") + "\n" + statusMessage
        })
        .eq("id", order.id);

      if (updateError) {
        console.error("Error updating order status:", updateError);
        throw new Error("Failed to update order status");
      }

      // Add timeline entry
      const timelineMessage = isFreeOrder 
        ? "Order automatically delivered - Free digital product" 
        : "Order automatically accepted - Digital product with confirmed payment";
      
      await supabase
        .from("order_timeline")
        .insert({
          order_id: order.id,
          status: targetStatus,
          message: timelineMessage,
        });

      console.log(`Order auto-${targetStatus}:`, order.id);
    }

    // Generate download tokens for digital products
    const digitalProducts = order.order_items
      ?.filter((item: any) => item.products?.digital_file_url)
      ?.map((item: any) => ({
        product_id: item.products.id,
        product_name: item.products.name,
        file_path: item.products.digital_file_url,
      })) || [];

    // Create download tokens (valid for 7 days, max 10 downloads)
    const downloadLinks: { product_name: string; download_url: string; downloads_remaining: number }[] = [];
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days from now
    
    for (const product of digitalProducts) {
      if (product.file_path) {
        // Generate unique download token
        const downloadToken = crypto.randomUUID();
        
        // Store in digital_downloads table
        const { error: insertError } = await supabase
          .from("digital_downloads")
          .insert({
            order_id: order.id,
            product_id: product.product_id,
            download_token: downloadToken,
            max_downloads: 10,
            expires_at: expiresAt.toISOString(),
          });

        if (insertError) {
          console.error("Error creating download token:", insertError);
          continue;
        }

        // Create download URL pointing to our download handler
        const downloadUrl = `${supabaseUrl}/functions/v1/download-file?token=${downloadToken}`;
        
        downloadLinks.push({
          product_name: product.product_name,
          download_url: downloadUrl,
          downloads_remaining: 10,
        });
      }
    }

    console.log("Generated download links:", downloadLinks.length);

    // Get customer email
    let customerEmail = "";
    const emailMatch = order.notes?.match(/Email: ([^\s]+)/);
    if (emailMatch) {
      customerEmail = emailMatch[1];
    } else if (order.user_id) {
      const { data: userData } = await supabase.auth.admin.getUserById(order.user_id);
      customerEmail = userData?.user?.email || "";
    }

    // Get admin emails for notification
    const { data: adminRoles } = await supabase
      .from("user_roles")
      .select("user_id")
      .eq("role", "admin");

    let adminEmails: string[] = [];
    if (adminRoles && adminRoles.length > 0) {
      const { data: adminUsers } = await supabase.auth.admin.listUsers();
      if (adminUsers) {
        adminEmails = adminUsers.users
          .filter(user => adminRoles.some(r => r.user_id === user.id))
          .map(user => user.email)
          .filter(Boolean) as string[];
      }
    }

    // Send emails
    const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
    if (RESEND_API_KEY && downloadLinks.length > 0) {
      const orderRef = order.id.replace(/-/g, '').slice(0, 8).toUpperCase();
      
      const downloadLinksHtml = downloadLinks.map(link => `
        <div style="background: #f9fafb; padding: 16px; border-radius: 8px; margin: 12px 0;">
          <p style="margin: 0 0 8px 0; font-weight: bold;">${link.product_name}</p>
          <a href="${link.download_url}" style="display: inline-block; background: #667eea; color: white; padding: 10px 20px; border-radius: 6px; text-decoration: none;">Download Now →</a>
          <p style="margin: 8px 0 0 0; font-size: 12px; color: #6b7280;">10 downloads allowed • Expires in 7 days</p>
        </div>
      `).join('');

      // Send customer email
      if (customerEmail) {
        const customerEmailHtml = `
          <!DOCTYPE html>
          <html>
            <head>
              <meta charset="utf-8">
              <title>Your Digital Products are Ready!</title>
            </head>
            <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
              <div style="background: linear-gradient(135deg, #10b981 0%, #059669 100%); padding: 24px; border-radius: 12px 12px 0 0;">
                <h1 style="color: white; margin: 0; font-size: 24px;">🎉 Your Downloads are Ready!</h1>
              </div>
              <div style="background: #ffffff; padding: 24px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 12px 12px;">
                <p>Hi ${order.customer_name || 'there'},</p>
                <p>Great news! Your digital products are ready for download.</p>
                
                <div style="background: #d1fae5; border: 1px solid #10b981; padding: 12px; border-radius: 8px; margin: 20px 0;">
                  <p style="margin: 0; color: #065f46;"><strong>Order #${orderRef}</strong> - Ready for Download ✓</p>
                </div>

                <h3 style="margin-top: 24px;">Your Downloads</h3>
                ${downloadLinksHtml}

                <div style="background: #fef3c7; border: 1px solid #f59e0b; padding: 12px; border-radius: 8px; margin: 20px 0;">
                  <p style="margin: 0; color: #92400e; font-size: 14px;">⚠️ Each download link allows up to 10 downloads and expires in 7 days. If you need additional downloads, please contact support.</p>
                </div>

                <p style="margin-top: 24px; color: #6b7280; font-size: 14px;">
                  Thank you for your purchase!
                </p>
                <p style="color: #6b7280; font-size: 14px;">
                  Best regards,<br>
                  The Pixency Team
                </p>
              </div>
            </body>
          </html>
        `;

        try {
          await fetch("https://api.resend.com/emails", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "Authorization": `Bearer ${RESEND_API_KEY}`,
            },
            body: JSON.stringify({
              from: "Pixency <orders@pixency.co>",
              to: [customerEmail],
              subject: `Your Digital Products are Ready - Order #${orderRef}`,
              html: customerEmailHtml,
            }),
          });
          console.log("Customer download email sent to:", customerEmail);
        } catch (emailError) {
          console.error("Failed to send customer email:", emailError);
        }
      }

      // Send admin email with download links
      if (adminEmails.length > 0) {
        const adminEmailHtml = `
          <!DOCTYPE html>
          <html>
            <head>
              <meta charset="utf-8">
              <title>Digital Order Processed</title>
            </head>
            <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
              <div style="background: linear-gradient(135deg, #6366f1 0%, #4f46e5 100%); padding: 24px; border-radius: 12px 12px 0 0;">
                <h1 style="color: white; margin: 0; font-size: 24px;">📦 Digital Order Processed</h1>
              </div>
              <div style="background: #ffffff; padding: 24px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 12px 12px;">
                <p>A digital order has been automatically ${isFreeOrder ? 'delivered' : 'accepted'} and download links have been sent to the customer.</p>
                
                <div style="background: #e0e7ff; border: 1px solid #6366f1; padding: 12px; border-radius: 8px; margin: 20px 0;">
                  <p style="margin: 0;"><strong>Order #${orderRef}</strong></p>
                  <p style="margin: 4px 0 0 0;">Customer: ${order.customer_name || 'N/A'}</p>
                  <p style="margin: 4px 0 0 0;">Email: ${customerEmail || 'N/A'}</p>
                  <p style="margin: 4px 0 0 0;">Total: €${Number(order.total_amount).toFixed(2)}</p>
                  <p style="margin: 4px 0 0 0;">Status: ${targetStatus.charAt(0).toUpperCase() + targetStatus.slice(1)}</p>
                </div>

                <h3 style="margin-top: 24px;">Download Links (for manual resend if needed)</h3>
                ${downloadLinksHtml}

                <p style="margin-top: 24px; color: #6b7280; font-size: 14px;">
                  You can use these links to manually resend to the customer if needed. Each link allows 10 downloads and expires in 7 days.
                </p>
              </div>
            </body>
          </html>
        `;

        try {
          await fetch("https://api.resend.com/emails", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "Authorization": `Bearer ${RESEND_API_KEY}`,
            },
            body: JSON.stringify({
              from: "Pixency <orders@pixency.co>",
              to: adminEmails,
              subject: `Digital Order Processed - Order #${orderRef}`,
              html: adminEmailHtml,
            }),
          });
          console.log("Admin email sent to:", adminEmails);
        } catch (emailError) {
          console.error("Failed to send admin email:", emailError);
        }
      }
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: `Digital order processed successfully - Status: ${targetStatus}`,
        is_digital_only: true,
        auto_accepted: true,
        status: targetStatus,
        download_links: downloadLinks
      }),
      { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );

  } catch (error: any) {
    console.error("Error in process-digital-order function:", error);
    return new Response(
      JSON.stringify({ success: false, error: error.message || "An error occurred" }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
};

serve(handler);