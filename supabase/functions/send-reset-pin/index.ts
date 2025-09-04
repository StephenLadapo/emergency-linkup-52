import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";
import { Resend } from "npm:resend@2.0.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface SendResetPinRequest {
  email: string;
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { email }: SendResetPinRequest = await req.json();

    if (!email || !email.endsWith('@gmail.com')) {
      return new Response(
        JSON.stringify({ error: "Please provide a valid Gmail email (@gmail.com)" }),
        {
          status: 400,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        }
      );
    }

    // Check for required environment variables
    const resendApiKey = Deno.env.get("RESEND_API_KEY");
    if (!resendApiKey) {
      console.error("RESEND_API_KEY is not set");
      return new Response(
        JSON.stringify({ error: "Email service not configured" }),
        {
          status: 500,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        }
      );
    }

    // Initialize Resend client
    const resend = new Resend(resendApiKey);

    // Initialize Supabase client
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    // Generate 6-digit PIN
    const pin = Math.floor(100000 + Math.random() * 900000).toString();
    
    // Set expiry to 10 minutes from now
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString();

    // Store PIN in database
    const { error: dbError } = await supabase
      .from("password_reset_codes")
      .insert({
        email: email,
        code: pin,
        expires_at: expiresAt,
      });

    if (dbError) {
      console.error("Database error:", dbError);
      return new Response(
        JSON.stringify({ error: "Failed to generate reset code" }),
        {
          status: 500,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        }
      );
    }

    // Send PIN via email
    const emailResponse = await resend.emails.send({
      from: "University of Limpopo <onboarding@resend.dev>",
      to: [email],
      subject: "Password Reset PIN",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h1 style="color: #1f2937; text-align: center;">Password Reset Request</h1>
          <div style="background: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <p style="color: #374151; font-size: 16px; margin-bottom: 20px;">
              You requested to reset your password for your University of Limpopo Emergency Response account.
            </p>
            <div style="background: white; padding: 20px; border-radius: 6px; text-align: center;">
              <p style="color: #6b7280; margin-bottom: 10px;">Your reset PIN is:</p>
              <h2 style="color: #dc2626; font-size: 32px; font-weight: bold; letter-spacing: 4px; margin: 10px 0;">
                ${pin}
              </h2>
              <p style="color: #6b7280; font-size: 14px;">This PIN will expire in 10 minutes</p>
            </div>
            <p style="color: #374151; font-size: 14px; margin-top: 20px;">
              If you did not request this password reset, please ignore this email.
            </p>
          </div>
          <p style="color: #6b7280; font-size: 12px; text-align: center;">
            University of Limpopo Emergency Response System
          </p>
        </div>
      `,
    });

    console.log("Reset PIN sent successfully:", emailResponse);

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: "Reset PIN sent to your email" 
      }),
      {
        status: 200,
        headers: {
          "Content-Type": "application/json",
          ...corsHeaders,
        },
      }
    );
  } catch (error: any) {
    console.error("Error in send-reset-pin function:", error);
    return new Response(
      JSON.stringify({ error: error.message || "Internal server error" }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);