import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "npm:resend@2.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface EmailData {
  token: string;
  token_hash: string;
  redirect_to: string;
  email_action_type: string;
  site_url: string;
}

interface WebhookPayload {
  user: {
    id: string;
    email: string;
    email_confirmed_at?: string;
    user_metadata?: {
      full_name?: string;
    };
  };
  email_data: EmailData;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const payload: WebhookPayload = await req.json();
    const { user, email_data } = payload;
    const { email_action_type, token_hash, redirect_to } = email_data;

    console.log("Auth hook triggered for:", email_action_type, user.email);

    const confirmationUrl = `${email_data.site_url}/auth/v1/verify?token=${token_hash}&type=${email_action_type}&redirect_to=${redirect_to}`;
    const fullName = user.user_metadata?.full_name || 'User';

    let emailResponse;

    // Handle different email types
    if (email_action_type === 'signup' || email_action_type === 'invite') {
      // Send confirmation email
      emailResponse = await resend.emails.send({
        from: "UL Emergency System <onboarding@resend.dev>",
        to: [user.email],
        subject: "Confirm Your Email - UL Emergency System",
        html: `
          <!DOCTYPE html>
          <html>
            <head>
              <meta charset="UTF-8">
              <meta name="viewport" content="width=device-width, initial-scale=1.0">
              <style>
                body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                .header { background: linear-gradient(135deg, #1e40af 0%, #b45309 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
                .content { background: #ffffff; padding: 30px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 10px 10px; }
                .button { display: inline-block; padding: 14px 28px; background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%); color: white; text-decoration: none; border-radius: 6px; font-weight: bold; margin: 20px 0; }
                .footer { text-align: center; margin-top: 20px; color: #6b7280; font-size: 14px; }
              </style>
            </head>
            <body>
              <div class="container">
                <div class="header">
                  <h1 style="margin: 0;">Welcome to UL Emergency System</h1>
                </div>
                <div class="content">
                  <h2>Hello ${fullName}!</h2>
                  <p>Thank you for registering with the University of Limpopo Emergency Response System.</p>
                  <p>To complete your registration and verify your email address, please click the button below:</p>
                  <div style="text-align: center;">
                    <a href="${confirmationUrl}" class="button">Confirm Email Address</a>
                  </div>
                  <p>Or copy and paste this link into your browser:</p>
                  <p style="background: #f3f4f6; padding: 10px; border-radius: 4px; word-break: break-all; font-size: 12px;">${confirmationUrl}</p>
                  <p><strong>This link will expire in 24 hours.</strong></p>
                  <p>If you didn't create an account with UL Emergency System, you can safely ignore this email.</p>
                </div>
                <div class="footer">
                  <p>University of Limpopo Emergency Response System</p>
                  <p>This is an automated message, please do not reply.</p>
                </div>
              </div>
            </body>
          </html>
        `,
      });
    } else if (email_action_type === 'recovery') {
      // Send password reset email
      emailResponse = await resend.emails.send({
        from: "UL Emergency System <onboarding@resend.dev>",
        to: [user.email],
        subject: "Reset Your Password - UL Emergency System",
        html: `
          <!DOCTYPE html>
          <html>
            <head>
              <meta charset="UTF-8">
              <meta name="viewport" content="width=device-width, initial-scale=1.0">
              <style>
                body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                .header { background: linear-gradient(135deg, #1e40af 0%, #b45309 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
                .content { background: #ffffff; padding: 30px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 10px 10px; }
                .button { display: inline-block; padding: 14px 28px; background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%); color: white; text-decoration: none; border-radius: 6px; font-weight: bold; margin: 20px 0; }
                .footer { text-align: center; margin-top: 20px; color: #6b7280; font-size: 14px; }
                .warning { background: #fef3c7; border-left: 4px solid #f59e0b; padding: 12px; margin: 20px 0; border-radius: 4px; }
              </style>
            </head>
            <body>
              <div class="container">
                <div class="header">
                  <h1 style="margin: 0;">Password Reset Request</h1>
                </div>
                <div class="content">
                  <h2>Reset Your Password</h2>
                  <p>We received a request to reset the password for your UL Emergency System account.</p>
                  <p>Click the button below to create a new password:</p>
                  <div style="text-align: center;">
                    <a href="${confirmationUrl}" class="button">Reset Password</a>
                  </div>
                  <p>Or copy and paste this link into your browser:</p>
                  <p style="background: #f3f4f6; padding: 10px; border-radius: 4px; word-break: break-all; font-size: 12px;">${confirmationUrl}</p>
                  <div class="warning">
                    <strong>⚠️ Security Notice:</strong>
                    <ul style="margin: 10px 0;">
                      <li>This link will expire in 1 hour</li>
                      <li>If you didn't request this, please ignore this email</li>
                      <li>Your password will not change unless you click the link above</li>
                    </ul>
                  </div>
                </div>
                <div class="footer">
                  <p>University of Limpopo Emergency Response System</p>
                  <p>This is an automated message, please do not reply.</p>
                </div>
              </div>
            </body>
          </html>
        `,
      });
    } else if (email_action_type === 'email_change') {
      // Send email change confirmation
      emailResponse = await resend.emails.send({
        from: "UL Emergency System <onboarding@resend.dev>",
        to: [user.email],
        subject: "Confirm Email Change - UL Emergency System",
        html: `
          <!DOCTYPE html>
          <html>
            <head>
              <meta charset="UTF-8">
              <meta name="viewport" content="width=device-width, initial-scale=1.0">
              <style>
                body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                .header { background: linear-gradient(135deg, #1e40af 0%, #b45309 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
                .content { background: #ffffff; padding: 30px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 10px 10px; }
                .button { display: inline-block; padding: 14px 28px; background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%); color: white; text-decoration: none; border-radius: 6px; font-weight: bold; margin: 20px 0; }
                .footer { text-align: center; margin-top: 20px; color: #6b7280; font-size: 14px; }
              </style>
            </head>
            <body>
              <div class="container">
                <div class="header">
                  <h1 style="margin: 0;">Email Change Request</h1>
                </div>
                <div class="content">
                  <h2>Confirm Your New Email</h2>
                  <p>You requested to change your email address for your UL Emergency System account.</p>
                  <p>Click the button below to confirm this change:</p>
                  <div style="text-align: center;">
                    <a href="${confirmationUrl}" class="button">Confirm Email Change</a>
                  </div>
                  <p>Or copy and paste this link into your browser:</p>
                  <p style="background: #f3f4f6; padding: 10px; border-radius: 4px; word-break: break-all; font-size: 12px;">${confirmationUrl}</p>
                  <p>If you didn't request this change, please ignore this email.</p>
                </div>
                <div class="footer">
                  <p>University of Limpopo Emergency Response System</p>
                  <p>This is an automated message, please do not reply.</p>
                </div>
              </div>
            </body>
          </html>
        `,
      });
    }

    console.log("Email sent successfully:", emailResponse);

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  } catch (error: any) {
    console.error("Error in auth email hook:", error);
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
