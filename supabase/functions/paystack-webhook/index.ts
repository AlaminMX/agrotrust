import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-paystack-signature',
};

async function verifySignature(body: string, signature: string, secret: string): Promise<boolean> {
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    'raw',
    encoder.encode(secret),
    { name: 'HMAC', hash: 'SHA-512' },
    false,
    ['sign']
  );
  const sig = await crypto.subtle.sign('HMAC', key, encoder.encode(body));
  const hashArray = Array.from(new Uint8Array(sig));
  const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  return hashHex === signature;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const paystackSecretKey = Deno.env.get('PAYSTACK_SECRET_KEY');
    if (!paystackSecretKey) {
      throw new Error('Paystack secret key not configured');
    }

    const body = await req.text();
    const signature = req.headers.get('x-paystack-signature');

    // Verify webhook signature
    if (signature) {
      const isValid = await verifySignature(body, signature, paystackSecretKey);
      if (!isValid) {
        console.error('Invalid webhook signature');
        return new Response('Invalid signature', { status: 401 });
      }
    }

    const event = JSON.parse(body);
    console.log(`Received Paystack webhook: ${event.event}`);

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    // Handle transfer events
    if (event.event === 'transfer.success') {
      const transferData = event.data;
      const reference = transferData.reference;

      console.log(`Transfer successful: ${reference}`);

      // Get the payout to update farmer earnings
      const { data: payout } = await supabase
        .from('payouts')
        .select('farmer_id, farmer_payout')
        .eq('payout_reference', reference)
        .single();

      // Update payout status
      const { error } = await supabase
        .from('payouts')
        .update({
          status: 'completed',
          processed_at: new Date().toISOString(),
        })
        .eq('payout_reference', reference);

      if (error) {
        console.error('Error updating payout:', error);
      }

      // Update farmer's earnings
      if (payout) {
        const { data: farmer } = await supabase
          .from('farmer_profiles')
          .select('pending_payout, total_earnings')
          .eq('id', payout.farmer_id)
          .single();

        if (farmer) {
          await supabase
            .from('farmer_profiles')
            .update({
              pending_payout: Math.max(0, (farmer.pending_payout || 0) - (payout.farmer_payout || 0)),
              total_earnings: (farmer.total_earnings || 0) + (payout.farmer_payout || 0),
            })
            .eq('id', payout.farmer_id);
        }
      }
    } else if (event.event === 'transfer.failed') {
      const transferData = event.data;
      const reference = transferData.reference;

      console.log(`Transfer failed: ${reference}, reason: ${transferData.reason}`);

      const { error } = await supabase
        .from('payouts')
        .update({ status: 'failed' })
        .eq('payout_reference', reference);

      if (error) {
        console.error('Error updating payout:', error);
      }
    } else if (event.event === 'transfer.reversed') {
      const transferData = event.data;
      const reference = transferData.reference;

      console.log(`Transfer reversed: ${reference}`);

      const { error } = await supabase
        .from('payouts')
        .update({ status: 'reversed' })
        .eq('payout_reference', reference);

      if (error) {
        console.error('Error updating payout:', error);
      }
    }

    return new Response(
      JSON.stringify({ received: true }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Webhook error:', error);
    return new Response(
      JSON.stringify({ error: 'Webhook processing failed' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
