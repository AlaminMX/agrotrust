import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const PLATFORM_FEE_PERCENT = 0.10; // 10% platform fee

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const paystackSecretKey = Deno.env.get('PAYSTACK_SECRET_KEY');
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('Missing authorization header');
    }

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

    // Verify the order belongs to this consumer
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

    // Calculate commission: 10% platform, 90% farmer
    const subtotal = Number(order.subtotal);
    const platformFee = Math.round(subtotal * PLATFORM_FEE_PERCENT);
    const farmerPayout = subtotal - platformFee;

    console.log(`Order subtotal: ${subtotal}, Platform fee (10%): ${platformFee}, Farmer payout: ${farmerPayout}`);

    // Get farmer's transfer recipient code
    const { data: farmer, error: farmerFetchError } = await supabase
      .from('farmer_profiles')
      .select('paystack_recipient_code, pending_payout, total_earnings, farm_name')
      .eq('id', order.farmer_id)
      .single();

    if (farmerFetchError || !farmer) {
      console.error('Farmer not found:', farmerFetchError);
      throw new Error('Farmer profile not found');
    }

    // Update order status
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
    await supabase
      .from('order_tracking')
      .insert({
        order_id: orderId,
        status: 'confirmed',
        description: 'Delivery confirmed by customer. Payment being processed for farmer.',
      });

    // Generate payout reference
    const payoutReference = `TRF-${orderId.substring(0, 8)}-${Date.now()}`;

    // Create payout entry with commission breakdown
    const { error: payoutError } = await supabase
      .from('payouts')
      .insert({
        farmer_id: order.farmer_id,
        order_id: orderId,
        amount: subtotal,
        platform_fee: platformFee,
        farmer_payout: farmerPayout,
        payout_reference: payoutReference,
        status: farmer.paystack_recipient_code ? 'processing' : 'pending',
      });

    if (payoutError) {
      console.error('Error creating payout:', payoutError);
    }

    // Attempt automatic transfer if farmer has recipient code
    let transferInitiated = false;
    if (farmer.paystack_recipient_code && paystackSecretKey) {
      try {
        console.log(`Initiating Paystack transfer to ${farmer.farm_name}`);
        
        const transferResponse = await fetch('https://api.paystack.co/transfer', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${paystackSecretKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            source: 'balance',
            amount: farmerPayout * 100, // Paystack uses kobo
            recipient: farmer.paystack_recipient_code,
            reason: `Payment for order ${order.order_number}`,
            reference: payoutReference,
          }),
        });

        const transferData = await transferResponse.json();

        if (transferData.status) {
          console.log(`Transfer initiated successfully: ${payoutReference}`);
          transferInitiated = true;
          
          // Update payout status
          await supabase
            .from('payouts')
            .update({ status: 'processing' })
            .eq('payout_reference', payoutReference);
        } else {
          console.error('Transfer failed:', transferData.message);
        }
      } catch (transferError) {
        console.error('Transfer error:', transferError);
      }
    } else {
      console.log('No recipient code found or Paystack not configured - payout marked as pending for manual processing');
    }

    // Update farmer's pending payout balance
    await supabase
      .from('farmer_profiles')
      .update({
        pending_payout: (farmer.pending_payout || 0) + farmerPayout,
      })
      .eq('id', order.farmer_id);

    // Send email notification to farmer
    try {
      const notificationUrl = `${supabaseUrl}/functions/v1/send-payout-notification`;
      const notificationResponse = await fetch(notificationUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          farmerId: order.farmer_id,
          orderNumber: order.order_number,
          amount: subtotal,
          platformFee,
          farmerPayout,
        }),
      });
      
      if (notificationResponse.ok) {
        console.log('Payout notification email sent successfully');
      } else {
        console.error('Failed to send payout notification email');
      }
    } catch (emailError) {
      console.error('Error sending payout notification:', emailError);
    }

    console.log(`Escrow released successfully for order: ${orderId}`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: transferInitiated 
          ? 'Delivery confirmed! Payment is being transferred to the farmer.' 
          : 'Delivery confirmed! Payment will be processed for the farmer.',
        platformFee,
        farmerPayout,
        transferInitiated,
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
