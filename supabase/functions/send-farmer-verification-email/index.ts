import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");

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
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    const { farmerId, status, farmName, verificationNotes } = await req.json();

    if (!farmerId || !status) {
      throw new Error("Farmer ID and status are required");
    }

    console.log(`Sending verification email for farmer ${farmerId} with status: ${status}`);

    // Get farmer profile to get user_id
    const { data: farmerProfile, error: farmerError } = await supabase
      .from("farmer_profiles")
      .select("user_id, farm_name")
      .eq("id", farmerId)
      .single();

    if (farmerError || !farmerProfile) {
      throw new Error("Farmer profile not found");
    }

    // Get user email from auth
    const { data: userData, error: userError } = await supabase.auth.admin.getUserById(
      farmerProfile.user_id
    );

    if (userError || !userData.user?.email) {
      console.error("Could not get user email:", userError);
      throw new Error("User email not found");
    }

    const email = userData.user.email;
    const finalFarmName = farmName || farmerProfile.farm_name;

    let subject: string;
    let htmlContent: string;

    if (status === "approved") {
      subject = "🎉 Congratulations! Your AgroTrust Farmer Account is Approved";
      htmlContent = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="text-align: center; margin-bottom: 30px;">
            <h1 style="color: #16a34a; margin: 0;">🌱 AgroTrust</h1>
          </div>
          
          <h2 style="color: #333;">Welcome to AgroTrust, Verified Farmer!</h2>
          
          <p>Dear ${finalFarmName},</p>
          
          <p>Great news! Your farmer application has been <strong style="color: #16a34a;">approved</strong>. 
          You are now a verified farmer on AgroTrust marketplace.</p>
          
          <div style="background-color: #f0fdf4; border-left: 4px solid #16a34a; padding: 15px; margin: 20px 0;">
            <h3 style="margin-top: 0; color: #16a34a;">What's Next?</h3>
            <ul style="margin-bottom: 0;">
              <li>Start listing your products on the marketplace</li>
              <li>Set competitive prices to attract customers</li>
              <li>Maintain quality to build your reputation</li>
              <li>Respond promptly to orders</li>
            </ul>
          </div>
          
          ${verificationNotes ? `
          <div style="background-color: #fef3c7; border-left: 4px solid #f59e0b; padding: 15px; margin: 20px 0;">
            <h4 style="margin-top: 0;">Note from Admin:</h4>
            <p style="margin-bottom: 0;">${verificationNotes}</p>
          </div>
          ` : ''}
          
          <p>Log in to your <a href="https://agrotrust.lovable.app/farmer/dashboard" style="color: #16a34a;">Farmer Dashboard</a> to start selling!</p>
          
          <p>Best regards,<br>The AgroTrust Team</p>
          
          <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
          <p style="color: #999; font-size: 12px; text-align: center;">
            This email was sent from AgroTrust. If you have questions, please contact our support team.
          </p>
        </div>
      `;
    } else if (status === "rejected") {
      subject = "Update on Your AgroTrust Farmer Application";
      htmlContent = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="text-align: center; margin-bottom: 30px;">
            <h1 style="color: #16a34a; margin: 0;">🌱 AgroTrust</h1>
          </div>
          
          <h2 style="color: #333;">Application Status Update</h2>
          
          <p>Dear ${finalFarmName},</p>
          
          <p>Thank you for your interest in becoming a farmer on AgroTrust. After reviewing your application, 
          we regret to inform you that your application was not approved at this time.</p>
          
          ${verificationNotes ? `
          <div style="background-color: #fef2f2; border-left: 4px solid #ef4444; padding: 15px; margin: 20px 0;">
            <h4 style="margin-top: 0;">Reason:</h4>
            <p style="margin-bottom: 0;">${verificationNotes}</p>
          </div>
          ` : ''}
          
          <p>You may reapply after addressing the concerns mentioned above. 
          If you believe this was an error, please contact our support team.</p>
          
          <p>Best regards,<br>The AgroTrust Team</p>
          
          <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
          <p style="color: #999; font-size: 12px; text-align: center;">
            This email was sent from AgroTrust. If you have questions, please contact our support team.
          </p>
        </div>
      `;
    } else {
      subject = "Your AgroTrust Application is Under Review";
      htmlContent = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="text-align: center; margin-bottom: 30px;">
            <h1 style="color: #16a34a; margin: 0;">🌱 AgroTrust</h1>
          </div>
          
          <h2 style="color: #333;">Application Under Review</h2>
          
          <p>Dear ${finalFarmName},</p>
          
          <p>Your farmer application is currently under review by our team. 
          We'll get back to you within 1-2 business days.</p>
          
          <p>Best regards,<br>The AgroTrust Team</p>
        </div>
      `;
    }

    // Use fetch to call Resend API directly
    const emailResponse = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: "AgroTrust <notifications@resend.dev>",
        to: [email],
        subject,
        html: htmlContent,
      }),
    });

    const emailData = await emailResponse.json();

    if (!emailResponse.ok) {
      console.error('Resend API error:', emailData);
      throw new Error(emailData.message || 'Failed to send email');
    }

    console.log("Email sent successfully:", emailData);

    return new Response(
      JSON.stringify({ success: true, emailId: emailData.id }),
      {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  } catch (error: any) {
    console.error("Error sending verification email:", error);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
});
