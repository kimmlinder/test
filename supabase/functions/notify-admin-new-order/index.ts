import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface NewOrderRequest {
  order_id: string;
  customer_name: string;
  customer_phone: string;
  total_amount: number;
  items_count: number;
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { order_id, customer_name, customer_phone, total_amount, items_count }: NewOrderRequest = await req.json();

    console.log(`Processing new order notification for order ${order_id}`);

    // Get all admin users
    const { data: adminRoles, error: rolesError } = await supabase
      .from("user_roles")
      .select("user_id")
      .eq("role", "admin");

    if (rolesError) {
      console.error("Error fetching admin roles:", rolesError);
      throw rolesError;
    }

    if (!adminRoles || adminRoles.length === 0) {
      console.log("No admin users found to notify");
      return new Response(
        JSON.stringify({ message: "No admin users to notify" }),
        { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Get admin emails from auth.users
    const adminUserIds = adminRoles.map(r => r.user_id);
    const { data: adminUsers, error: usersError } = await supabase.auth.admin.listUsers();
    
    if (usersError) {
      console.error("Error fetching admin users:", usersError);
      throw usersError;
    }

    const adminEmails = adminUsers.users
      .filter(user => adminUserIds.includes(user.id))
      .map(user => user.email)
      .filter(Boolean) as string[];

    if (adminEmails.length === 0) {
      console.log("No admin emails found");
      return new Response(
        JSON.stringify({ message: "No admin emails found" }),
        { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    console.log(`Sending notification to ${adminEmails.length} admin(s):`, adminEmails);

    // Send email to all admins using fetch
    const emailResponse = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: "Orders <orders@pixency.co>",
        to: adminEmails,
        subject: `🛒 New Order Received - $${total_amount.toFixed(2)}`,
        html: `
          <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <h1 style="color: #333; margin-bottom: 24px;">New Order Received!</h1>
            
            <div style="background: #f8f9fa; padding: 20px; border-radius: 12px; margin-bottom: 24px;">
              <h2 style="margin: 0 0 16px 0; color: #333;">Order #${order_id.slice(0, 8)}</h2>
              
              <table style="width: 100%; border-collapse: collapse;">
                <tr>
                  <td style="padding: 8px 0; color: #666;">Customer:</td>
                  <td style="padding: 8px 0; font-weight: 600;">${customer_name}</td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; color: #666;">Phone:</td>
                  <td style="padding: 8px 0;">${customer_phone}</td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; color: #666;">Items:</td>
                  <td style="padding: 8px 0;">${items_count} item(s)</td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; color: #666;">Total:</td>
                  <td style="padding: 8px 0; font-weight: 600; font-size: 18px; color: #16a34a;">$${total_amount.toFixed(2)}</td>
                </tr>
              </table>
            </div>
            
            <p style="color: #666; margin-bottom: 24px;">
              Please review this order in your admin dashboard and update the status accordingly.
            </p>
            
            <p style="color: #999; font-size: 12px;">
              This is an automated notification. Please do not reply to this email.
            </p>
          </div>
        `,
      }),
    });

    const emailData = await emailResponse.json();
    console.log("Email response:", emailData);

    if (!emailResponse.ok) {
      throw new Error(emailData.message || "Failed to send email");
    }

    return new Response(
      JSON.stringify({ success: true, emailData }),
      { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  } catch (error: any) {
    console.error("Error in notify-admin-new-order function:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
};

serve(handler);