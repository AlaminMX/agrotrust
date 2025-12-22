import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const ADMIN_PHONE = '2348091994767';

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { orderNumber, totalAmount, farmerName } = await req.json();

    console.log(`Sending WhatsApp notification for order: ${orderNumber}`);

    // Get farmer name if farmer_id was passed
    let resolvedFarmerName = farmerName;
    if (farmerName && farmerName.includes('-')) {
      // It's a UUID, resolve to farm name
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

    // Create WhatsApp message
    const message = `🔔 *AgroTrust Payout Alert*

Order *#${orderNumber}* is awaiting payout release.

💰 *Amount:* ₦${totalAmount.toLocaleString()}
📊 *Platform Fee (10%):* ₦${platformFee.toLocaleString()}
🌾 *Farmer Payout:* ₦${farmerPayout.toLocaleString()}
🏪 *Farm:* ${resolvedFarmerName || 'Unknown'}

Please review and release the payout in the admin panel.`;

    // Log the notification (in production, you would integrate with WhatsApp Business API or Twilio)
    console.log('WhatsApp Notification to Admin:', message);
    console.log('Admin Phone:', ADMIN_PHONE);

    // For now, we'll just log it. In production, integrate with:
    // 1. WhatsApp Business API (Meta)
    // 2. Twilio WhatsApp API
    // 3. MessageBird
    // 4. 360dialog

    // Example with Twilio (uncomment and add TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN secrets):
    /*
    const twilioAccountSid = Deno.env.get('TWILIO_ACCOUNT_SID');
    const twilioAuthToken = Deno.env.get('TWILIO_AUTH_TOKEN');
    const twilioPhoneNumber = Deno.env.get('TWILIO_WHATSAPP_NUMBER');

    if (twilioAccountSid && twilioAuthToken && twilioPhoneNumber) {
      const twilioUrl = `https://api.twilio.com/2010-04-01/Accounts/${twilioAccountSid}/Messages.json`;
      
      const formData = new URLSearchParams();
      formData.append('To', `whatsapp:+${ADMIN_PHONE}`);
      formData.append('From', `whatsapp:${twilioPhoneNumber}`);
      formData.append('Body', message);

      const twilioResponse = await fetch(twilioUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Basic ${btoa(`${twilioAccountSid}:${twilioAuthToken}`)}`,
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: formData.toString(),
      });

      const twilioResult = await twilioResponse.json();
      console.log('Twilio response:', twilioResult);
    }
    */

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'WhatsApp notification queued',
        notification: {
          phone: ADMIN_PHONE,
          orderNumber,
          amount: totalAmount,
        }
      }),
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