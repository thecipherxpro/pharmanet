import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    
    // Verify user is authenticated (should be employer)
    const user = await base44.auth.me();
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { invitation_id } = await req.json();

    if (!invitation_id) {
      return Response.json({ error: 'Missing invitation_id' }, { status: 400 });
    }

    // Get invitation details (as service role to access all data)
    const invitations = await base44.asServiceRole.entities.ShiftInvitation.filter({ 
      id: invitation_id 
    });

    if (invitations.length === 0) {
      return Response.json({ error: 'Invitation not found' }, { status: 404 });
    }

    const invitation = invitations[0];

    // Get shift details
    const shifts = await base44.asServiceRole.entities.Shift.filter({ 
      id: invitation.shift_id 
    });

    if (shifts.length === 0) {
      return Response.json({ error: 'Shift not found' }, { status: 404 });
    }

    const shift = shifts[0];

    // Helper to get schedule from shift (supports new schedule array format)
    const getScheduleFromShift = (shiftData) => {
      if (shiftData.schedule && Array.isArray(shiftData.schedule) && shiftData.schedule.length > 0) {
        return shiftData.schedule;
      }
      // Fallback to legacy format
      if (shiftData.shift_date) {
        return [{
          date: shiftData.shift_date,
          start_time: shiftData.start_time || '09:00',
          end_time: shiftData.end_time || '17:00'
        }];
      }
      return [];
    };

    const schedule = getScheduleFromShift(shift);
    const primaryDate = schedule[0] || {};

    // Format shift date safely
    const formatShiftDate = (dateStr) => {
      if (!dateStr) return 'Date not set';
      try {
        // Parse as local date to avoid timezone issues
        const [year, month, day] = dateStr.split('-').map(Number);
        const date = new Date(year, month - 1, day);
        return date.toLocaleDateString('en-US', { 
          weekday: 'long', 
          month: 'long', 
          day: 'numeric', 
          year: 'numeric' 
        });
      } catch {
        return 'Date not set';
      }
    };

    const formattedDate = formatShiftDate(primaryDate.date);

    // Format times (assuming HH:MM format)
    const formatTime = (time) => {
      if (!time) return 'N/A';
      const [hours, minutes] = time.split(':');
      const hour = parseInt(hours);
      if (isNaN(hour)) return time;
      const ampm = hour >= 12 ? 'PM' : 'AM';
      const displayHour = hour > 12 ? hour - 12 : hour === 0 ? 12 : hour;
      return `${displayHour}:${minutes} ${ampm}`;
    };

    const startTime = formatTime(primaryDate.start_time);
    const endTime = formatTime(primaryDate.end_time);
    
    // Build multi-date display if applicable
    const hasMultipleDates = schedule.length > 1;
    const additionalDatesHtml = hasMultipleDates ? `
      <p style="margin: 8px 0 0 0; color: #64748b; font-size: 13px; font-style: italic;">
        +${schedule.length - 1} additional date${schedule.length - 1 > 1 ? 's' : ''} scheduled
      </p>
    ` : '';

    // Create professional mobile-responsive HTML email
    const emailHTML = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta http-equiv="X-UA-Compatible" content="IE=edge">
  <title>Shift Invitation - Pharmanet</title>
  <style>
    body {
      margin: 0;
      padding: 0;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      background-color: #f3f4f6;
      -webkit-font-smoothing: antialiased;
      -moz-osx-font-smoothing: grayscale;
    }
    table {
      border-collapse: collapse;
      width: 100%;
    }
    img {
      border: 0;
      outline: none;
      text-decoration: none;
      -ms-interpolation-mode: bicubic;
    }
    .container {
      max-width: 600px;
      margin: 0 auto;
    }
    .button {
      display: inline-block;
      padding: 16px 32px;
      background: linear-gradient(135deg, #0ea5e9 0%, #3b82f6 100%);
      color: #ffffff !important;
      text-decoration: none;
      font-weight: 600;
      font-size: 16px;
      border-radius: 8px;
      text-align: center;
    }
    .button:hover {
      background: linear-gradient(135deg, #0284c7 0%, #2563eb 100%);
    }
    @media only screen and (max-width: 600px) {
      .container {
        width: 100% !important;
      }
      .content {
        padding: 20px !important;
      }
      .header {
        padding: 24px 20px !important;
      }
      .detail-row {
        display: block !important;
      }
      .detail-label {
        padding-bottom: 8px !important;
      }
      .detail-value {
        padding-left: 0 !important;
        padding-bottom: 16px !important;
      }
      .button {
        width: 100% !important;
        box-sizing: border-box;
      }
    }
  </style>
</head>
<body style="margin: 0; padding: 0; background-color: #f3f4f6;">
  <table role="presentation" style="width: 100%; border: 0; cellspacing: 0; cellpadding: 0;">
    <tr>
      <td style="padding: 20px 0;">
        <table role="presentation" class="container" style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
          
          <!-- Header -->
          <tr>
            <td class="header" style="background: linear-gradient(135deg, #0ea5e9 0%, #3b82f6 100%); padding: 32px 40px; text-align: center;">
              <h1 style="margin: 0 0 8px 0; color: #ffffff; font-size: 24px; font-weight: bold; line-height: 1.3;">
                Shift Invitation
              </h1>
              <p style="margin: 0; color: rgba(255,255,255,0.95); font-size: 15px;">
                ${invitation.employer_name} wants you for a shift
              </p>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td class="content" style="padding: 40px;">
              
              <!-- Greeting -->
              <p style="margin: 0 0 24px 0; color: #374151; font-size: 16px; line-height: 1.6;">
                Hi <strong>${invitation.pharmacist_name}</strong>,
              </p>

              <p style="margin: 0 0 24px 0; color: #374151; font-size: 16px; line-height: 1.6;">
                You have been invited to work a shift at <strong>${shift.pharmacy_name}</strong> by <strong>${invitation.employer_name}</strong>.
              </p>

              <!-- Shift Details Card -->
              <table role="presentation" style="width: 100%; background: linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%); border: 2px solid #0ea5e9; border-radius: 12px; margin-bottom: 24px;">
                <tr>
                  <td style="padding: 24px;">
                    <h2 style="margin: 0 0 20px 0; color: #0369a1; font-size: 18px; font-weight: bold;">
                      Shift Details
                    </h2>
                    
                    <!-- Location -->
                    <table role="presentation" class="detail-row" style="width: 100%; margin-bottom: 16px;">
                      <tr>
                        <td class="detail-label" style="color: #0369a1; font-size: 12px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px; padding-bottom: 4px; vertical-align: top; width: 120px;">
                          Location
                        </td>
                        <td class="detail-value" style="color: #1e40af; font-size: 16px; font-weight: bold; padding-left: 16px; vertical-align: top;">
                          ${shift.pharmacy_name}<br>
                          <span style="color: #64748b; font-size: 14px; font-weight: normal;">${shift.pharmacy_city}, ${shift.pharmacy_province}</span>
                        </td>
                      </tr>
                    </table>

                    <!-- Date -->
                    <table role="presentation" class="detail-row" style="width: 100%; margin-bottom: 16px;">
                      <tr>
                        <td class="detail-label" style="color: #0369a1; font-size: 12px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px; padding-bottom: 4px; vertical-align: top; width: 120px;">
                          Date
                        </td>
                        <td class="detail-value" style="color: #1e40af; font-size: 16px; font-weight: bold; padding-left: 16px; vertical-align: top;">
                          ${formattedDate}
                          ${additionalDatesHtml}
                        </td>
                      </tr>
                    </table>

                    <!-- Time -->
                    <table role="presentation" class="detail-row" style="width: 100%; margin-bottom: 16px;">
                      <tr>
                        <td class="detail-label" style="color: #0369a1; font-size: 12px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px; padding-bottom: 4px; vertical-align: top; width: 120px;">
                          Time
                        </td>
                        <td class="detail-value" style="color: #1e40af; font-size: 16px; font-weight: bold; padding-left: 16px; vertical-align: top;">
                          ${startTime} - ${endTime}
                        </td>
                      </tr>
                    </table>

                    <!-- Pay -->
                    <table role="presentation" class="detail-row" style="width: 100%;">
                      <tr>
                        <td class="detail-label" style="color: #0369a1; font-size: 12px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px; padding-bottom: 4px; vertical-align: top; width: 120px;">
                          Pay
                        </td>
                        <td class="detail-value" style="color: #10b981; font-size: 20px; font-weight: bold; padding-left: 16px; vertical-align: top;">
                          $${shift.hourly_rate}/hr<br>
                          <span style="color: #64748b; font-size: 14px; font-weight: normal;">Total: $${shift.total_pay.toFixed(2)} (${shift.total_hours} hours)</span>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>

              ${invitation.message ? `
              <!-- Personal Message -->
              <table role="presentation" style="width: 100%; background: #fef3c7; border-left: 4px solid #f59e0b; border-radius: 8px; margin-bottom: 24px;">
                <tr>
                  <td style="padding: 20px;">
                    <p style="margin: 0 0 8px 0; color: #92400e; font-size: 12px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px;">
                      Message from ${invitation.employer_name}
                    </p>
                    <p style="margin: 0; color: #451a03; font-size: 15px; line-height: 1.6;">
                      "${invitation.message}"
                    </p>
                  </td>
                </tr>
              </table>
              ` : ''}

              <!-- Call to Action -->
              <table role="presentation" style="width: 100%; margin: 32px 0;">
                <tr>
                  <td style="text-align: center;">
                    <a href="https://pharmanet.ca/Notifications" class="button" style="display: inline-block; padding: 16px 32px; background: linear-gradient(135deg, #0ea5e9 0%, #3b82f6 100%); color: #ffffff; text-decoration: none; font-weight: 600; font-size: 16px; border-radius: 8px;">
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

          <!-- Footer -->
          <tr>
            <td style="background-color: #f9fafb; padding: 24px; text-align: center; border-top: 1px solid #e5e7eb;">
              <p style="margin: 0 0 8px 0; color: #111827; font-size: 14px; font-weight: 600;">
                Pharmanet
              </p>
              <p style="margin: 0 0 8px 0; color: #6b7280; font-size: 12px;">
                Connecting Pharmacies & Pharmacists
              </p>
              <p style="margin: 0 0 8px 0;">
                <a href="https://pharmanet.ca" style="color: #3b82f6; text-decoration: none; font-size: 12px;">pharmanet.ca</a>
              </p>
              <p style="margin: 12px 0 0 0; color: #9ca3af; font-size: 11px;">
                This is an automated email from Pharmanet. Please do not reply.
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
    `;

    // Send email using Brevo
    await base44.asServiceRole.functions.invoke('sendBrevoEmail', {
      to: invitation.pharmacist_email,
      subject: `Shift Invitation from ${invitation.employer_name} - ${shift.pharmacy_name}`,
      html_body: emailHTML
    });

    return Response.json({
      success: true,
      message: 'Invitation email sent successfully'
    });

  } catch (error) {
    console.error('Error sending invitation email:', error);
    return Response.json({ 
      error: error.message || 'Failed to send invitation email' 
    }, { status: 500 });
  }
});