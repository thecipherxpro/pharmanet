import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);

    try {
      await base44.auth.me();
    } catch (_) {
      console.log('[Brevo API] Service role call detected');
    }

    const { to, subject, html_body } = await req.json();

    if (!to || !subject || !html_body) {
      return Response.json(
        { error: "Missing required fields: to, subject, html_body" },
        { status: 400 }
      );
    }

    const brevoApiKey = Deno.env.get("BREVO_API_KEY");
    const senderEmail = Deno.env.get("BREVO_SENDER_EMAIL");
    const senderName = Deno.env.get("BREVO_SENDER_NAME") || "Pharmanet Team";

    if (!brevoApiKey || !senderEmail) {
      console.error("[Brevo API] Missing credentials");
      return Response.json(
        { error: "Brevo API credentials not configured" },
        { status: 500 }
      );
    }

    console.log("📧 [Brevo API] Sending email to:", to);

    const response = await fetch("https://api.brevo.com/v3/smtp/email", {
      method: "POST",
      headers: {
        "accept": "application/json",
        "api-key": brevoApiKey,
        "content-type": "application/json"
      },
      body: JSON.stringify({
        sender: {
          name: senderName,
          email: senderEmail
        },
        to: [{ email: to }],
        subject: subject,
        htmlContent: html_body
      })
    });

    if (!response.ok) {
      const errorData = await response.text();
      console.error("❌ [Brevo API] Failed:", response.status, errorData);
      return Response.json(
        { 
          error: `Brevo API error: ${response.status}`,
          details: errorData
        },
        { status: 500 }
      );
    }

    const data = await response.json();
    console.log("✅ [Brevo API] Email sent successfully:", data.messageId);

    return Response.json({ 
      success: true, 
      messageId: data.messageId 
    });

  } catch (error) {
    console.error("❌ [Brevo API] Exception:", error);
    return Response.json(
      { error: error.message },
      { status: 500 }
    );
  }
});