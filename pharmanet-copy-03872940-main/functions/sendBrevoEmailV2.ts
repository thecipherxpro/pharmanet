import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';
import { asyncHandler, ErrorTypes, validateRequired } from './helpers/errorHandler.js';
import { retryEmailSending } from './helpers/retryHelper.js';

Deno.serve(asyncHandler(async (req) => {
  const base44 = createClientFromRequest(req);
  
  try {
    await base44.auth.me();
  } catch (_) {
    console.log('[Brevo] Service role call detected');
  }

  const body = await req.json();
  validateRequired(body, ['to', 'subject', 'htmlContent']);
  
  const { to, subject, htmlContent, textContent, senderName, senderEmail } = body;

  const apiKey = Deno.env.get('BREVO_API_KEY');
  const defaultSenderEmail = Deno.env.get('BREVO_SENDER_EMAIL');
  const defaultSenderName = Deno.env.get('BREVO_SENDER_NAME') || 'Pharmanet';

  if (!apiKey || !defaultSenderEmail) {
    throw ErrorTypes.EXTERNAL_SERVICE_ERROR('Brevo', 'API credentials not configured');
  }

  const emailData = {
    sender: {
      name: senderName || defaultSenderName,
      email: senderEmail || defaultSenderEmail
    },
    to: [{ email: to }],
    subject: subject,
    htmlContent: htmlContent
  };

  if (textContent) {
    emailData.textContent = textContent;
  }

  // Send email with retry logic
  const result = await retryEmailSending(async () => {
    const response = await fetch('https://api.brevo.com/v3/smtp/email', {
      method: 'POST',
      headers: {
        'accept': 'application/json',
        'content-type': 'application/json',
        'api-key': apiKey
      },
      body: JSON.stringify(emailData)
    });

    if (!response.ok) {
      const errorData = await response.json();
      const error = new Error(`Brevo API error: ${errorData.message || 'Unknown error'}`);
      error.response = { status: response.status, data: errorData };
      throw error;
    }

    return await response.json();
  }, 'Brevo email');
  
  return Response.json({
    success: true,
    messageId: result.messageId
  });
}));