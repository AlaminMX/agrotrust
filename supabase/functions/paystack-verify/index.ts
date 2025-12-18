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
      console.error("Missing payment reference");
      return new Response(
        JSON.stringify({ error: "Reference is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`Verifying payment reference: ${reference}`);

    // Idempotency check: Check if reference already processed
    const { data: existingOrders, error: existingError } = await supabase
      .from('orders')
      .select('id, status')
      .eq('payment_reference', reference)
      .limit(1);

    if (existingError) {
      console.error("Error checking existing orders:", existingError);
    }

    if (existingOrders && existingOrders.length > 0) {
      console.log(`Reference ${reference} already processed for order ${existingOrders[0].id}`);
      return new Response(
        JSON.stringify({ 
          success: true, 
          message: 'Payment already processed',
          order_id: existingOrders[0].id 
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Verify Paystack transaction
    const response = await fetch(`https://api.paystack.co/transaction/verify/${encodeURIComponent(reference)}`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${paystackSecretKey}`,
      },
    });

    const data = await response.json();

    if (!data.status) {
      console.error("Paystack verification failed:", data.message);
      return new Response(
        JSON.stringify({ error: data.message || "Payment verification failed" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const transaction = data.data;
    console.log(`Transaction status: ${transaction.status}, amount: ${transaction.amount}`);

    if (transaction.status !== "success") {
      console.error(`Payment not successful, status: ${transaction.status}`);
      return new Response(
        JSON.stringify({ 
          error: "Payment not successful", 
          status: transaction.status 
        }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Handle both order_ids (plural array) and order_id (singular) for backward compatibility
    const orderIds = transaction.metadata?.order_ids || 
                     (transaction.metadata?.order_id ? [transaction.metadata.order_id] : []);

    if (orderIds.length === 0) {
      console.warn('No order IDs in payment metadata');
      return new Response(
        JSON.stringify({ 
          success: true, 
          message: 'Payment verified but no orders to update',
          amount: transaction.amount / 100,
          reference: transaction.reference,
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`Processing ${orderIds.length} orders: ${orderIds.join(', ')}`);

    // Fetch all orders to verify total amount
    const { data: orders, error: ordersError } = await supabase
      .from('orders')
      .select('id, total_amount, status, consumer_id')
      .in('id', orderIds);

    if (ordersError || !orders || orders.length === 0) {
      console.error("Orders not found:", ordersError);
      return new Response(
        JSON.stringify({ error: "Orders not found" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Validate order count matches
    if (orders.length !== orderIds.length) {
      console.error(`Order count mismatch: expected ${orderIds.length}, found ${orders.length}`);
      return new Response(
        JSON.stringify({ error: "Some orders not found" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Calculate expected total and validate payment amount
    const totalExpected = orders.reduce((sum, o) => sum + Number(o.total_amount), 0);
    const totalPaid = transaction.amount / 100; // Convert kobo to naira

    // Allow 1 naira difference for rounding
    if (Math.abs(totalExpected - totalPaid) > 1) {
      console.error(`Payment amount mismatch: expected ₦${totalExpected}, got ₦${totalPaid}`);
      return new Response(
        JSON.stringify({ 
          error: "Payment amount mismatch",
          expected: totalExpected,
          received: totalPaid
        }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`Amount validated: ₦${totalPaid} matches expected ₦${totalExpected}`);

    // Update all orders
    let updatedCount = 0;
    const firstOrderId = orders[0]?.id;

    for (const order of orders) {
      // Only update orders still in pending status to prevent double-processing
      if (order.status !== 'pending') {
        console.log(`Order ${order.id} already processed with status: ${order.status}`);
        continue;
      }

      const { error: updateError } = await supabase
        .from('orders')
        .update({ 
          status: 'paid', 
          payment_reference: reference,
          updated_at: new Date().toISOString()
        })
        .eq('id', order.id)
        .eq('status', 'pending'); // Double-check status for race condition protection

      if (updateError) {
        console.error(`Error updating order ${order.id}:`, updateError);
      } else {
        updatedCount++;
        console.log(`Order ${order.id} updated to paid`);
        
        // Add tracking event
        const { error: trackingError } = await supabase.from('order_tracking').insert({
          order_id: order.id,
          status: 'paid',
          description: 'Payment confirmed via Paystack',
        });

        if (trackingError) {
          console.error(`Error adding tracking for order ${order.id}:`, trackingError);
        }
      }
    }

    console.log(`Successfully updated ${updatedCount} of ${orders.length} orders`);

    return new Response(
      JSON.stringify({
        success: true,
        amount: transaction.amount / 100,
        reference: transaction.reference,
        order_id: firstOrderId, // Return first order for redirect
        orders_updated: updatedCount,
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
