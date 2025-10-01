import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "npm:resend@2.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface Request2FA {
  email: string;
  userId: string;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { email, userId }: Request2FA = await req.json();

    // Generate 6-digit code
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    
    // Store code in database with 10 minute expiry
    const { createClient } = await import("https://esm.sh/@supabase/supabase-js@2");
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    const { error: dbError } = await supabase
      .from('two_factor_codes')
      .insert({
        user_id: userId,
        code: code,
        expires_at: expiresAt.toISOString(),
        used: false
      });

    if (dbError) {
      console.error('Database error:', dbError);
      throw dbError;
    }

    // Send email with code
    const emailResponse = await resend.emails.send({
      from: "Emergency System <onboarding@resend.dev>",
      to: [email],
      subject: "Your 2FA Verification Code",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h1 style="color: #d97706;">Emergency System</h1>
          <h2>Two-Factor Authentication</h2>
          <p>Your verification code is:</p>
          <div style="background: #f3f4f6; padding: 20px; text-align: center; font-size: 32px; font-weight: bold; letter-spacing: 8px; margin: 20px 0;">
            ${code}
          </div>
          <p style="color: #666;">This code will expire in 10 minutes.</p>
          <p style="color: #666;">If you didn't request this code, please ignore this email.</p>
        </div>
      `,
    });

    console.log("2FA code sent successfully:", emailResponse);

    return new Response(
      JSON.stringify({ success: true }),
      {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  } catch (error: any) {
    console.error("Error in send-2fa-code function:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);
