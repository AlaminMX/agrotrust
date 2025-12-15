import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get authorization header to verify user
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('Missing authorization header');
    }

    // Create client with user's token
    const supabaseClient = createClient(supabaseUrl, Deno.env.get('SUPABASE_ANON_KEY')!, {
      global: { headers: { Authorization: authHeader } }
    });

    const { data: { user }, error: userError } = await supabaseClient.auth.getUser();
    if (userError || !user) {
      throw new Error('Unauthorized');
    }

    const { orderId } = await req.json();
    
    if (!orderId) {
      throw new Error('Order ID is required');
    }

    console.log(`Processing escrow release for order: ${orderId}, user: ${user.id}`);

    // Verify the order belongs to this consumer and is in deliverable state
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .select('*')
      .eq('id', orderId)
      .eq('consumer_id', user.id)
      .single();

    if (orderError || !order) {
      console.error('Order not found or not owned by user:', orderError);
      throw new Error('Order not found or access denied');
    }

    if (order.escrow_released) {
      throw new Error('Escrow already released for this order');
    }

    if (!['out_for_delivery', 'delivered'].includes(order.status)) {
      throw new Error('Order must be delivered before confirming receipt');
    }

    // Update order status to confirmed and release escrow
    const { error: updateError } = await supabase
      .from('orders')
      .update({
        status: 'confirmed',
        escrow_released: true,
        escrow_released_at: new Date().toISOString(),
        confirmed_at: new Date().toISOString(),
      })
      .eq('id', orderId);

    if (updateError) {
      console.error('Error updating order:', updateError);
      throw new Error('Failed to update order status');
    }

    // Add tracking event
    const { error: trackingError } = await supabase
      .from('order_tracking')
      .insert({
        order_id: orderId,
        status: 'confirmed',
        description: 'Delivery confirmed by customer. Payment released to farmer.',
      });

    if (trackingError) {
      console.error('Error adding tracking event:', trackingError);
    }

    // Create payout entry for farmer
    const { error: payoutError } = await supabase
      .from('payouts')
      .insert({
        farmer_id: order.farmer_id,
        order_id: orderId,
        amount: order.subtotal, // Farmer gets subtotal (excluding delivery fee)
        status: 'pending',
      });

    if (payoutError) {
      console.error('Error creating payout:', payoutError);
    }

    // Update farmer's pending payout balance
    const { error: farmerError } = await supabase
      .from('farmer_profiles')
      .update({
        pending_payout: supabase.rpc('increment_pending_payout', { 
          farmer_id: order.farmer_id, 
          amount: order.subtotal 
        })
      })
      .eq('id', order.farmer_id);

    // Simple increment instead of RPC
    const { data: farmerData } = await supabase
      .from('farmer_profiles')
      .select('pending_payout, total_earnings')
      .eq('id', order.farmer_id)
      .single();

    if (farmerData) {
      await supabase
        .from('farmer_profiles')
        .update({
          pending_payout: (farmerData.pending_payout || 0) + order.subtotal,
        })
        .eq('id', order.farmer_id);
    }

    console.log(`Escrow released successfully for order: ${orderId}`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Delivery confirmed and payment released to farmer' 
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('Error in release-escrow function:', error);
    return new Response(
      JSON.stringify({ success: false, error: errorMessage }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
