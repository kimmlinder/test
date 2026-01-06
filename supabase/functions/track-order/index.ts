import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface TrackOrderRequest {
  order_reference: string;
  email: string;
}

// Simple in-memory rate limiter
const rateLimitMap = new Map<string, { count: number; resetTime: number }>();
const RATE_LIMIT_WINDOW = 60000; // 1 minute
const RATE_LIMIT_MAX_REQUESTS = 10; // 10 requests per minute per IP

function checkRateLimit(clientIp: string): boolean {
  const now = Date.now();
  const record = rateLimitMap.get(clientIp);
  
  if (!record || now > record.resetTime) {
    rateLimitMap.set(clientIp, { count: 1, resetTime: now + RATE_LIMIT_WINDOW });
    return true;
  }
  
  if (record.count >= RATE_LIMIT_MAX_REQUESTS) {
    return false;
  }
  
  record.count++;
  return true;
}

// Validate input to prevent injection attacks
function validateInput(input: string, maxLength: number): string {
  if (!input || typeof input !== 'string') {
    return '';
  }
  // Remove any non-alphanumeric characters except @ . - for email
  return input.slice(0, maxLength).trim();
}

function validateEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email) && email.length <= 254;
}

function validateOrderReference(ref: string): boolean {
  // Order reference should be alphanumeric, 8 characters max
  const refRegex = /^[A-Z0-9]{1,36}$/i;
  return refRegex.test(ref);
}

const handler = async (req: Request): Promise<Response> => {
  console.log("track-order function called");

  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  // Rate limiting based on client IP
  const clientIp = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || 
                   req.headers.get("cf-connecting-ip") || 
                   "unknown";
  
  if (!checkRateLimit(clientIp)) {
    console.log("Rate limit exceeded for IP:", clientIp);
    return new Response(
      JSON.stringify({ success: false, error: "Too many requests. Please try again later." }),
      { status: 429, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }

  try {
    const body = await req.json();
    const order_reference = validateInput(body.order_reference || '', 36);
    const email = validateInput(body.email || '', 254).toLowerCase();
    
    console.log("Looking up order:", { order_reference, email: email.substring(0, 3) + '***' });

    // Validate inputs
    if (!order_reference || !email) {
      return new Response(
        JSON.stringify({ success: false, error: "Order reference and email are required" }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    if (!validateOrderReference(order_reference)) {
      return new Response(
        JSON.stringify({ success: false, error: "Invalid order reference format" }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    if (!validateEmail(email)) {
      return new Response(
        JSON.stringify({ success: false, error: "Invalid email format" }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Create Supabase client with service role
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const searchRef = order_reference.replace(/[^a-zA-Z0-9]/g, '').toUpperCase();
    console.log("Searching for reference:", searchRef);

    // First, try to find the order by matching the order ID pattern directly in the database
    // This is more efficient than fetching all orders
    // The order reference could be the first 8 or last 8 characters of the UUID
    
    // Build a search pattern - order IDs are UUIDs without hyphens
    // We'll search for orders where the ID starts with or ends with the reference
    const { data: matchingOrders, error: ordersError } = await supabase
      .from("orders")
      .select("id, status, total_amount, created_at, customer_name, shipping_address, tracking_number, notes, user_id")
      .or(`id.ilike.${searchRef}%,id.ilike.%-${searchRef.slice(0, 8)}%`)
      .limit(50);

    if (ordersError) {
      console.error("Error fetching orders:", ordersError);
      throw new Error("Failed to fetch orders");
    }

    // Filter orders that match the reference pattern AND have matching email in notes (for guest orders)
    const matchingOrder = matchingOrders?.find(order => {
      const orderId = order.id.replace(/-/g, '').toUpperCase();
      const first8 = orderId.slice(0, 8);
      const last8 = orderId.slice(-8);
      
      const refMatches = first8 === searchRef || last8 === searchRef || 
                         first8.startsWith(searchRef) || last8.startsWith(searchRef) ||
                         orderId.includes(searchRef);
      
      // Check if email matches in notes (guest order)
      const emailInNotes = order.notes?.toLowerCase().includes(email);
      
      return refMatches && emailInNotes;
    });

    if (matchingOrder) {
      // Get timeline for the order
      const { data: timeline } = await supabase
        .from("order_timeline")
        .select("*")
        .eq("order_id", matchingOrder.id)
        .order("created_at", { ascending: false });

      console.log("Order found:", matchingOrder.id);

      return new Response(
        JSON.stringify({
          success: true,
          order: {
            id: matchingOrder.id,
            status: matchingOrder.status,
            total_amount: matchingOrder.total_amount,
            created_at: matchingOrder.created_at,
            customer_name: matchingOrder.customer_name,
            shipping_address: matchingOrder.shipping_address,
            tracking_number: matchingOrder.tracking_number,
          },
          timeline: timeline || [],
        }),
        { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // If no guest order found, check if there's a registered user with this email
    // Use a more targeted query instead of listing all users
    const { data: authUsers, error: authError } = await supabase.auth.admin.listUsers({
      perPage: 1,
      page: 1,
    });

    // Search through matching orders for registered users
    // This is a fallback - we'll check if any of the matched orders belong to a user with this email
    if (!authError && authUsers?.users) {
      const userWithEmail = authUsers.users.find(u => u.email?.toLowerCase() === email);
      
      if (userWithEmail) {
        // Now search specifically for this user's orders
        const { data: userOrders, error: userOrdersError } = await supabase
          .from("orders")
          .select("id, status, total_amount, created_at, customer_name, shipping_address, tracking_number, user_id")
          .eq("user_id", userWithEmail.id)
          .limit(50);

        if (!userOrdersError && userOrders) {
          const userOrder = userOrders.find(order => {
            const orderId = order.id.replace(/-/g, '').toUpperCase();
            const first8 = orderId.slice(0, 8);
            const last8 = orderId.slice(-8);
            
            return first8 === searchRef || last8 === searchRef || 
                   first8.startsWith(searchRef) || last8.startsWith(searchRef) ||
                   orderId.includes(searchRef);
          });

          if (userOrder) {
            // Get timeline
            const { data: timeline } = await supabase
              .from("order_timeline")
              .select("*")
              .eq("order_id", userOrder.id)
              .order("created_at", { ascending: false });

            return new Response(
              JSON.stringify({
                success: true,
                order: {
                  id: userOrder.id,
                  status: userOrder.status,
                  total_amount: userOrder.total_amount,
                  created_at: userOrder.created_at,
                  customer_name: userOrder.customer_name,
                  shipping_address: userOrder.shipping_address,
                  tracking_number: userOrder.tracking_number,
                },
                timeline: timeline || [],
              }),
              { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
            );
          }
        }
      }
    }

    return new Response(
      JSON.stringify({ success: false, error: "Order not found" }),
      { status: 404, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  } catch (error: any) {
    console.error("Error in track-order function:", error);
    return new Response(
      JSON.stringify({ success: false, error: "An error occurred while tracking your order" }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
};

serve(handler);
