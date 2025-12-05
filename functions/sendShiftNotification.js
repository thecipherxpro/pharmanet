
import { createClientFromRequest } from 'npm:@base44/sdk@0.7.1';

// Helper function to format time to 12-hour AM/PM
function formatTime12Hour(time24: string | undefined): string {
  if (!time24) return '';
  
  const [hoursStr, minutesStr] = time24.split(':');
  const hours = parseInt(hoursStr, 10);
  const minutes = parseInt(minutesStr, 10);
  
  if (isNaN(hours) || isNaN(minutes)) return time24;
  
  const period = hours >= 12 ? 'PM' : 'AM';
  const hours12 = hours % 12 || 12; // Converts 0 to 12 for AM/PM
  
  return `${hours12}:${minutes.toString().padStart(2, '0')} ${period}`;
}

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        
        // Verify user is authenticated
        const user = await base44.auth.me();
        if (!user) {
            return Response.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { notification_type, shift_data, recipient_email } = await req.json();

        // Check if recipient has email notifications enabled
        // Use asServiceRole to bypass RLS and fetch user details for notification preferences
        const users = await base44.asServiceRole.entities.User.list();
        const recipient = users.find(u => u.email === recipient_email);
        
        if (!recipient || recipient.email_notifications === false) {
            return Response.json({ 
                success: true, 
                message: 'Email notifications disabled for user' 
            });
        }

        // Get app URL from environment or use default
        const appUrl = Deno.env.get('APP_URL') || 'https://pharmanet.base44.app';

        // Format times in shift_data to 12-hour format
        const formattedShiftData = {
            ...shift_data,
            start_time: shift_data.start_time ? formatTime12Hour(shift_data.start_time) : '',
            end_time: shift_data.end_time ? formatTime12Hour(shift_data.end_time) : ''
        };

        let emailSubject = '';
        let emailBody = '';

        switch (notification_type) {
            case 'new_application':
                emailSubject = 'New Application for Your Shift';
                emailBody = createNewApplicationEmail(formattedShiftData, appUrl);
                break;
            case 'application_accepted':
                emailSubject = 'Your Application Was Accepted';
                emailBody = createApplicationAcceptedEmail(formattedShiftData, appUrl);
                break;
            case 'application_rejected':
                emailSubject = 'Update on Your Application';
                emailBody = createApplicationRejectedEmail(formattedShiftData, appUrl);
                break;
            case 'shift_filled':
                emailSubject = 'Your Shift Has Been Filled';
                emailBody = createShiftFilledEmail(formattedShiftData, appUrl);
                break;
            case 'shift_reminder':
                emailSubject = 'Reminder: Upcoming Shift Tomorrow';
                emailBody = createShiftReminderEmail(formattedShiftData, appUrl);
                break;
            default:
                return Response.json({ error: 'Invalid notification type' }, { status: 400 });
        }

        // Send email
        await base44.integrations.Core.SendEmail({
            from_name: 'Pharmanet',
            to: recipient_email,
            subject: emailSubject,
            body: emailBody
        });

        return Response.json({ 
            success: true, 
            message: 'Notification email sent successfully' 
        });

    } catch (error) {
        console.error('Error sending notification email:', error);
        return Response.json({ 
            error: error.message || 'Failed to send notification' 
        }, { status: 500 });
    }
});

function createNewApplicationEmail(shiftData, appUrl) {
    return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta http-equiv="X-UA-Compatible" content="IE=edge">
</head>
<body style="margin: 0; padding: 0; background-color: #f5f5f5; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">
    <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color: #f5f5f5; padding: 20px 0;">
        <tr>
            <td align="center">
                <table width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width: 600px; background-color: #ffffff; border-radius: 8px;">
                    
                    <tr>
                        <td style="background-color: #1e40af; padding: 24px 20px; text-align: center; border-radius: 8px 8px 0 0;">
                            <h1 style="margin: 0; color: #ffffff; font-size: 22px; font-weight: 600;">New Application Received</h1>
                        </td>
                    </tr>

                    <tr>
                        <td style="padding: 32px 20px;">
                            
                            <p style="margin: 0 0 20px; color: #111827; font-size: 15px; line-height: 1.6;">
                                A pharmacist has applied for your shift. Review their profile and respond to the application.
                            </p>

                            <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color: #f9fafb; border-radius: 6px; margin-bottom: 24px;">
                                <tr>
                                    <td style="padding: 16px;">
                                        <p style="margin: 0 0 12px; color: #111827; font-size: 14px; font-weight: 600;">Shift Details</p>
                                        
                                        <table width="100%" cellpadding="0" cellspacing="0" border="0">
                                            <tr>
                                                <td style="padding: 4px 0; color: #6b7280; font-size: 13px; width: 80px;">Date:</td>
                                                <td style="padding: 4px 0; color: #111827; font-size: 13px; font-weight: 500;">${shiftData.shift_date}</td>
                                            </tr>
                                            <tr>
                                                <td style="padding: 4px 0; color: #6b7280; font-size: 13px;">Time:</td>
                                                <td style="padding: 4px 0; color: #111827; font-size: 13px; font-weight: 500;">${shiftData.start_time} - ${shiftData.end_time}</td>
                                            </tr>
                                            <tr>
                                                <td style="padding: 4px 0; color: #6b7280; font-size: 13px;">Pharmacy:</td>
                                                <td style="padding: 4px 0; color: #111827; font-size: 13px; font-weight: 500;">${shiftData.pharmacy_name}</td>
                                            </tr>
                                            <tr>
                                                <td style="padding: 4px 0; color: #6b7280; font-size: 13px;">Applicant:</td>
                                                <td style="padding: 4px 0; color: #111827; font-size: 13px; font-weight: 500;">${shiftData.applicant_name}</td>
                                            </tr>
                                        </table>
                                    </td>
                                </tr>
                            </table>

                            <table width="100%" cellpadding="0" cellspacing="0" border="0">
                                <tr>
                                    <td align="center" style="padding: 0;">
                                        <a href="${appUrl}" style="display: inline-block; background-color: #1e40af; color: #ffffff; text-decoration: none; padding: 12px 28px; border-radius: 6px; font-size: 14px; font-weight: 600;">
                                            Review Application
                                        </a>
                                    </td>
                                </tr>
                            </table>

                        </td>
                    </tr>

                    <tr>
                        <td style="background-color: #f9fafb; padding: 16px 20px; text-align: center; border-top: 1px solid #e5e7eb;">
                            <p style="margin: 0; color: #9ca3af; font-size: 12px;">© 2024 Pharmanet. All rights reserved.</p>
                        </td>
                    </tr>

                </table>
            </td>
        </tr>
    </table>
</body>
</html>
    `.trim();
}

function createApplicationAcceptedEmail(shiftData, appUrl) {
    
    return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta http-equiv="X-UA-Compatible" content="IE=edge">
</head>
<body style="margin: 0; padding: 0; background-color: #f5f5f5; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">
    <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color: #f5f5f5; padding: 20px 0;">
        <tr>
            <td align="center">
                <table width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width: 600px; background-color: #ffffff; border-radius: 8px;">
                    
                    <tr>
                        <td style="background-color: #059669; padding: 24px 20px; text-align: center; border-radius: 8px 8px 0 0;">
                            <h1 style="margin: 0; color: #ffffff; font-size: 22px; font-weight: 600;">Application Accepted</h1>
                            <p style="margin: 8px 0 0; color: rgba(255,255,255,0.9); font-size: 14px;">Congratulations on your new shift!</p>
                        </td>
                    </tr>

                    <tr>
                        <td style="padding: 32px 20px;">
                            
                            <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color: #f0fdf4; border-left: 4px solid #10b981; border-radius: 6px; margin-bottom: 20px;">
                                <tr>
                                    <td style="padding: 16px;">
                                        <p style="margin: 0; color: #065f46; font-size: 14px; font-weight: 600;">
                                            ✓ Shift Confirmed
                                        </p>
                                        <p style="margin: 4px 0 0; color: #047857; font-size: 13px;">
                                            Your application has been approved. See details below.
                                        </p>
                                    </td>
                                </tr>
                            </table>

                            <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color: #f9fafb; border-radius: 6px; margin-bottom: 24px;">
                                <tr>
                                    <td style="padding: 16px;">
                                        <p style="margin: 0 0 12px; color: #111827; font-size: 14px; font-weight: 600;">Confirmed Shift</p>
                                        
                                        <table width="100%" cellpadding="0" cellspacing="0" border="0">
                                            <tr>
                                                <td style="padding: 4px 0; color: #6b7280; font-size: 13px; width: 80px;">Date:</td>
                                                <td style="padding: 4px 0; color: #111827; font-size: 13px; font-weight: 500;">${shiftData.shift_date}</td>
                                            </tr>
                                            <tr>
                                                <td style="padding: 4px 0; color: #6b7280; font-size: 13px;">Time:</td>
                                                <td style="padding: 4px 0; color: #111827; font-size: 13px; font-weight: 500;">${shiftData.start_time} - ${shiftData.end_time}</td>
                                            </tr>
                                            <tr>
                                                <td style="padding: 4px 0; color: #6b7280; font-size: 13px;">Pharmacy:</td>
                                                <td style="padding: 4px 0; color: #111827; font-size: 13px; font-weight: 500;">${shiftData.pharmacy_name}</td>
                                            </tr>
                                            <tr>
                                                <td style="padding: 4px 0; color: #6b7280; font-size: 13px;">Location:</td>
                                                <td style="padding: 4px 0; color: #111827; font-size: 13px; font-weight: 500;">${shiftData.pharmacy_city}</td>
                                            </tr>
                                            <tr>
                                                <td style="padding: 4px 0; color: #6b7280; font-size: 13px;">Rate:</td>
                                                <td style="padding: 4px 0; color: #059669; font-size: 13px; font-weight: 600;">$${shiftData.hourly_rate}/hr</td>
                                            </tr>
                                        </table>
                                    </td>
                                </tr>
                            </table>

                            <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color: #fef3c7; border-radius: 6px; margin-bottom: 24px;">
                                <tr>
                                    <td style="padding: 16px;">
                                        <p style="margin: 0 0 8px; color: #92400e; font-size: 13px; font-weight: 600;">Next Steps:</p>
                                        <p style="margin: 0; color: #92400e; font-size: 13px; line-height: 1.6;">
                                            • Mark this date in your calendar<br>
                                            • Review pharmacy details in your dashboard<br>
                                            • Contact the pharmacy if you have questions
                                        </p>
                                    </td>
                                </tr>
                            </table>

                            <table width="100%" cellpadding="0" cellspacing="0" border="0">
                                <tr>
                                    <td align="center">
                                        <a href="${appUrl}/my-schedule" style="display: inline-block; background-color: #1e40af; color: #ffffff; text-decoration: none; padding: 12px 28px; border-radius: 6px; font-size: 14px; font-weight: 600;">
                                            View My Schedule
                                        </a>
                                    </td>
                                </tr>
                            </table>

                        </td>
                    </tr>

                    <tr>
                        <td style="background-color: #f9fafb; padding: 16px 20px; text-align: center; border-top: 1px solid #e5e7eb;">
                            <p style="margin: 0; color: #9ca3af; font-size: 12px;">© 2024 Pharmanet. All rights reserved.</p>
                        </td>
                    </tr>

                </table>
            </td>
        </tr>
    </table>
</body>
</html>
    `.trim();
}

function createApplicationRejectedEmail(shiftData, appUrl) {
    
    return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta http-equiv="X-UA-Compatible" content="IE=edge">
</head>
<body style="margin: 0; padding: 0; background-color: #f5f5f5; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">
    <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color: #f5f5f5; padding: 20px 0;">
        <tr>
            <td align="center">
                <table width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width: 600px; background-color: #ffffff; border-radius: 8px;">
                    
                    <tr>
                        <td style="background-color: #6b7280; padding: 24px 20px; text-align: center; border-radius: 8px 8px 0 0;">
                            <h1 style="margin: 0; color: #ffffff; font-size: 22px; font-weight: 600;">Application Update</h1>
                        </td>
                    </tr>

                    <tr>
                        <td style="padding: 32px 20px;">
                            
                            <p style="margin: 0 0 20px; color: #111827; font-size: 15px; line-height: 1.6;">
                                Thank you for your interest. Unfortunately, this shift has been filled by another candidate.
                            </p>

                            <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color: #f9fafb; border-radius: 6px; margin-bottom: 24px;">
                                <tr>
                                    <td style="padding: 16px;">
                                        <table width="100%" cellpadding="0" cellspacing="0" border="0">
                                            <tr>
                                                <td style="padding: 4px 0; color: #6b7280; font-size: 13px; width: 80px;">Shift:</td>
                                                <td style="padding: 4px 0; color: #111827; font-size: 13px; font-weight: 500;">${shiftData.shift_date}</td>
                                            </tr>
                                            <tr>
                                                <td style="padding: 4px 0; color: #6b7280; font-size: 13px;">Pharmacy:</td>
                                                <td style="padding: 4px 0; color: #111827; font-size: 13px; font-weight: 500;">${shiftData.pharmacy_name}</td>
                                            </tr>
                                        </table>
                                    </td>
                                </tr>
                            </table>

                            <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color: #eff6ff; border-radius: 6px; margin-bottom: 24px;">
                                <tr>
                                    <td style="padding: 16px;">
                                        <p style="margin: 0; color: #1e40af; font-size: 13px; line-height: 1.6;">
                                            <strong style="display: block; margin-bottom: 8px;">Keep Applying!</strong>
                                            There are many more opportunities available. Browse shifts and submit more applications to increase your chances.
                                        </p>
                                    </td>
                                </tr>
                            </table>

                            <table width="100%" cellpadding="0" cellspacing="0" border="0">
                                <tr>
                                    <td align="center">
                                        <a href="${appUrl}/browse-shifts" style="display: inline-block; background-color: #1e40af; color: #ffffff; text-decoration: none; padding: 12px 28px; border-radius: 6px; font-size: 14px; font-weight: 600;">
                                            Browse More Shifts
                                        </a>
                                    </td>
                                </tr>
                            </table>

                        </td>
                    </tr>

                    <tr>
                        <td style="background-color: #f9fafb; padding: 16px 20px; text-align: center; border-top: 1px solid #e5e7eb;">
                            <p style="margin: 0; color: #9ca3af; font-size: 12px;">© 2024 Pharmanet. All rights reserved.</p>
                        </td>
                    </tr>

                </table>
            </td>
        </tr>
    </table>
</body>
</html>
    `.trim();
}

function createShiftFilledEmail(shiftData, appUrl) {
    
    return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta http-equiv="X-UA-Compatible" content="IE=edge">
</head>
<body style="margin: 0; padding: 0; background-color: #f5f5f5; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">
    <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color: #f5f5f5; padding: 20px 0;">
        <tr>
            <td align="center">
                <table width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width: 600px; background-color: #ffffff; border-radius: 8px;">
                    
                    <tr>
                        <td style="background-color: #059669; padding: 24px 20px; text-align: center; border-radius: 8px 8px 0 0;">
                            <h1 style="margin: 0; color: #ffffff; font-size: 22px; font-weight: 600;">Shift Filled Successfully</h1>
                        </td>
                    </tr>

                    <tr>
                        <td style="padding: 32px 20px;">
                            
                            <p style="margin: 0 0 20px; color: #111827; font-size: 15px; line-height: 1.6;">
                                Great news! Your shift has been filled with a qualified pharmacist.
                            </p>

                            <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color: #f0fdf4; border-radius: 6px; margin-bottom: 24px;">
                                <tr>
                                    <td style="padding: 16px;">
                                        <p style="margin: 0 0 12px; color: #065f46; font-size: 14px; font-weight: 600;">Shift Details</p>
                                        
                                        <table width="100%" cellpadding="0" cellspacing="0" border="0">
                                            <tr>
                                                <td style="padding: 4px 0; color: #047857; font-size: 13px; width: 90px;">Date:</td>
                                                <td style="padding: 4px 0; color: #065f46; font-size: 13px; font-weight: 500;">${shiftData.shift_date}</td>
                                            </tr>
                                            <tr>
                                                <td style="padding: 4px 0; color: #047857; font-size: 13px;">Time:</td>
                                                <td style="padding: 4px 0; color: #065f46; font-size: 13px; font-weight: 500;">${shiftData.start_time} - ${shiftData.end_time}</td>
                                            </tr>
                                            <tr>
                                                <td style="padding: 4px 0; color: #047857; font-size: 13px;">Pharmacy:</td>
                                                <td style="padding: 4px 0; color: #065f46; font-size: 13px; font-weight: 500;">${shiftData.pharmacy_name}</td>
                                            </tr>
                                            <tr>
                                                <td style="padding: 4px 0; color: #047857; font-size: 13px;">Pharmacist:</td>
                                                <td style="padding: 4px 0; color: #065f46; font-size: 13px; font-weight: 500;">${shiftData.assigned_pharmacist}</td>
                                            </tr>
                                        </table>
                                    </td>
                                </tr>
                            </table>

                            <table width="100%" cellpadding="0" cellspacing="0" border="0">
                                <tr>
                                    <td align="center">
                                        <a href="${appUrl}/my-shifts" style="display: inline-block; background-color: #1e40af; color: #ffffff; text-decoration: none; padding: 12px 28px; border-radius: 6px; font-size: 14px; font-weight: 600;">
                                            View Shift Details
                                        </a>
                                    </td>
                                </tr>
                            </table>

                        </td>
                    </tr>

                    <tr>
                        <td style="background-color: #f9fafb; padding: 16px 20px; text-align: center; border-top: 1px solid #e5e7eb;">
                            <p style="margin: 0; color: #9ca3af; font-size: 12px;">© 2024 Pharmanet. All rights reserved.</p>
                        </td>
                    </tr>

                </table>
            </td>
        </tr>
    </table>
</body>
</html>
    `.trim();
}

function createShiftReminderEmail(shiftData, appUrl) {
    
    return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0;">
    <meta http-equiv="X-UA-Compatible" content="IE=edge">
</head>
<body style="margin: 0; padding: 0; background-color: #f5f5f5; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">
    <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color: #f5f5f5; padding: 20px 0;">
        <tr>
            <td align="center">
                <table width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width: 600px; background-color: #ffffff; border-radius: 8px;">
                    
                    <tr>
                        <td style="background-color: #d97706; padding: 24px 20px; text-align: center; border-radius: 8px 8px 0 0;">
                            <h1 style="margin: 0; color: #ffffff; font-size: 22px; font-weight: 600;">Shift Reminder</h1>
                            <p style="margin: 8px 0 0; color: rgba(255,255,255,0.9); font-size: 14px;">Your shift is tomorrow</p>
                        </td>
                    </tr>

                    <tr>
                        <td style="padding: 32px 20px;">
                            
                            <p style="margin: 0 0 20px; color: #111827; font-size: 15px; line-height: 1.6;">
                                This is a friendly reminder about your upcoming shift tomorrow.
                            </p>

                            <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color: #fef3c7; border-radius: 6px; margin-bottom: 20px;">
                                <tr>
                                    <td style="padding: 16px;">
                                        <p style="margin: 0 0 12px; color: #92400e; font-size: 14px; font-weight: 600;">Shift Details</p>
                                        
                                        <table width="100%" cellpadding="0" cellspacing="0" border="0">
                                            <tr>
                                                <td style="padding: 4px 0; color: #92400e; font-size: 13px; width: 80px;">Date:</td>
                                                <td style="padding: 4px 0; color: #92400e; font-size: 13px; font-weight: 500;">${shiftData.shift_date}</td>
                                            </tr>
                                            <tr>
                                                <td style="padding: 4px 0; color: #92400e; font-size: 13px;">Time:</td>
                                                <td style="padding: 4px 0; color: #92400e; font-size: 13px; font-weight: 500;">${shiftData.start_time} - ${shiftData.end_time}</td>
                                            </tr>
                                            <tr>
                                                <td style="padding: 4px 0; color: #92400e; font-size: 13px;">Pharmacy:</td>
                                                <td style="padding: 4px 0; color: #92400e; font-size: 13px; font-weight: 500;">${shiftData.pharmacy_name}</td>
                                            </tr>
                                            <tr>
                                                <td style="padding: 4px 0; color: #92400e; font-size: 13px;">Address:</td>
                                                <td style="padding: 4px 0; color: #92400e; font-size: 13px; font-weight: 500;">${shiftData.pharmacy_address}</td>
                                            </tr>
                                        </table>
                                    </td>
                                </tr>
                            </table>

                            <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color: #eff6ff; border-radius: 6px; margin-bottom: 24px;">
                                <tr>
                                    <td style="padding: 16px;">
                                        <p style="margin: 0 0 8px; color: #1e40af; font-size: 13px; font-weight: 600;">Preparation Checklist:</p>
                                        <p style="margin: 0; color: #1e40af; font-size: 13px; line-height: 1.6;">
                                            • Review pharmacy software (${shiftData.pharmacy_software})<br>
                                            • Plan your commute<br>
                                            • Prepare necessary documents<br>
                                            • Get a good night's sleep
                                        </p>
                                    </td>
                                </tr>
                            </table>

                            <table width="100%" cellpadding="0" cellspacing="0" border="0">
                                <tr>
                                    <td align="center">
                                        <a href="${appUrl}/my-schedule" style="display: inline-block; background-color: #1e40af; color: #ffffff; text-decoration: none; padding: 12px 28px; border-radius: 6px; font-size: 14px; font-weight: 600;">
                                            View Full Details
                                        </a>
                                    </td>
                                </tr>
                            </table>

                        </td>
                    </tr>

                    <tr>
                        <td style="background-color: #f9fafb; padding: 16px 20px; text-align: center; border-top: 1px solid #e5e7eb;">
                            <p style="margin: 0; color: #9ca3af; font-size: 12px;">© 2024 Pharmanet. All rights reserved.</p>
                        </td>
                    </tr>

                </table>
            </td>
        </tr>
    </table>
</body>
</html>
    `.trim();
}
