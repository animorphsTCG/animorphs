
import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import Stripe from "https://esm.sh/stripe@12.18.0?target=deno";

const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") ?? "", {
  apiVersion: "2023-10-16",
  httpClient: Stripe.createFetchHttpClient(),
});

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { sessionId } = await req.json();

    // Get the user's token from the request header
    const authHeader = req.headers.get("Authorization")?.replace("Bearer ", "");
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: "No authorization header provided" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Create a Supabase client for user verification
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? "",
      { global: { headers: { Authorization: `Bearer ${authHeader}` } } }
    );

    // Get the user's info from their token
    const { data: { user }, error: userError } = await supabaseClient.auth.getUser(authHeader);
    if (userError || !user) {
      return new Response(
        JSON.stringify({ error: "Unauthorized access" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Verify the payment session
    const session = await stripe.checkout.sessions.retrieve(sessionId);
    
    // Check if the session is paid
    if (session.payment_status !== "paid") {
      return new Response(
        JSON.stringify({ success: false, error: "Payment not completed" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Check if the payment is for the current user
    const sessionUserId = session.metadata?.userId;
    if (sessionUserId !== user.id) {
      return new Response(
        JSON.stringify({ success: false, error: "Payment session does not belong to this user" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Create a Supabase client with service role for database operations
    const adminClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    // Insert the payment record
    const { error: paymentError } = await adminClient
      .from("payment_records")
      .insert({
        user_id: user.id,
        amount: session.amount_total ? session.amount_total / 100 : 100, // Convert from cents
        currency: session.currency || "zar",
        payment_method: session.payment_method_types?.[0] || "unknown",
        stripe_session_id: session.id,
      });

    if (paymentError) {
      console.error("Error inserting payment record:", paymentError);
      throw new Error("Failed to record payment");
    }

    // Update the user's profile to mark as paid
    const { error: profileError } = await adminClient
      .from("profiles")
      .update({ has_paid: true })
      .eq("id", user.id);

    if (profileError) {
      console.error("Error updating profile:", profileError);
      throw new Error("Failed to update profile");
    }

    return new Response(
      JSON.stringify({ success: true }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error verifying payment:", error);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
