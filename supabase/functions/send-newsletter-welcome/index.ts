import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface WelcomeEmailRequest {
  email: string;
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { email }: WelcomeEmailRequest = await req.json();
    
    console.log("Sending welcome email to:", email);

    // Generate unsubscribe token (base64 encoded email)
    const unsubscribeToken = btoa(email);
    const supabaseUrl = Deno.env.get("SUPABASE_URL") || "";
    const unsubscribeUrl = `${supabaseUrl}/functions/v1/unsubscribe-newsletter?token=${unsubscribeToken}`;

    const emailHtml = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="margin: 0; padding: 0; background-color: #0a0a0a; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;">
          <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #0a0a0a; padding: 40px 20px;">
            <tr>
              <td align="center">
                <table width="600" cellpadding="0" cellspacing="0" style="background-color: #141414; border-radius: 16px; overflow: hidden;">
                  <!-- Header -->
                  <tr>
                    <td style="background: linear-gradient(135deg, #e6b86e 0%, #c9a55c 100%); padding: 40px; text-align: center;">
                      <h1 style="margin: 0; color: #0a0a0a; font-size: 32px; font-weight: 600;">PixenCy</h1>
                    </td>
                  </tr>
                  
                  <!-- Content -->
                  <tr>
                    <td style="padding: 48px 40px;">
                      <h2 style="margin: 0 0 24px; color: #ffffff; font-size: 28px; font-weight: 600; text-align: center;">
                        Welcome to Our Creative Community! 🎉
                      </h2>
                      
                      <p style="margin: 0 0 20px; color: #a3a3a3; font-size: 16px; line-height: 1.6;">
                        Thank you for subscribing to the PixenCy newsletter! You're now part of an exclusive community of creatives and design enthusiasts.
                      </p>
                      
                      <p style="margin: 0 0 20px; color: #a3a3a3; font-size: 16px; line-height: 1.6;">
                        Here's what you can expect:
                      </p>
                      
                      <ul style="margin: 0 0 24px; padding-left: 20px; color: #a3a3a3; font-size: 16px; line-height: 1.8;">
                        <li>🚀 Early access to new product releases</li>
                        <li>💎 Exclusive discounts and offers</li>
                        <li>🎨 Behind-the-scenes looks at our creative process</li>
                        <li>💡 Tips and tutorials to elevate your work</li>
                      </ul>
                      
                      <p style="margin: 0 0 32px; color: #a3a3a3; font-size: 16px; line-height: 1.6;">
                        We're excited to have you on board and can't wait to share our latest creations with you!
                      </p>
                      
                      <table width="100%" cellpadding="0" cellspacing="0">
                        <tr>
                          <td align="center">
                            <a href="https://pixency.co/shop" style="display: inline-block; background: linear-gradient(135deg, #e6b86e 0%, #c9a55c 100%); color: #0a0a0a; text-decoration: none; padding: 16px 40px; border-radius: 50px; font-size: 16px; font-weight: 600;">
                              Browse Our Products
                            </a>
                          </td>
                        </tr>
                      </table>
                    </td>
                  </tr>
                  
                  <!-- Footer -->
                  <tr>
                    <td style="padding: 24px 40px; border-top: 1px solid #262626; text-align: center;">
                      <p style="margin: 0 0 12px; color: #525252; font-size: 14px;">
                        © 2025 PixenCy. All rights reserved.
                      </p>
                      <p style="margin: 0 0 8px; color: #525252; font-size: 12px;">
                        You received this email because you subscribed to our newsletter.
                      </p>
                      <p style="margin: 0;">
                        <a href="${unsubscribeUrl}" style="color: #737373; font-size: 12px; text-decoration: underline;">Unsubscribe</a>
                      </p>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
          </table>
        </body>
      </html>
    `;

    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: "PixenCy <noreply@pixency.co>",
        to: [email],
        subject: "Welcome to PixenCy Newsletter! 🎨",
        html: emailHtml,
      }),
    });

    const data = await res.json();

    if (!res.ok) {
      console.error("Resend API error:", data);
      throw new Error(data.message || "Failed to send email");
    }

    console.log("Welcome email sent successfully:", data);

    return new Response(JSON.stringify(data), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        ...corsHeaders,
      },
    });
  } catch (error: any) {
    console.error("Error in send-newsletter-welcome function:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);
