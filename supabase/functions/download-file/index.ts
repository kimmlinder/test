import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const handler = async (req: Request): Promise<Response> => {
  console.log("download-file function called");

  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Get token from URL params
    const url = new URL(req.url);
    const token = url.searchParams.get("token");

    if (!token) {
      return new Response(
        `<!DOCTYPE html>
        <html>
          <head><title>Error</title></head>
          <body style="font-family: sans-serif; max-width: 600px; margin: 50px auto; padding: 20px; text-align: center;">
            <h1 style="color: #ef4444;">Invalid Download Link</h1>
            <p>The download link is missing or invalid.</p>
            <p><a href="https://pixency.co/contact" style="color: #6366f1;">Contact Support</a></p>
          </body>
        </html>`,
        { 
          status: 400, 
          headers: { "Content-Type": "text/html", ...corsHeaders } 
        }
      );
    }

    // Create Supabase client with service role
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Fetch download record
    const { data: downloadRecord, error: fetchError } = await supabase
      .from("digital_downloads")
      .select(`
        *,
        products (
          id,
          name,
          digital_file_url
        )
      `)
      .eq("download_token", token)
      .single();

    if (fetchError || !downloadRecord) {
      console.error("Download record not found:", fetchError);
      return new Response(
        `<!DOCTYPE html>
        <html>
          <head><title>Error</title></head>
          <body style="font-family: sans-serif; max-width: 600px; margin: 50px auto; padding: 20px; text-align: center;">
            <h1 style="color: #ef4444;">Download Link Not Found</h1>
            <p>This download link does not exist or has been removed.</p>
            <p><a href="https://pixency.co/contact" style="color: #6366f1;">Contact Support</a></p>
          </body>
        </html>`,
        { 
          status: 404, 
          headers: { "Content-Type": "text/html", ...corsHeaders } 
        }
      );
    }

    // Check if expired
    const expiresAt = new Date(downloadRecord.expires_at);
    if (expiresAt < new Date()) {
      console.log("Download link expired:", token);
      return new Response(
        `<!DOCTYPE html>
        <html>
          <head><title>Expired</title></head>
          <body style="font-family: sans-serif; max-width: 600px; margin: 50px auto; padding: 20px; text-align: center;">
            <h1 style="color: #f59e0b;">Download Link Expired</h1>
            <p>This download link has expired.</p>
            <p>Please contact support to request new download links.</p>
            <p><a href="https://pixency.co/contact" style="color: #6366f1;">Contact Support</a></p>
          </body>
        </html>`,
        { 
          status: 410, 
          headers: { "Content-Type": "text/html", ...corsHeaders } 
        }
      );
    }

    // Check download count
    if (downloadRecord.download_count >= downloadRecord.max_downloads) {
      console.log("Download limit reached:", token, downloadRecord.download_count, "/", downloadRecord.max_downloads);
      return new Response(
        `<!DOCTYPE html>
        <html>
          <head><title>Limit Reached</title></head>
          <body style="font-family: sans-serif; max-width: 600px; margin: 50px auto; padding: 20px; text-align: center;">
            <h1 style="color: #f59e0b;">Download Limit Reached</h1>
            <p>You have reached the maximum number of downloads (${downloadRecord.max_downloads}) for this product.</p>
            <p>Please contact support if you need additional downloads.</p>
            <p><a href="https://pixency.co/contact" style="color: #6366f1;">Contact Support</a></p>
          </body>
        </html>`,
        { 
          status: 429, 
          headers: { "Content-Type": "text/html", ...corsHeaders } 
        }
      );
    }

    // Get file path
    const filePath = downloadRecord.products?.digital_file_url;
    if (!filePath) {
      console.error("No file path found for product");
      return new Response(
        `<!DOCTYPE html>
        <html>
          <head><title>Error</title></head>
          <body style="font-family: sans-serif; max-width: 600px; margin: 50px auto; padding: 20px; text-align: center;">
            <h1 style="color: #ef4444;">File Not Found</h1>
            <p>The digital file for this product could not be found.</p>
            <p><a href="https://pixency.co/contact" style="color: #6366f1;">Contact Support</a></p>
          </body>
        </html>`,
        { 
          status: 404, 
          headers: { "Content-Type": "text/html", ...corsHeaders } 
        }
      );
    }

    // Increment download count BEFORE generating the URL
    const { error: updateError } = await supabase
      .from("digital_downloads")
      .update({ download_count: downloadRecord.download_count + 1 })
      .eq("id", downloadRecord.id);

    if (updateError) {
      console.error("Error updating download count:", updateError);
    }

    console.log(`Download count updated: ${downloadRecord.download_count + 1}/${downloadRecord.max_downloads}`);

    // Generate signed URL for the actual file (short-lived, 5 minutes)
    const { data: signedUrl, error: signError } = await supabase.storage
      .from("digital-products")
      .createSignedUrl(filePath, 300); // 5 minutes

    if (signError || !signedUrl) {
      console.error("Error creating signed URL:", signError);
      return new Response(
        `<!DOCTYPE html>
        <html>
          <head><title>Error</title></head>
          <body style="font-family: sans-serif; max-width: 600px; margin: 50px auto; padding: 20px; text-align: center;">
            <h1 style="color: #ef4444;">Download Error</h1>
            <p>There was an error generating the download link. Please try again.</p>
            <p><a href="https://pixency.co/contact" style="color: #6366f1;">Contact Support</a></p>
          </body>
        </html>`,
        { 
          status: 500, 
          headers: { "Content-Type": "text/html", ...corsHeaders } 
        }
      );
    }

    // Redirect to the signed URL
    console.log("Redirecting to download:", downloadRecord.products?.name);
    
    return new Response(null, {
      status: 302,
      headers: {
        "Location": signedUrl.signedUrl,
        ...corsHeaders,
      },
    });

  } catch (error: any) {
    console.error("Error in download-file function:", error);
    return new Response(
      `<!DOCTYPE html>
      <html>
        <head><title>Error</title></head>
        <body style="font-family: sans-serif; max-width: 600px; margin: 50px auto; padding: 20px; text-align: center;">
          <h1 style="color: #ef4444;">Server Error</h1>
          <p>An unexpected error occurred. Please try again later.</p>
          <p><a href="https://pixency.co/contact" style="color: #6366f1;">Contact Support</a></p>
        </body>
      </html>`,
      { 
        status: 500, 
        headers: { "Content-Type": "text/html", ...corsHeaders } 
      }
    );
  }
};

serve(handler);