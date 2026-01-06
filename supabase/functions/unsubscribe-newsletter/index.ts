import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const token = url.searchParams.get("token");

    if (!token) {
      return new Response(
        generateHtmlPage("Error", "Invalid unsubscribe link. Missing token."),
        {
          status: 400,
          headers: { "Content-Type": "text/html", ...corsHeaders },
        }
      );
    }

    // Decode the token (base64 encoded email)
    let email: string;
    try {
      email = atob(token);
    } catch {
      return new Response(
        generateHtmlPage("Error", "Invalid unsubscribe token."),
        {
          status: 400,
          headers: { "Content-Type": "text/html", ...corsHeaders },
        }
      );
    }

    console.log("Processing unsubscribe for:", email);

    // Create Supabase client
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Update subscriber status
    const { error } = await supabase
      .from("newsletter_subscribers")
      .update({ is_active: false })
      .eq("email", email);

    if (error) {
      console.error("Error unsubscribing:", error);
      return new Response(
        generateHtmlPage("Error", "Failed to unsubscribe. Please try again later."),
        {
          status: 500,
          headers: { "Content-Type": "text/html", ...corsHeaders },
        }
      );
    }

    console.log("Successfully unsubscribed:", email);

    return new Response(
      generateHtmlPage(
        "Unsubscribed Successfully",
        "You have been successfully unsubscribed from the PixenCy newsletter. We're sorry to see you go!"
      ),
      {
        status: 200,
        headers: { "Content-Type": "text/html", ...corsHeaders },
      }
    );
  } catch (error: any) {
    console.error("Error in unsubscribe-newsletter function:", error);
    return new Response(
      generateHtmlPage("Error", "An unexpected error occurred."),
      {
        status: 500,
        headers: { "Content-Type": "text/html", ...corsHeaders },
      }
    );
  }
};

function generateHtmlPage(title: string, message: string): string {
  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>${title} - PixenCy</title>
        <style>
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body {
            min-height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
            background-color: #0a0a0a;
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
            padding: 20px;
          }
          .container {
            max-width: 480px;
            background-color: #141414;
            border-radius: 16px;
            padding: 48px 40px;
            text-align: center;
          }
          h1 {
            color: #e6b86e;
            font-size: 28px;
            margin-bottom: 16px;
          }
          p {
            color: #a3a3a3;
            font-size: 16px;
            line-height: 1.6;
            margin-bottom: 24px;
          }
          .logo {
            color: #e6b86e;
            font-size: 24px;
            font-weight: 600;
            margin-bottom: 32px;
          }
          a {
            display: inline-block;
            background: linear-gradient(135deg, #e6b86e 0%, #c9a55c 100%);
            color: #0a0a0a;
            text-decoration: none;
            padding: 12px 32px;
            border-radius: 50px;
            font-size: 14px;
            font-weight: 600;
          }
          a:hover {
            opacity: 0.9;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="logo">PixenCy</div>
          <h1>${title}</h1>
          <p>${message}</p>
          <a href="https://pixency.com">Visit Our Website</a>
        </div>
      </body>
    </html>
  `;
}

serve(handler);
