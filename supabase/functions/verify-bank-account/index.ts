import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Verify authentication
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      console.error("Missing authorization header");
      return new Response(
        JSON.stringify({ success: false, error: "Missing authorization header" }),
        { status: 401, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } }
    });

    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      console.error("Unauthorized user:", userError?.message);
      return new Response(
        JSON.stringify({ success: false, error: "Unauthorized" }),
        { status: 401, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Verify user is a farmer (only farmers should be verifying bank accounts)
    const { data: farmerProfile, error: farmerError } = await supabase
      .from('farmer_profiles')
      .select('id')
      .eq('user_id', user.id)
      .maybeSingle();

    if (farmerError || !farmerProfile) {
      console.error("User is not a farmer:", farmerError?.message);
      return new Response(
        JSON.stringify({ success: false, error: "Only farmers can verify bank accounts" }),
        { status: 403, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    console.log(`Farmer ${farmerProfile.id} verifying bank account`);

    const PAYSTACK_SECRET_KEY = Deno.env.get("PAYSTACK_SECRET_KEY");
    
    if (!PAYSTACK_SECRET_KEY) {
      console.error("PAYSTACK_SECRET_KEY not configured");
      throw new Error("Payment configuration error");
    }

    const { accountNumber, bankCode } = await req.json();

    if (!accountNumber || !bankCode) {
      throw new Error("Account number and bank code are required");
    }

    if (accountNumber.length !== 10) {
      throw new Error("Account number must be 10 digits");
    }

    console.log(`Verifying bank account: ${accountNumber} with bank code: ${bankCode}`);

    // Call Paystack's resolve account endpoint
    const paystackResponse = await fetch(
      `https://api.paystack.co/bank/resolve?account_number=${accountNumber}&bank_code=${bankCode}`,
      {
        method: "GET",
        headers: {
          Authorization: `Bearer ${PAYSTACK_SECRET_KEY}`,
          "Content-Type": "application/json",
        },
      }
    );

    const paystackData = await paystackResponse.json();

    console.log("Paystack response:", JSON.stringify(paystackData, null, 2));

    if (!paystackResponse.ok || !paystackData.status) {
      throw new Error(paystackData.message || "Could not verify account. Please check your details.");
    }

    return new Response(
      JSON.stringify({
        success: true,
        accountName: paystackData.data.account_name,
        accountNumber: paystackData.data.account_number,
        bankId: paystackData.data.bank_id,
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  } catch (error: any) {
    console.error("Error verifying bank account:", error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message || "Failed to verify bank account" 
      }),
      {
        status: 400,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
});
