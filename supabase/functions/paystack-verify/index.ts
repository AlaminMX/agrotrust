import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const paystackSecretKey = Deno.env.get("PAYSTACK_SECRET_KEY")!;

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { reference } = await req.json();

    if (!reference) {
      return new Response(
        JSON.stringify({ error: "Reference is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Verify Paystack transaction
    const response = await fetch(`https://api.paystack.co/transaction/verify/${reference}`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${paystackSecretKey}`,
      },
    });

    const data = await response.json();

    if (!data.status) {
      return new Response(
        JSON.stringify({ error: data.message || "Payment verification failed" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const transaction = data.data;

    if (transaction.status !== "success") {
      return new Response(
        JSON.stringify({ 
          error: "Payment not successful", 
          status: transaction.status 
        }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Update order status if order_id is in metadata
    if (transaction.metadata?.order_id) {
      const { error: updateError } = await supabase
        .from("orders")
        .update({ 
          status: "paid", 
          payment_reference: reference,
          updated_at: new Date().toISOString()
        })
        .eq("id", transaction.metadata.order_id);

      if (updateError) {
        console.error("Error updating order:", updateError);
      }

      // Add tracking event
      await supabase.from("order_tracking").insert({
        order_id: transaction.metadata.order_id,
        status: "paid",
        description: "Payment confirmed via Paystack",
      });
    }

    return new Response(
      JSON.stringify({
        success: true,
        amount: transaction.amount / 100,
        reference: transaction.reference,
        order_id: transaction.metadata?.order_id,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Paystack verification error:", error);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
