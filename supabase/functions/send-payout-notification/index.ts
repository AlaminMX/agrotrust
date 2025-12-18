import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// HTML escape function to prevent XSS in emails
function escapeHtml(text: string): string {
  const map: { [key: string]: string } = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;',
  };
  return text.replace(/[&<>"']/g, (char) => map[char]);
}

interface PayoutEmailRequest {
  farmerId: string;
  orderNumber: string;
  amount: number;
  platformFee: number;
  farmerPayout: number;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    const { farmerId, orderNumber, amount, platformFee, farmerPayout }: PayoutEmailRequest = await req.json();

    console.log(`Validating payout for order ${orderNumber} and farmer ${farmerId}`);

    // SECURITY: Verify that a matching payout exists in the database
    const { data: payout, error: payoutError } = await supabase
      .from('payouts')
      .select('id, created_at')
      .eq('farmer_id', farmerId)
      .eq('amount', amount)
      .eq('platform_fee', platformFee)
      .eq('farmer_payout', farmerPayout)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (payoutError || !payout) {
      console.error('No matching payout found:', payoutError);
      return new Response(
        JSON.stringify({ error: 'Invalid payout request - no matching payout found' }),
        { status: 404, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Only send email if payout was created in last 5 minutes (prevents replay attacks)
    const payoutAge = Date.now() - new Date(payout.created_at).getTime();
    if (payoutAge > 5 * 60 * 1000) {
      console.error('Payout request expired:', payoutAge);
      return new Response(
        JSON.stringify({ error: 'Payout request expired' }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    console.log(`Payout validated, sending notification email for order ${orderNumber}`);

    // Get farmer profile with email
    const { data: farmer, error: farmerError } = await supabase
      .from('farmer_profiles')
      .select('farm_name, user_id, bank_name, bank_account_number')
      .eq('id', farmerId)
      .single();

    if (farmerError || !farmer) {
      throw new Error('Farmer not found');
    }

    // Get user email from auth
    const { data: { user }, error: userError } = await supabase.auth.admin.getUserById(farmer.user_id);

    if (userError || !user?.email) {
      throw new Error('User email not found');
    }

    const formatNaira = (amount: number) => 
      new Intl.NumberFormat('en-NG', { style: 'currency', currency: 'NGN' }).format(amount);

    // SECURITY: Escape user input to prevent XSS in emails
    const safeFarmName = escapeHtml(farmer.farm_name);
    const safeBankName = farmer.bank_name ? escapeHtml(farmer.bank_name) : '';
    const safeOrderNumber = escapeHtml(orderNumber);

    const emailHtml = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Payment Notification</title>
      </head>
      <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: linear-gradient(135deg, #166534 0%, #15803d 100%); color: white; padding: 30px; border-radius: 12px 12px 0 0; text-align: center;">
          <h1 style="margin: 0; font-size: 28px;">🎉 Payment Received!</h1>
          <p style="margin: 10px 0 0 0; opacity: 0.9;">Your payout is on its way</p>
        </div>
        
        <div style="background: #f9fafb; padding: 30px; border: 1px solid #e5e7eb; border-top: none;">
          <p style="margin-top: 0;">Hello <strong>${safeFarmName}</strong>,</p>
          
          <p>Great news! A customer has confirmed delivery for order <strong>#${safeOrderNumber}</strong>, and your payment is being processed.</p>
          
          <div style="background: white; border-radius: 8px; padding: 20px; margin: 20px 0; border: 1px solid #e5e7eb;">
            <h3 style="margin: 0 0 15px 0; color: #166534;">Payment Breakdown</h3>
            <table style="width: 100%; border-collapse: collapse;">
              <tr>
                <td style="padding: 8px 0; border-bottom: 1px solid #f3f4f6;">Order Total</td>
                <td style="padding: 8px 0; border-bottom: 1px solid #f3f4f6; text-align: right;">${formatNaira(amount)}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; border-bottom: 1px solid #f3f4f6;">Platform Fee (10%)</td>
                <td style="padding: 8px 0; border-bottom: 1px solid #f3f4f6; text-align: right; color: #6b7280;">-${formatNaira(platformFee)}</td>
              </tr>
              <tr style="font-weight: bold; color: #166534;">
                <td style="padding: 12px 0;">Your Payout (90%)</td>
                <td style="padding: 12px 0; text-align: right; font-size: 18px;">${formatNaira(farmerPayout)}</td>
              </tr>
            </table>
          </div>
          
          ${safeBankName ? `
          <div style="background: #ecfdf5; border-radius: 8px; padding: 15px; margin: 20px 0; border: 1px solid #a7f3d0;">
            <p style="margin: 0; font-size: 14px;">
              <strong>💳 Bank Account:</strong><br>
              ${safeBankName}<br>
              ****${farmer.bank_account_number?.slice(-4) || '****'}
            </p>
          </div>
          ` : ''}
          
          <p style="color: #6b7280; font-size: 14px;">
            Transfers are typically processed within 24 hours. You'll receive the funds directly to your registered bank account.
          </p>
          
          <p>Thank you for being a trusted farmer on AgroTrust!</p>
          
          <p style="margin-bottom: 0;">
            Best regards,<br>
            <strong style="color: #166534;">The AgroTrust Team</strong>
          </p>
        </div>
        
        <div style="text-align: center; padding: 20px; color: #9ca3af; font-size: 12px;">
          <p style="margin: 0;">AgroTrust - Connecting Farmers to Consumers</p>
          <p style="margin: 5px 0 0 0;">© ${new Date().getFullYear()} AgroTrust. All rights reserved.</p>
        </div>
      </body>
      </html>
    `;

    // Use fetch to call Resend API directly
    const emailResponse = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: "AgroTrust <notifications@resend.dev>",
        to: [user.email],
        subject: `💰 Payment Received for Order #${safeOrderNumber}`,
        html: emailHtml,
      }),
    });

    const emailData = await emailResponse.json();

    if (!emailResponse.ok) {
      console.error('Resend API error:', emailData);
      throw new Error(emailData.message || 'Failed to send email');
    }

    console.log("Email sent successfully:", emailData);

    return new Response(JSON.stringify({ success: true, emailId: emailData.id }), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  } catch (error: any) {
    console.error("Error sending payout notification:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
});
