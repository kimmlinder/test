import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface OrderItem {
  product_id: string;
  quantity: number;
  price_at_purchase: number;
}

interface GuestCheckoutRequest {
  customer_name: string;
  customer_email: string;
  customer_phone: string;
  shipping_address: string;
  special_instructions?: string;
  preferred_delivery_date?: string;
  payment_method?: string;
  total_amount: number;
  items: OrderItem[];
  is_free_order?: boolean;
}

// Input validation functions
function validateEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email) && email.length <= 254;
}

function validatePhone(phone: string): boolean {
  // Allow digits, spaces, dashes, parentheses, and plus sign (minimum 4 characters)
  const phoneRegex = /^[\d\s\-\(\)\+]{4,30}$/;
  return phoneRegex.test(phone);
}

function sanitizeString(input: string, maxLength: number = 500): string {
  if (!input || typeof input !== 'string') return '';
  // Remove potentially dangerous characters while keeping basic punctuation
  return input
    .slice(0, maxLength)
    .replace(/[<>]/g, '') // Remove angle brackets to prevent XSS
    .trim();
}

function validateOrderItems(items: any[]): boolean {
  if (!Array.isArray(items) || items.length === 0 || items.length > 100) {
    return false;
  }
  
  return items.every(item => 
    item.product_id && 
    typeof item.product_id === 'string' &&
    item.product_id.length <= 36 &&
    typeof item.quantity === 'number' && 
    item.quantity > 0 && 
    item.quantity <= 1000 &&
    typeof item.price_at_purchase === 'number' && 
    item.price_at_purchase >= 0 &&
    item.price_at_purchase <= 1000000
  );
}

function validateAmount(amount: any): boolean {
  return typeof amount === 'number' && amount >= 0 && amount <= 10000000;
}

const handler = async (req: Request): Promise<Response> => {
  console.log("guest-checkout function called");

  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const rawPayload = await req.json();
    
    // Sanitize and validate all inputs
    const payload: GuestCheckoutRequest = {
      customer_name: sanitizeString(rawPayload.customer_name, 100),
      customer_email: sanitizeString(rawPayload.customer_email, 254).toLowerCase(),
      customer_phone: sanitizeString(rawPayload.customer_phone, 30),
      shipping_address: sanitizeString(rawPayload.shipping_address, 500),
      special_instructions: sanitizeString(rawPayload.special_instructions || '', 1000),
      preferred_delivery_date: rawPayload.preferred_delivery_date || undefined,
      payment_method: sanitizeString(rawPayload.payment_method || 'pay_on_delivery', 50),
      total_amount: rawPayload.total_amount,
      items: rawPayload.items || [],
    };

    console.log("Request payload:", { ...payload, items: `${payload.items.length} items` });

    // Validate required fields
    if (!payload.customer_name || payload.customer_name.length < 2) {
      return new Response(
        JSON.stringify({ success: false, error: "Valid customer name is required (at least 2 characters)" }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    if (!validateEmail(payload.customer_email)) {
      return new Response(
        JSON.stringify({ success: false, error: "Valid email address is required" }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    if (!validatePhone(payload.customer_phone)) {
      return new Response(
        JSON.stringify({ success: false, error: "Valid phone number is required (at least 4 characters)" }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    if (!payload.shipping_address || payload.shipping_address.trim().length < 3) {
      return new Response(
        JSON.stringify({ success: false, error: "Valid shipping address is required" }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    if (!validateOrderItems(payload.items)) {
      return new Response(
        JSON.stringify({ success: false, error: "Invalid order items" }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    if (!validateAmount(payload.total_amount)) {
      return new Response(
        JSON.stringify({ success: false, error: "Invalid order amount" }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Create Supabase client with service role
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Check if user exists with this email
    const { data: existingUsers } = await supabase.auth.admin.listUsers();
    const existingUser = existingUsers?.users?.find(u => u.email === payload.customer_email);
    
    let userId: string;
    let isGuestOrder = true;
    
    if (existingUser) {
      // Use existing user's ID - this is a registered user
      userId = existingUser.id;
      isGuestOrder = false;
    } else {
      // Generate a random UUID for guest users instead of deterministic hash
      // This prevents predictable UUID generation while still allowing order creation
      userId = crypto.randomUUID();
    }

    // Determine if this is a free order
    const isFreeOrder = payload.total_amount === 0 || rawPayload.is_free_order === true;
    const orderStatus = isFreeOrder ? "accepted" : "pending";

    // Create order with is_guest marker
    const { data: order, error: orderError } = await supabase
      .from("orders")
      .insert({
        user_id: userId,
        total_amount: payload.total_amount,
        status: orderStatus,
        order_type: "standard",
        customer_name: payload.customer_name,
        customer_phone: payload.customer_phone,
        shipping_address: payload.shipping_address,
        special_instructions: isFreeOrder 
          ? `[Free Order] ${payload.special_instructions || ''}`.trim()
          : (payload.special_instructions || null),
        preferred_delivery_date: payload.preferred_delivery_date || null,
        payment_method: payload.payment_method || 'pay_on_delivery',
        // Store guest email in notes for order tracking lookup
        // Also mark as guest order for easier identification
        notes: isGuestOrder 
          ? `Guest order - Email: ${payload.customer_email}` 
          : `Registered user order - Email: ${payload.customer_email}`,
      })
      .select()
      .single();

    if (orderError) {
      console.error("Error creating order:", orderError);
      throw new Error("Failed to create order");
    }

    console.log("Order created:", order.id);

    // Create order items
    const orderItems = payload.items.map(item => ({
      order_id: order.id,
      product_id: item.product_id,
      quantity: item.quantity,
      price_at_purchase: item.price_at_purchase,
    }));

    const { error: itemsError } = await supabase
      .from("order_items")
      .insert(orderItems);

    if (itemsError) {
      console.error("Error creating order items:", itemsError);
      throw new Error("Failed to create order items");
    }

    // Add initial timeline entry
    await supabase
      .from("order_timeline")
      .insert({
        order_id: order.id,
        status: orderStatus,
        message: isFreeOrder 
          ? "Free order completed" 
          : (isGuestOrder ? "Guest order placed successfully" : "Order placed successfully"),
      });

    // Send confirmation email to guest
    if (RESEND_API_KEY) {
      // Fetch payment settings for bank details
      const { data: paymentSettings } = await supabase
        .from("payment_settings")
        .select("*")
        .limit(1)
        .maybeSingle();

      const bankBeneficiary = paymentSettings?.bank_beneficiary || 'Kim Magnus Linder';
      const bankIban = paymentSettings?.bank_iban || 'LT91 3250 0314 3638 0880';
      const bankBic = paymentSettings?.bank_bic || 'REVOLT21';
      const bankName = paymentSettings?.bank_name || 'Revolut Bank UAB';
      const defaultRevolutLink = paymentSettings?.default_revolut_link || 'https://checkout.revolut.com/pay/f0f9a97b-2463-4d00-9ceb-fb1b9806a7e2';

      const isOnlinePayment = payload.payment_method === 'pay_online';
      const isBankTransfer = payload.payment_method === 'bank_transfer';
      const orderRef = order.id.replace(/-/g, '').slice(0, 8).toUpperCase();
      const siteUrl = Deno.env.get("SITE_URL") || "https://pixency.co";
      const trackOrderUrl = `${siteUrl}/order?ref=${orderRef}&email=${encodeURIComponent(payload.customer_email)}`;
      
      const paymentSection = isOnlinePayment ? `
        <div style="background: #fef3c7; border: 1px solid #f59e0b; padding: 16px; border-radius: 8px; margin: 20px 0;">
          <h3 style="margin: 0 0 8px 0; color: #92400e;">⚠️ Complete Your Payment</h3>
          <p style="margin: 0 0 12px 0; color: #92400e;">Your order is pending payment. Click the button below to pay securely via Revolut.</p>
          <a href="${defaultRevolutLink}" style="display: inline-block; background: #667eea; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: bold;">Pay Now →</a>
        </div>
      ` : isBankTransfer ? `
        <div style="background: #dbeafe; border: 1px solid #3b82f6; padding: 16px; border-radius: 8px; margin: 20px 0;">
          <h3 style="margin: 0 0 8px 0; color: #1e40af;">Bank Transfer Details</h3>
          <p style="margin: 0; color: #1e40af; font-size: 14px;">
            <strong>Beneficiary:</strong> ${bankBeneficiary}<br>
            <strong>IBAN:</strong> ${bankIban}<br>
            <strong>BIC/SWIFT:</strong> ${bankBic}<br>
            <strong>Bank:</strong> ${bankName}<br>
            <strong>Reference:</strong> #${orderRef}
          </p>
        </div>
      ` : `
        <div style="background: #d1fae5; border: 1px solid #10b981; padding: 16px; border-radius: 8px; margin: 20px 0;">
          <p style="margin: 0; color: #065f46;"><strong>💵 Pay on Delivery</strong> - You'll pay when your order arrives.</p>
        </div>
      `;

      const emailHtml = `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8">
            <title>Order Confirmation</title>
          </head>
          <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 24px; border-radius: 12px 12px 0 0;">
              <h1 style="color: white; margin: 0; font-size: 24px;">Order Confirmed!</h1>
            </div>
            <div style="background: #ffffff; padding: 24px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 12px 12px;">
              <p>Hi ${payload.customer_name},</p>
              <p>Thank you for your order! We've received it and will start processing it soon.</p>
              
              <div style="background: #f9fafb; padding: 16px; border-radius: 8px; margin: 20px 0;">
                <p style="margin: 0 0 8px 0;"><strong>Order ID:</strong> #${orderRef}</p>
                <p style="margin: 0 0 8px 0;"><strong>Total:</strong> €${Number(payload.total_amount).toFixed(2)}</p>
                <p style="margin: 0;"><strong>Items:</strong> ${payload.items.length} item(s)</p>
              </div>

              ${paymentSection}

              <div style="margin: 20px 0; text-align: center;">
                <a href="${trackOrderUrl}" style="display: inline-block; background: #667eea; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: bold;">Track Your Order →</a>
              </div>

              <h3 style="margin-top: 24px;">Shipping Details</h3>
              <p style="background: #f4f4f4; padding: 12px; border-radius: 8px; margin: 0;">
                ${payload.shipping_address.replace(/\n/g, '<br>')}
              </p>

              <p style="margin-top: 24px; color: #6b7280; font-size: 14px;">
                We'll keep you updated on your order status via email.
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
        const emailResponse = await fetch("https://api.resend.com/emails", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${RESEND_API_KEY}`,
          },
          body: JSON.stringify({
            from: "Pixency <orders@pixency.co>",
            to: [payload.customer_email],
            subject: `Order Confirmed - #${order.id.slice(0, 8)}`,
            html: emailHtml,
          }),
        });

        const emailData = await emailResponse.json();
        console.log("Email sent to customer:", emailData);
      } catch (emailError) {
        console.error("Failed to send confirmation email:", emailError);
        // Don't throw - order is still created successfully
      }
    }

    // Notify admins (fire and forget)
    try {
      await supabase.functions.invoke("notify-admin-new-order", {
        body: {
          order_id: order.id,
          customer_name: payload.customer_name,
          customer_phone: payload.customer_phone,
          customer_email: payload.customer_email,
          total_amount: payload.total_amount,
          items_count: payload.items.length,
          is_guest: isGuestOrder,
        },
      });
    } catch (notifyError) {
      console.error("Failed to notify admins:", notifyError);
    }

    // Process digital orders - auto-accept if paid online or free
    if (payload.payment_method === "pay_online" || isFreeOrder) {
      try {
        await supabase.functions.invoke("process-digital-order", {
          body: {
            order_id: order.id,
            payment_confirmed: true,
          },
        });
      } catch (digitalError) {
        console.error("Failed to process digital order:", digitalError);
      }
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        order_id: order.id,
        message: "Order placed successfully" 
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  } catch (error: any) {
    console.error("Error in guest-checkout function:", error);
    return new Response(
      JSON.stringify({ success: false, error: "An error occurred while processing your order" }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);
