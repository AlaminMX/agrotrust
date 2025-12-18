import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

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
