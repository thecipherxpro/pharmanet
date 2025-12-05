import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        
        // Verify user is authenticated
        const user = await base44.auth.me();
        if (!user) {
            return Response.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { user_type } = await req.json();

        // Get user details
        const userName = user.full_name || 'there';
        const userEmail = user.email;
        const userType = user_type || user.user_type || 'pharmacist';

        // Create personalized welcome email based on user type
        const emailSubject = userType === 'employer' 
            ? 'Welcome to Pharmanet - Your Pharmacy Staffing Solution'
            : 'Welcome to Pharmanet - Start Finding Shifts Today';

        const emailBody = createWelcomeEmailTemplate(userName, userType);

        // Send welcome email using Brevo
        await base44.asServiceRole.functions.invoke('sendBrevoEmail', {
            to: userEmail,
            subject: emailSubject,
            html_body: emailBody
        });

        return Response.json({ 
            success: true, 
            message: 'Welcome email sent successfully' 
        });

    } catch (error) {
        console.error('Error sending welcome email:', error);
        return Response.json({ 
            error: error.message || 'Failed to send welcome email' 
        }, { status: 500 });
    }
});

function createWelcomeEmailTemplate(userName, userType) {
    const isEmployer = userType === 'employer';
    const appUrl = 'https://pharmanet.ca';
    const logoUrl = 'https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/68fc5eaf1b32d1359be8744a/86aaf53ec_6852a121a_android-launchericon-512-512.png';
    
    return `
<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<meta http-equiv="X-UA-Compatible" content="IE=edge">
<title>Welcome to Pharmanet</title>
<link href="https://fonts.googleapis.com/css2?family=Roboto+Condensed:wght@300;400;600;700&display=swap" rel="stylesheet">
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { margin: 0; padding: 0; font-family: 'Roboto Condensed', Arial, sans-serif; background-color: #f5f5f5; -webkit-font-smoothing: antialiased; -moz-osx-font-smoothing: grayscale; }
  table { border-collapse: collapse; width: 100%; }
  img { border: 0; display: block; outline: none; text-decoration: none; }
  
  .email-wrapper { width: 100%; background-color: #f5f5f5; padding: 16px 0; }
  .email-container { max-width: 600px; width: 100%; margin: 0 auto; background: #ffffff; border: 1px solid #e0e0e0; }
  
  .email-header { background: #d3f3fbff; padding: 16px 24px; }
  .email-header-content { display: flex; justify-content: space-between; align-items: center; width: 100%; }
  .email-header-text { text-align: left; }
  .email-header-title { font-family: 'Roboto Condensed', Arial, sans-serif; font-size: 20px; font-weight: 700; color: #010101ff; letter-spacing: 0.5px; margin: 0; }
  .email-header-logo { text-align: right; }
  .email-header-logo-img { width: 40px; height: 40px; }
  
  .email-body { padding: 28px 24px; background: #ffffff; }
  .text-block { font-family: 'Roboto Condensed', Arial, sans-serif; color: #333333; font-size: 14px; line-height: 1.6; margin: 14px 0; }
  .text-block p { margin: 12px 0; }
  .text-block h1, .text-block h2, .text-block h3 { font-family: 'Roboto Condensed', Arial, sans-serif; color: #1a1a1a; margin: 18px 0 10px; }
  
  .button-wrapper { text-align: center; margin: 20px 0; }
  .button { display: inline-block; font-family: 'Roboto Condensed', Arial, sans-serif; background: #1a1a1a; color: #ffffff !important; padding: 11px 28px; text-decoration: none; font-weight: 600; font-size: 12px; letter-spacing: 0.8px; text-transform: uppercase; border: 2px solid #1a1a1a; transition: all 0.3s; }
  
  .email-footer { background: #E8EEF2; padding: 32px 24px 24px; text-align: center; color: #333333; }
  .footer-brand { font-family: 'Roboto Condensed', Arial, sans-serif; font-size: 18px; font-weight: 700; color: #333333; letter-spacing: 0.5px; margin-bottom: 8px; text-transform: uppercase; }
  .footer-text { font-family: 'Roboto Condensed', Arial, sans-serif; color: #666666; font-size: 13px; line-height: 1.3; margin: 5px 0; }
  .footer-contact { font-family: 'Roboto Condensed', Arial, sans-serif; font-size: 13px; color: #333333; margin: 12px 0; }
  .footer-label { font-weight: 600; color: #333333; }
  .footer-link { color: #4A90B8; text-decoration: none; }
  
  @media only screen and (max-width: 600px) {
    .email-wrapper { padding: 8px 0 !important; }
    .email-header { padding: 12px 16px !important; }
    .email-body { padding: 20px 16px !important; }
    .button { padding: 10px 22px !important; font-size: 11px !important; }
  }
</style>
</head>
<body>
  <table role="presentation" class="email-wrapper" cellpadding="0" cellspacing="0">
    <tr>
      <td align="center">
        <table role="presentation" class="email-container" cellpadding="0" cellspacing="0">
          <!-- Header -->
          <tr>
            <td class="email-header">
              <div class="email-header-content">
                <div class="email-header-text">
                  <h1 class="email-header-title">Pharmanet</h1>
                </div>
                <div class="email-header-logo">
                  <img src="${logoUrl}" alt="Pharmanet Logo" class="email-header-logo-img">
                </div>
              </div>
            </td>
          </tr>
          
          <!-- Body -->
          <tr>
            <td class="email-body">

              <div class="text-block">
                <h2 style="font-size: 22px;">Welcome, ${userName}! 🎉</h2>
                <p>Thank you for joining <strong>Pharmanet</strong> — ${isEmployer ? 'Ontario\'s premier pharmacy staffing platform' : 'your gateway to flexible pharmacy work across Ontario'}.</p>
                <p>${isEmployer 
                  ? 'Your employer account is now active. You can start posting shifts, managing applications, and connecting with qualified pharmacists right away.'
                  : 'Your pharmacist account is ready! Browse available shifts, apply to positions, and start earning competitive rates.'
                }</p>
              </div>

              <div style="background: #f0fdf4; border-left: 4px solid #10b981; padding: 16px; border-radius: 6px; margin: 20px 0;">
                <p style="margin: 0; color: #065f46; font-size: 14px; line-height: 1.5;">
                  <strong style="display: block; margin-bottom: 4px;">✓ Account Confirmed</strong>
                  Your ${isEmployer ? 'employer' : 'pharmacist'} account is now active and ready to use.
                </p>
              </div>

              <div class="text-block">
                <h3 style="font-size: 18px;">Getting Started</h3>

                ${isEmployer ? `
                <p><strong>1. Complete Your Profile</strong><br>Add your company details and pharmacy information</p>
                <p><strong>2. Add Your Pharmacies</strong><br>Register all pharmacy locations you manage</p>
                <p><strong>3. Post Your First Shift</strong><br>Create a shift and start receiving applications</p>
                ` : `
                <p><strong>1. Complete Your Profile</strong><br>Add your license, experience, and preferences</p>
                <p><strong>2. Browse Available Shifts</strong><br>Find shifts that match your schedule and location</p>
                <p><strong>3. Apply & Get Hired</strong><br>Submit applications and start working</p>
                `}
              </div>

              <div class="text-block">
                <h3 style="font-size: 18px;">${isEmployer ? 'Platform Features' : 'Why Pharmacists Choose Us'}</h3>
                ${isEmployer ? `
                <p><strong>•</strong> Post multiple shifts up to 30 days in advance</p>
                <p><strong>•</strong> Dynamic pricing based on shift urgency</p>
                <p><strong>•</strong> Access to verified Ontario-licensed pharmacists</p>
                <p><strong>•</strong> Streamlined application management</p>
                ` : `
                <p><strong>•</strong> Earn $50-$90/hr based on shift urgency</p>
                <p><strong>•</strong> Flexible scheduling across the GTA</p>
                <p><strong>•</strong> Easy calendar management and tracking</p>
                <p><strong>•</strong> Direct deposit and e-transfer payment options</p>
                `}
              </div>

              <div class="button-wrapper">
                <a href="${appUrl}" class="button">${isEmployer ? 'Go to Dashboard' : 'Browse Shifts'}</a>
              </div>

              <div style="background: #f9fafb; border-radius: 6px; padding: 16px; margin-top: 24px;">
                <p style="margin: 0 0 8px; color: #111827; font-size: 14px; font-weight: 600;">Need Help?</p>
                <p style="margin: 0; color: #6b7280; font-size: 13px;">
                  Our support team is available Monday-Friday, 9 AM - 6 PM ET<br>
                  Email: <a href="mailto:support@pharmanet.ca" style="color: #4A90B8;">support@pharmanet.ca</a>
                </p>
              </div>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td class="email-footer">
              <div class="footer-brand">PHARMANET INC</div>
              <p class="footer-text">Connecting Pharmacies with Qualified Pharmacists</p>
              <p class="footer-contact">
                <span class="footer-label">Contact Us:</span> <a href="mailto:info@pharmanet.ca" class="footer-link">info@pharmanet.ca</a>
              </p>
              <p class="footer-contact">
                <span class="footer-label">Website:</span> <a href="${appUrl}" class="footer-link">Pharmanet.ca</a>
              </p>
              <p style="margin: 16px 0 8px; color: #666666; font-size: 12px;">© 2024 Pharmanet. All rights reserved.</p>
              <p style="margin: 8px 0 0; color: #666666; font-size: 12px;">
                Secured By: CipherX Solutions
              </p>
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