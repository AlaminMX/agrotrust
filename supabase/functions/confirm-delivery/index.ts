import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
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

    console.log(`Processing delivery confirmation for order: ${orderId}, user: ${user.id}`);

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
      throw new Error('Order already confirmed');
    }

    if (!['out_for_delivery', 'delivered'].includes(order.status)) {
      throw new Error('Order must be delivered before confirming receipt');
    }

    // Update order status to awaiting_payout
    const { error: updateError } = await supabase
      .from('orders')
      .update({
        status: 'awaiting_payout',
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
        status: 'awaiting_payout',
        description: 'Delivery confirmed by customer. Awaiting admin payout release.',
      });

    // Send WhatsApp notification to admin
    try {
      const notificationUrl = `${supabaseUrl}/functions/v1/send-whatsapp-notification`;
      await fetch(notificationUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orderNumber: order.order_number,
          totalAmount: order.total_amount,
          farmerName: order.farmer_id, // Will be resolved in the notification function
        }),
      });
      console.log('WhatsApp notification sent to admin');
    } catch (notifyError) {
      console.error('Error sending WhatsApp notification:', notifyError);
      // Don't fail the request if notification fails
    }

    console.log(`Delivery confirmed for order: ${orderId}, awaiting admin payout`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Delivery confirmed! The admin will process your payout soon.',
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('Error in confirm-delivery function:', error);
    return new Response(
      JSON.stringify({ success: false, error: errorMessage }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});