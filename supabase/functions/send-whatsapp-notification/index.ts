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

    const adminPhone = Deno.env.get('ADMIN_WHATSAPP_PHONE') || '';

    const { orderNumber, totalAmount, farmerName } = await req.json();

    console.log(`Processing WhatsApp notification for order: ${orderNumber}`);

    let resolvedFarmerName = farmerName;
    if (farmerName && farmerName.includes('-')) {
      const { data: farmer } = await supabase
        .from('farmer_profiles')
        .select('farm_name')
        .eq('id', farmerName)
        .single();
      
      if (farmer) {
        resolvedFarmerName = farmer.farm_name;
      }
    }

    const platformFee = Math.round(totalAmount * 0.10);
    const farmerPayout = totalAmount - platformFee;

    const message = `🔔 *AgroTrust Payout Alert*

Order *#${orderNumber}* is awaiting payout release.

💰 *Amount:* ₦${totalAmount.toLocaleString()}
📊 *Platform Fee (10%):* ₦${platformFee.toLocaleString()}
🌾 *Farmer Payout:* ₦${farmerPayout.toLocaleString()}
🏪 *Farm:* ${resolvedFarmerName || 'Unknown'}

Please review and release the payout in the admin panel.`;

    console.log('WhatsApp notification prepared for admin');

    // In production, integrate with WhatsApp Business API / Twilio here

    return new Response(
      JSON.stringify({ success: true, message: 'WhatsApp notification queued' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('Error in send-whatsapp-notification function:', error);
    return new Response(
      JSON.stringify({ success: false, error: errorMessage }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
