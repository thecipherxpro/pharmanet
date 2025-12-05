import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';

const BREVO_API_KEY = Deno.env.get("BREVO_API_KEY");
const BREVO_SENDER_EMAIL = Deno.env.get("BREVO_SENDER_EMAIL");
const BREVO_SENDER_NAME = Deno.env.get("BREVO_SENDER_NAME");
const CRON_SECRET = Deno.env.get("CRON_SECRET_TOKEN");

Deno.serve(async (req) => {
  try {
    // Verify cron secret for automated calls
    const url = new URL(req.url);
    const cronSecret = url.searchParams.get('secret');
    
    const base44 = createClientFromRequest(req);
    
    // Allow either admin user or cron secret
    let isAuthorized = false;
    try {
      const user = await base44.auth.me();
      if (user?.role === 'admin') isAuthorized = true;
    } catch {}
    
    if (cronSecret === CRON_SECRET) isAuthorized = true;
    
    if (!isAuthorized) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get all open shifts
    const shifts = await base44.asServiceRole.entities.Shift.filter({ status: 'open' });
    
    if (!shifts || shifts.length === 0) {
      return Response.json({ message: 'No open shifts to send', sent: 0 });
    }

    // Get all pharmacists
    const users = await base44.asServiceRole.entities.User.list();
    const pharmacists = users.filter(u => u.user_type === 'pharmacist' && u.email);

    if (!pharmacists || pharmacists.length === 0) {
      return Response.json({ message: 'No pharmacists found', sent: 0 });
    }

    // Sort shifts by created date (newest first) and take top 10
    const recentShifts = shifts
      .sort((a, b) => new Date(b.created_date) - new Date(a.created_date))
      .slice(0, 10);

    // Build HTML email
    const shiftsHtml = recentShifts.map(shift => {
      const schedule = shift.schedule || [];
      const firstDate = schedule[0] || {};
      const dateStr = firstDate.date ? formatDate(firstDate.date) : 'TBD';
      const timeStr = firstDate.start_time && firstDate.end_time 
        ? `${formatTime(firstDate.start_time)} - ${formatTime(firstDate.end_time)}`
        : 'TBD';
      
      return `
        <tr>
          <td style="padding: 16px; border-bottom: 1px solid #e5e7eb;">
            <div style="font-weight: 600; color: #111827; margin-bottom: 4px;">${shift.pharmacy_name || 'Pharmacy'}</div>
            <div style="font-size: 13px; color: #6b7280; margin-bottom: 8px;">${shift.title || 'Shift Available'}</div>
            <div style="display: flex; gap: 16px; font-size: 12px; color: #374151;">
              <span>📍 ${shift.pharmacy_city || 'Ontario'}</span>
              <span>📅 ${dateStr}${schedule.length > 1 ? ` (+${schedule.length - 1} more)` : ''}</span>
              <span>⏰ ${timeStr}</span>
            </div>
          </td>
          <td style="padding: 16px; border-bottom: 1px solid #e5e7eb; text-align: right; vertical-align: middle;">
            <div style="font-size: 18px; font-weight: 700; color: #059669;">$${shift.hourly_rate || 50}/hr</div>
            <div style="font-size: 12px; color: #6b7280;">Total: $${shift.total_pay || 0}</div>
          </td>
        </tr>
      `;
    }).join('');

    const baseUrl = 'https://pharmanet.base44.app';
    
    const emailHtml = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
      </head>
      <body style="margin: 0; padding: 0; background-color: #f3f4f6; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
        <div style="max-width: 600px; margin: 0 auto; padding: 24px;">
          <!-- Header -->
          <div style="background: linear-gradient(135deg, #0d9488 0%, #0891b2 100%); border-radius: 16px 16px 0 0; padding: 32px; text-align: center;">
            <h1 style="color: white; margin: 0; font-size: 24px;">🏥 New Shifts Available!</h1>
            <p style="color: rgba(255,255,255,0.9); margin: 8px 0 0 0; font-size: 14px;">
              ${recentShifts.length} shifts with great pay are waiting for you
            </p>
          </div>
          
          <!-- Content -->
          <div style="background: white; padding: 24px; border-radius: 0 0 16px 16px;">
            <table style="width: 100%; border-collapse: collapse;">
              ${shiftsHtml}
            </table>
            
            <!-- CTA Button -->
            <div style="text-align: center; margin-top: 24px;">
              <a href="${baseUrl}/BrowseShifts" 
                 style="display: inline-block; background: #0d9488; color: white; padding: 14px 32px; border-radius: 10px; text-decoration: none; font-weight: 600; font-size: 14px;">
                View All Available Shifts →
              </a>
            </div>
            
            <p style="color: #6b7280; font-size: 12px; text-align: center; margin-top: 24px;">
              You're receiving this because you're a registered pharmacist on Pharmanet.<br>
              <a href="${baseUrl}/PharmacistSettings" style="color: #0d9488;">Manage preferences</a>
            </p>
          </div>
        </div>
      </body>
      </html>
    `;

    // Send emails to all pharmacists
    let sentCount = 0;
    let errors = [];

    for (const pharmacist of pharmacists) {
      try {
        const response = await fetch('https://api.brevo.com/v3/smtp/email', {
          method: 'POST',
          headers: {
            'accept': 'application/json',
            'api-key': BREVO_API_KEY,
            'content-type': 'application/json',
          },
          body: JSON.stringify({
            sender: {
              name: BREVO_SENDER_NAME || 'Pharmanet',
              email: BREVO_SENDER_EMAIL,
            },
            to: [{ email: pharmacist.email, name: pharmacist.full_name || 'Pharmacist' }],
            subject: `🏥 ${recentShifts.length} New Shifts Available - Great Pay Awaits!`,
            htmlContent: emailHtml,
          }),
        });

        if (response.ok) {
          sentCount++;
        } else {
          const errorData = await response.text();
          errors.push({ email: pharmacist.email, error: errorData });
        }
      } catch (err) {
        errors.push({ email: pharmacist.email, error: err.message });
      }
    }

    return Response.json({
      success: true,
      message: `Sent shift digest to ${sentCount} pharmacists`,
      sent: sentCount,
      total: pharmacists.length,
      shiftsIncluded: recentShifts.length,
      errors: errors.length > 0 ? errors : undefined,
    });

  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});

function formatDate(dateStr) {
  try {
    const [year, month, day] = dateStr.split('-').map(Number);
    const date = new Date(year, month - 1, day);
    return date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
  } catch {
    return dateStr;
  }
}

function formatTime(timeStr) {
  try {
    const [hours, minutes] = timeStr.split(':').map(Number);
    const period = hours >= 12 ? 'PM' : 'AM';
    const hour12 = hours % 12 || 12;
    return `${hour12}:${minutes.toString().padStart(2, '0')} ${period}`;
  } catch {
    return timeStr;
  }
}