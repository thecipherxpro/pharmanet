import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';
import { asyncHandler, ErrorTypes, validateRequired } from './helpers/errorHandler.js';
import { retryEmailSending } from './helpers/retryHelper.js';

Deno.serve(asyncHandler(async (req) => {
  const base44 = createClientFromRequest(req);
  
  const body = await req.json();
  validateRequired(body, ['invitation_id']);
  
  const { invitation_id } = body;

  // Get invitation details
  const invitations = await base44.asServiceRole.entities.ShiftInvitation.filter({
    id: invitation_id
  });
  
  if (!invitations || invitations.length === 0) {
    throw ErrorTypes.NOT_FOUND('Invitation not found');
  }

  const invitation = invitations[0];

  // Get shift details
  const shifts = await base44.asServiceRole.entities.Shift.filter({
    id: invitation.shift_id
  });
  
  if (!shifts || shifts.length === 0) {
    throw ErrorTypes.NOT_FOUND('Shift not found');
  }

  const shift = shifts[0];

  // Format shift date
  const shiftDate = new Date(shift.shift_date);
  const formattedDate = shiftDate.toLocaleDateString('en-US', { 
    weekday: 'long', 
    month: 'long', 
    day: 'numeric', 
    year: 'numeric' 
  });

  // Format times
  const formatTime = (time) => {
    const [hours, minutes] = time.split(':');
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour > 12 ? hour - 12 : hour === 0 ? 12 : hour;
    return `${displayHour}:${minutes} ${ampm}`;
  };

  const startTime = formatTime(shift.start_time);
  const endTime = formatTime(shift.end_time);
  const emailSubject = `Shift Invitation from ${invitation.employer_name} - ${shift.pharmacy_name}`;

  const htmlBody = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Shift Invitation</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #f3f4f6;">
  <table role="presentation" style="width: 100%; border: 0;">
    <tr>
      <td style="padding: 20px 0;">
        <table role="presentation" style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
          
          <tr>
            <td style="background: linear-gradient(135deg, #14b8a6 0%, #0891b2 100%); padding: 32px 40px; text-align: center;">
              <h1 style="margin: 0 0 8px 0; color: #ffffff; font-size: 24px; font-weight: bold;">
                Shift Invitation
              </h1>
              <p style="margin: 0; color: rgba(255,255,255,0.95); font-size: 15px;">
                ${invitation.employer_name} wants you for a shift
              </p>
            </td>
          </tr>

          <tr>
            <td style="padding: 40px;">
              
              <p style="margin: 0 0 24px 0; color: #374151; font-size: 16px; line-height: 1.6;">
                Hi <strong>${invitation.pharmacist_name}</strong>,
              </p>

              <p style="margin: 0 0 24px 0; color: #374151; font-size: 16px; line-height: 1.6;">
                You have been invited to work a shift at <strong>${shift.pharmacy_name}</strong>.
              </p>

              <table role="presentation" style="width: 100%; background: #f0fdfa; border: 2px solid #14b8a6; border-radius: 12px; margin-bottom: 24px;">
                <tr>
                  <td style="padding: 24px;">
                    <h2 style="margin: 0 0 20px 0; color: #0f766e; font-size: 18px; font-weight: bold;">Shift Details</h2>
                    
                    <p style="margin: 0 0 12px 0; color: #0f766e; font-size: 12px; font-weight: 600; text-transform: uppercase;">Location</p>
                    <p style="margin: 0 0 20px 0; color: #134e4a; font-size: 16px; font-weight: bold;">
                      ${shift.pharmacy_name}<br>
                      <span style="color: #64748b; font-size: 14px; font-weight: normal;">${shift.pharmacy_city}, ${shift.pharmacy_province}</span>
                    </p>
                    
                    <p style="margin: 0 0 12px 0; color: #0f766e; font-size: 12px; font-weight: 600; text-transform: uppercase;">Date & Time</p>
                    <p style="margin: 0 0 20px 0; color: #134e4a; font-size: 16px; font-weight: bold;">
                      ${formattedDate}<br>
                      <span style="color: #64748b; font-size: 14px; font-weight: normal;">${startTime} - ${endTime}</span>
                    </p>
                    
                    <p style="margin: 0 0 12px 0; color: #0f766e; font-size: 12px; font-weight: 600; text-transform: uppercase;">Pay</p>
                    <p style="margin: 0; color: #10b981; font-size: 20px; font-weight: bold;">
                      $${shift.hourly_rate}/hr<br>
                      <span style="color: #64748b; font-size: 14px; font-weight: normal;">Total: $${shift.total_pay.toFixed(2)} (${shift.total_hours}h)</span>
                    </p>
                  </td>
                </tr>
              </table>

              ${invitation.message ? `
              <table role="presentation" style="width: 100%; background: #fef3c7; border-left: 4px solid #f59e0b; border-radius: 8px; margin-bottom: 24px;">
                <tr>
                  <td style="padding: 20px;">
                    <p style="margin: 0 0 8px 0; color: #92400e; font-size: 12px; font-weight: 600; text-transform: uppercase;">Message from ${invitation.employer_name}</p>
                    <p style="margin: 0; color: #451a03; font-size: 15px; line-height: 1.6;">"${invitation.message}"</p>
                  </td>
                </tr>
              </table>
              ` : ''}

              <table role="presentation" style="width: 100%; margin: 32px 0;">
                <tr>
                  <td style="text-align: center;">
                    <a href="${Deno.env.get('PUBLIC_APP_DOMAIN')}/PharmacistInvitations" style="display: inline-block; padding: 16px 32px; background: linear-gradient(135deg, #14b8a6 0%, #0891b2 100%); color: #ffffff; text-decoration: none; font-weight: 600; font-size: 16px; border-radius: 8px;">
                      View Invitation
                    </a>
                  </td>
                </tr>
              </table>

              <p style="margin: 0; color: #6b7280; font-size: 14px; line-height: 1.6; text-align: center; padding-top: 24px; border-top: 1px solid #e5e7eb;">
                Log in to your Pharmanet account to accept or decline this invitation.
              </p>

            </td>
          </tr>

          <tr>
            <td style="background-color: #f9fafb; padding: 24px; text-align: center; border-top: 1px solid #e5e7eb;">
              <p style="margin: 0 0 8px 0; color: #111827; font-size: 14px; font-weight: 600;">Pharmanet</p>
              <p style="margin: 0 0 8px 0; color: #6b7280; font-size: 12px;">Connecting Pharmacies & Pharmacists</p>
              <p style="margin: 12px 0 0 0; color: #9ca3af; font-size: 11px;">This is an automated email. Please do not reply.</p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `;

  // Send email with retry logic
  await retryEmailSending(async () => {
    const emailResponse = await fetch(`${req.headers.get('origin')}/api/functions/sendBrevoEmailV2`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': req.headers.get('Authorization')
      },
      body: JSON.stringify({
        to: invitation.pharmacist_email,
        subject: emailSubject,
        htmlContent: htmlBody,
        textContent: `${invitation.employer_name} has invited you to work a shift at ${shift.pharmacy_name} on ${shift.shift_date} from ${startTime} to ${endTime}. Pay: $${shift.hourly_rate}/hr.`
      })
    });

    if (!emailResponse.ok) {
      const error = new Error('Failed to send email');
      error.response = { status: emailResponse.status };
      throw error;
    }
    
    return await emailResponse.json();
  }, 'Shift invitation email');

  return Response.json({
    success: true,
    message: 'Invitation email sent successfully'
  });
}));