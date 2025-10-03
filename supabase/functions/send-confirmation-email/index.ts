import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "npm:resend@2.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface ConfirmationEmailRequest {
  email: string;
  fullName: string;
  confirmationUrl: string;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { email, fullName, confirmationUrl }: ConfirmationEmailRequest = await req.json();

    console.log("Sending confirmation email to:", email);

    const emailResponse = await resend.emails.send({
      from: "UL Emergency System <onboarding@resend.dev>",
      to: [email],
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

    console.log("Email sent successfully:", emailResponse);

    return new Response(JSON.stringify({ success: true, data: emailResponse }), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  } catch (error: any) {
    console.error("Error sending confirmation email:", error);
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
