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
    const paystackSecretKey = Deno.env.get('PAYSTACK_SECRET_KEY');
    if (!paystackSecretKey) {
      throw new Error('Paystack secret key not configured');
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!;

    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('Missing authorization header');
    }

    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } }
    });

    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      throw new Error('Unauthorized');
    }

    const { bankCode, accountNumber, accountName } = await req.json();

    if (!bankCode || !accountNumber || !accountName) {
      throw new Error('Bank code, account number, and account name are required');
    }

    console.log(`Creating transfer recipient for user: ${user.id}`);

    // Create transfer recipient with Paystack
    const recipientResponse = await fetch('https://api.paystack.co/transferrecipient', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${paystackSecretKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        type: 'nuban',
        name: accountName,
        account_number: accountNumber,
        bank_code: bankCode,
        currency: 'NGN',
      }),
    });

    const recipientData = await recipientResponse.json();

    if (!recipientData.status) {
      console.error('Paystack error:', recipientData);
      throw new Error(recipientData.message || 'Failed to create transfer recipient');
    }

    const recipientCode = recipientData.data.recipient_code;
    console.log(`Transfer recipient created: ${recipientCode}`);

    // Update farmer profile with recipient code and bank details
    const supabaseService = createClient(
      supabaseUrl,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    const { error: updateError } = await supabaseService
      .from('farmer_profiles')
      .update({
        paystack_recipient_code: recipientCode,
        bank_name: recipientData.data.details.bank_name,
        bank_account_number: accountNumber,
        bank_account_name: accountName,
      })
      .eq('user_id', user.id);

    if (updateError) {
      console.error('Error updating farmer profile:', updateError);
      throw new Error('Failed to save bank details');
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Bank account verified and saved',
        bankName: recipientData.data.details.bank_name,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('Error in create-transfer-recipient:', error);
    return new Response(
      JSON.stringify({ success: false, error: errorMessage }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
