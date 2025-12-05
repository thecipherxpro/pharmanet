// Policy content for onboarding agreement step

export const PRICING_POLICY = {
  title: "Pharmanet Pricing Model Policy",
  effectiveDate: "December 2024",
  version: "1.0",
  content: `
    <h2>Overview</h2>
    <p>This Pricing Model Policy explains how Pharmanet calculates hourly compensation for Pharmacists and shift costs for Employers using a transparent, algorithm-driven <strong>Dynamic Pricing System</strong>. The model rewards advance planning, compensates flexibility, and ensures fairness across the platform.</p>
    <p>Pharmanet's pricing structure is fully automated and applied uniformly across all shifts. Once a shift is posted, its rate is locked and cannot be changed.</p>

    <h2>1. PRICING FRAMEWORK</h2>
    <p>Pharmanet uses a <strong>7-tier urgency-based pricing system</strong>. The earlier a shift is posted, the lower the hourly rate. The closer to the shift start time, the higher the rate.</p>

    <h3>1.1 Core Principles</h3>
    <ul>
      <li><strong>Fairness</strong> — Rates reflect market urgency, not random or negotiable numbers.</li>
      <li><strong>Transparency</strong> — Employers see exact shift cost before posting.</li>
      <li><strong>Flexibility Premium</strong> — Pharmacists earn more on short-notice shifts.</li>
      <li><strong>Planning Rewards</strong> — Employers save substantially by posting earlier.</li>
      <li><strong>Locked Rates</strong> — Once posted, a rate cannot change.</li>
    </ul>

    <h2>2. URGENCY-BASED TIER SYSTEM</h2>
    <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
      <thead>
        <tr style="background: #f3f4f6;">
          <th style="padding: 12px; text-align: left; border: 1px solid #e5e7eb;">Days Ahead</th>
          <th style="padding: 12px; text-align: left; border: 1px solid #e5e7eb;">Urgency Tier</th>
          <th style="padding: 12px; text-align: left; border: 1px solid #e5e7eb;">Hourly Rate</th>
          <th style="padding: 12px; text-align: left; border: 1px solid #e5e7eb;">Example 8hr Shift</th>
        </tr>
      </thead>
      <tbody>
        <tr><td style="padding: 10px; border: 1px solid #e5e7eb;">0 days</td><td style="padding: 10px; border: 1px solid #e5e7eb;">Emergency</td><td style="padding: 10px; border: 1px solid #e5e7eb;"><strong>$90/hr</strong></td><td style="padding: 10px; border: 1px solid #e5e7eb;">$720</td></tr>
        <tr><td style="padding: 10px; border: 1px solid #e5e7eb;">1 day</td><td style="padding: 10px; border: 1px solid #e5e7eb;">Very Urgent</td><td style="padding: 10px; border: 1px solid #e5e7eb;"><strong>$65/hr</strong></td><td style="padding: 10px; border: 1px solid #e5e7eb;">$520</td></tr>
        <tr><td style="padding: 10px; border: 1px solid #e5e7eb;">2 days</td><td style="padding: 10px; border: 1px solid #e5e7eb;">Urgent</td><td style="padding: 10px; border: 1px solid #e5e7eb;"><strong>$60/hr</strong></td><td style="padding: 10px; border: 1px solid #e5e7eb;">$480</td></tr>
        <tr><td style="padding: 10px; border: 1px solid #e5e7eb;">3–4 days</td><td style="padding: 10px; border: 1px solid #e5e7eb;">Short Notice</td><td style="padding: 10px; border: 1px solid #e5e7eb;"><strong>$59–$60/hr</strong></td><td style="padding: 10px; border: 1px solid #e5e7eb;">$472–$480</td></tr>
        <tr><td style="padding: 10px; border: 1px solid #e5e7eb;">5–10 days</td><td style="padding: 10px; border: 1px solid #e5e7eb;">Moderate</td><td style="padding: 10px; border: 1px solid #e5e7eb;"><strong>$56–$59/hr</strong></td><td style="padding: 10px; border: 1px solid #e5e7eb;">$448–$472</td></tr>
        <tr><td style="padding: 10px; border: 1px solid #e5e7eb;">11–14 days</td><td style="padding: 10px; border: 1px solid #e5e7eb;">Reasonable</td><td style="padding: 10px; border: 1px solid #e5e7eb;"><strong>$53–$55/hr</strong></td><td style="padding: 10px; border: 1px solid #e5e7eb;">$424–$440</td></tr>
        <tr><td style="padding: 10px; border: 1px solid #e5e7eb;">15+ days</td><td style="padding: 10px; border: 1px solid #e5e7eb;">Planned</td><td style="padding: 10px; border: 1px solid #e5e7eb;"><strong>$50/hr</strong></td><td style="padding: 10px; border: 1px solid #e5e7eb;">$400</td></tr>
      </tbody>
    </table>

    <h2>3. BENEFITS OF THE DYNAMIC PRICING MODEL</h2>
    
    <h3>For Employers</h3>
    <ul>
      <li><strong>Cost Savings</strong> — Posting early saves up to 44%</li>
      <li><strong>Budget Predictability</strong> — Always know exact cost before posting</li>
      <li><strong>Better Talent</strong> — Early shifts attract higher-rated Pharmacists</li>
      <li><strong>Operational Reliability</strong> — More applicants = lower risk of unfilled shifts</li>
    </ul>

    <h3>For Pharmacists</h3>
    <ul>
      <li><strong>Premium Pay for Flexibility</strong> — Short-notice shifts pay up to $90/hr</li>
      <li><strong>Full Transparency</strong> — The posted rate is always your take-home pay</li>
      <li><strong>Income Optimization</strong> — Choose between high-flexibility premiums or stable planned schedules</li>
      <li><strong>Fair Market Compensation</strong> — No agency cuts, 100% of rate goes to you</li>
    </ul>

    <h2>4. POLICY RULES & COMPLIANCE</h2>
    <ul>
      <li>Rates are <strong>non-negotiable</strong> once posted</li>
      <li>All parties must adhere to calculated pricing</li>
      <li>Any attempt to bypass pricing may result in account restriction</li>
      <li>Pharmanet reserves the right to update rates with 30 days notice</li>
    </ul>

    <h2>Contact Information</h2>
    <p><strong>Pricing Policy Questions:</strong> pricing@pharmanet.ca<br>
    <strong>Support:</strong> support@pharmanet.ca</p>

    <h2>Acknowledgment</h2>
    <p>By posting or accepting shifts, users agree to abide by this Pricing Model Policy.</p>
    <p style="margin-top: 20px; color: #6b7280; font-size: 0.875rem;">© 2024 Pharmanet. All Rights Reserved.</p>
  `
};

export const CANCELLATION_POLICY = {
  title: "Pharmanet Cancellation Policy",
  effectiveDate: "December 2024",
  version: "1.0",
  content: `
    <h2>Overview</h2>
    <p>This Cancellation Policy governs how Pharmacists and Employers may cancel accepted shifts on the Pharmanet platform. By accepting a shift, both parties enter a professional commitment. This policy ensures:</p>
    <ul>
      <li>Fair compensation when cancellations occur</li>
      <li>Protection of operational integrity for pharmacies</li>
      <li>Transparent, predictable penalties</li>
      <li>Accountability and platform quality</li>
    </ul>

    <h2>1. PHARMACIST CANCELLATION POLICY</h2>
    <p>When a Pharmacist cancels an accepted shift, penalties apply based on notice provided.</p>

    <h3>1.1 Penalty Structure</h3>
    <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
      <thead>
        <tr style="background: #f3f4f6;">
          <th style="padding: 12px; text-align: left; border: 1px solid #e5e7eb;">Notice Period</th>
          <th style="padding: 12px; text-align: left; border: 1px solid #e5e7eb;">Penalty</th>
          <th style="padding: 12px; text-align: left; border: 1px solid #e5e7eb;">Employer Credit</th>
          <th style="padding: 12px; text-align: left; border: 1px solid #e5e7eb;">Platform Fee</th>
        </tr>
      </thead>
      <tbody>
        <tr><td style="padding: 10px; border: 1px solid #e5e7eb;">5+ days (120+ hours)</td><td style="padding: 10px; border: 1px solid #e5e7eb;">$0</td><td style="padding: 10px; border: 1px solid #e5e7eb;">$0</td><td style="padding: 10px; border: 1px solid #e5e7eb;">$0</td></tr>
        <tr><td style="padding: 10px; border: 1px solid #e5e7eb;">3–5 days (72–119 hours)</td><td style="padding: 10px; border: 1px solid #e5e7eb;">$50</td><td style="padding: 10px; border: 1px solid #e5e7eb;">$0</td><td style="padding: 10px; border: 1px solid #e5e7eb;">$50</td></tr>
        <tr><td style="padding: 10px; border: 1px solid #e5e7eb;">2–3 days (48–71 hours)</td><td style="padding: 10px; border: 1px solid #e5e7eb;">$100</td><td style="padding: 10px; border: 1px solid #e5e7eb;">$50</td><td style="padding: 10px; border: 1px solid #e5e7eb;">$50</td></tr>
        <tr><td style="padding: 10px; border: 1px solid #e5e7eb;">1–2 days (24–47 hours)</td><td style="padding: 10px; border: 1px solid #e5e7eb;">$150</td><td style="padding: 10px; border: 1px solid #e5e7eb;">$80</td><td style="padding: 10px; border: 1px solid #e5e7eb;">$70</td></tr>
        <tr><td style="padding: 10px; border: 1px solid #e5e7eb;">&lt;24 hours (0–23 hours)</td><td style="padding: 10px; border: 1px solid #e5e7eb;"><strong>$300</strong></td><td style="padding: 10px; border: 1px solid #e5e7eb;">$200</td><td style="padding: 10px; border: 1px solid #e5e7eb;">$100</td></tr>
      </tbody>
    </table>

    <h3>1.2 Key Terms</h3>
    <p><strong>Five or More Days Notice (120+ hours):</strong> No penalty, no impact on profile.</p>
    <p><strong>Three to Five Days Notice:</strong> $50 penalty, minor profile notation.</p>
    <p><strong>Two to Three Days Notice:</strong> $100 penalty, moderate profile notation.</p>
    <p><strong>One to Two Days Notice:</strong> $150 penalty, significant profile notation + warning.</p>
    <p><strong>Less Than 24 Hours:</strong> $300 penalty, severe profile notation. Account may be flagged for review or suspended.</p>

    <h2>2. EMPLOYER CANCELLATION POLICY</h2>
    <p>When an Employer cancels an accepted shift, penalties apply based on the proportion of shift pay.</p>

    <h3>2.1 Penalty Structure</h3>
    <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
      <thead>
        <tr style="background: #f3f4f6;">
          <th style="padding: 12px; text-align: left; border: 1px solid #e5e7eb;">Notice Period</th>
          <th style="padding: 12px; text-align: left; border: 1px solid #e5e7eb;">Penalty Rate</th>
          <th style="padding: 12px; text-align: left; border: 1px solid #e5e7eb;">Pharmacist Compensation</th>
        </tr>
      </thead>
      <tbody>
        <tr><td style="padding: 10px; border: 1px solid #e5e7eb;">7+ days (168+ hours)</td><td style="padding: 10px; border: 1px solid #e5e7eb;">0%</td><td style="padding: 10px; border: 1px solid #e5e7eb;">$0</td></tr>
        <tr><td style="padding: 10px; border: 1px solid #e5e7eb;">4–7 days (96–167 hours)</td><td style="padding: 10px; border: 1px solid #e5e7eb;">25%</td><td style="padding: 10px; border: 1px solid #e5e7eb;">100% of penalty</td></tr>
        <tr><td style="padding: 10px; border: 1px solid #e5e7eb;">2–4 days (48–95 hours)</td><td style="padding: 10px; border: 1px solid #e5e7eb;">50%</td><td style="padding: 10px; border: 1px solid #e5e7eb;">100% of penalty</td></tr>
        <tr><td style="padding: 10px; border: 1px solid #e5e7eb;">1–2 days (24–47 hours)</td><td style="padding: 10px; border: 1px solid #e5e7eb;">75%</td><td style="padding: 10px; border: 1px solid #e5e7eb;">100% of penalty</td></tr>
        <tr><td style="padding: 10px; border: 1px solid #e5e7eb;">&lt;24 hours (0–23 hours)</td><td style="padding: 10px; border: 1px solid #e5e7eb;"><strong>100% + $100</strong></td><td style="padding: 10px; border: 1px solid #e5e7eb;">Full shift pay + $100 retained</td></tr>
      </tbody>
    </table>

    <h2>3. EMERGENCY WAIVER PROCESS</h2>
    <h3>3.1 Eligible Circumstances</h3>
    <ul>
      <li>Medical emergencies or hospitalization</li>
      <li>Family emergencies</li>
      <li>Natural disasters / fires / flooding</li>
      <li>COVID-19 or contagious illness</li>
      <li>Unavoidable transportation failure</li>
    </ul>

    <h3>3.2 Waiver Request Procedure</h3>
    <ol>
      <li>Submit waiver via dashboard within 48 hours</li>
      <li>Provide documentation (medical notes, certificates, reports)</li>
      <li>Admin review within 24–48 hours</li>
      <li>Decision communicated by email/platform</li>
      <li>Approved refunds processed within 5–7 days</li>
    </ol>

    <h2>4. REPUTATION & ACCOUNT STANDING</h2>
    <p>Cancellations are tracked and affect your profile reputation:</p>
    <ul>
      <li><strong>Excellent (&lt;2%)</strong> — Highly Reliable ⭐</li>
      <li><strong>Good (2–5%)</strong> — Standard profile</li>
      <li><strong>Fair (5–10%)</strong> — Occasional Cancellations</li>
      <li><strong>Poor (10–15%)</strong> — Frequent Cancellations (warning)</li>
      <li><strong>&gt;15%</strong> — Account review/suspension</li>
    </ul>

    <h2>5. PAYMENT REQUIREMENTS</h2>
    <ul>
      <li>Valid payment method required before accepting shifts</li>
      <li>Penalties charged automatically upon cancellation</li>
      <li>Cancellation cannot proceed if payment fails</li>
    </ul>

    <h2>Contact Information</h2>
    <p><strong>Policy Questions:</strong> policy@pharmanet.ca<br>
    <strong>Disputes:</strong> disputes@pharmanet.ca<br>
    <strong>Emergencies:</strong> emergency@pharmanet.ca (24/7)<br>
    <strong>Support:</strong> support@pharmanet.ca</p>

    <h2>Acknowledgment</h2>
    <p>By using Pharmanet, users agree to this Cancellation Policy as part of the Terms of Service.</p>
  `
};

export const PRIVACY_POLICY = {
  title: "Consent to Communicate & Privacy Policy",
  effectiveDate: "December 2024",
  version: "1.0",
  content: `
    <h2>Overview</h2>
    <p>This Consent to Communicate & Privacy Policy explains how Pharmanet collects, uses, and protects your personal information, and how we communicate with you via email and other channels.</p>

    <h2>1. CONSENT TO COMMUNICATE</h2>
    <p>By agreeing to this policy, you consent to receive communications from Pharmanet via:</p>
    <ul>
      <li><strong>Email</strong> — Shift notifications, application updates, account alerts, promotional offers</li>
      <li><strong>In-App Notifications</strong> — Real-time updates about shifts, applications, and messages</li>
      <li><strong>SMS (optional)</strong> — Urgent shift notifications and reminders</li>
    </ul>

    <h3>1.1 Types of Communications</h3>
    <p><strong>Transactional Emails (Cannot Opt-Out):</strong></p>
    <ul>
      <li>Shift confirmations and updates</li>
      <li>Application status notifications</li>
      <li>Payment receipts and invoices</li>
      <li>Account security alerts</li>
      <li>Policy updates and legal notices</li>
    </ul>

    <p><strong>Marketing Emails (Can Opt-Out):</strong></p>
    <ul>
      <li>New feature announcements</li>
      <li>Platform updates and improvements</li>
      <li>Tips and best practices</li>
      <li>Promotional offers and incentives</li>
    </ul>

    <h3>1.2 Communication Preferences</h3>
    <p>You can manage your email preferences in your account settings. You may opt-out of marketing emails but will continue to receive essential transactional communications.</p>

    <h2>2. INFORMATION WE COLLECT</h2>
    
    <h3>2.1 Personal Information</h3>
    <ul>
      <li><strong>Account Information:</strong> Name, email, phone number, profile photo</li>
      <li><strong>Professional Information:</strong> License number, years of experience, certifications, bio</li>
      <li><strong>Payment Information:</strong> Credit card details (via Stripe), banking information for payroll</li>
      <li><strong>Location Data:</strong> Preferred work regions, pharmacy addresses</li>
    </ul>

    <h3>2.2 Automatically Collected Information</h3>
    <ul>
      <li>IP address and device information</li>
      <li>Browser type and operating system</li>
      <li>Usage data (pages viewed, features used, time spent)</li>
      <li>Cookies and tracking technologies</li>
    </ul>

    <h2>3. HOW WE USE YOUR INFORMATION</h2>
    <ul>
      <li><strong>Platform Operations:</strong> Match pharmacists with shifts, process applications, facilitate payments</li>
      <li><strong>Communication:</strong> Send shift notifications, application updates, and account alerts</li>
      <li><strong>Security:</strong> Verify identity, prevent fraud, ensure platform integrity</li>
      <li><strong>Improvement:</strong> Analyze usage patterns, improve user experience, develop new features</li>
      <li><strong>Compliance:</strong> Meet legal and regulatory requirements</li>
    </ul>

    <h2>4. INFORMATION SHARING</h2>
    
    <h3>4.1 Who We Share With</h3>
    <ul>
      <li><strong>Between Users:</strong> Employers see pharmacist profiles when reviewing applications. Pharmacists see pharmacy details when browsing shifts.</li>
      <li><strong>Service Providers:</strong> Stripe (payment processing), email service providers, hosting services</li>
      <li><strong>Legal Authorities:</strong> When required by law or to protect rights and safety</li>
    </ul>

    <h3>4.2 What We DON'T Share</h3>
    <ul>
      <li>We never sell your personal information to third parties</li>
      <li>Payroll and banking details are encrypted and kept confidential</li>
      <li>License verification data is kept secure and private</li>
    </ul>

    <h2>5. DATA SECURITY</h2>
    <p>We implement industry-standard security measures to protect your information:</p>
    <ul>
      <li>SSL/TLS encryption for data transmission</li>
      <li>Encrypted storage of sensitive data</li>
      <li>Regular security audits and updates</li>
      <li>Access controls and authentication</li>
      <li>Secure payment processing via Stripe (PCI-DSS compliant)</li>
    </ul>

    <h2>6. YOUR RIGHTS</h2>
    <p>You have the right to:</p>
    <ul>
      <li><strong>Access:</strong> Request a copy of your personal data</li>
      <li><strong>Correction:</strong> Update or correct inaccurate information</li>
      <li><strong>Deletion:</strong> Request deletion of your account and data (subject to legal requirements)</li>
      <li><strong>Portability:</strong> Receive your data in a structured, machine-readable format</li>
      <li><strong>Opt-Out:</strong> Unsubscribe from marketing emails (transactional emails will continue)</li>
    </ul>

    <h2>7. DATA RETENTION</h2>
    <ul>
      <li>Active account data: Retained while your account is active</li>
      <li>Shift records: Retained for 7 years for legal and tax purposes</li>
      <li>Payment records: Retained as required by financial regulations</li>
      <li>After account deletion: Personal data removed within 30 days (except legal/tax records)</li>
    </ul>

    <h2>8. COOKIES & TRACKING</h2>
    <p>We use cookies to:</p>
    <ul>
      <li>Keep you logged in</li>
      <li>Remember your preferences</li>
      <li>Analyze platform usage</li>
      <li>Improve performance and user experience</li>
    </ul>
    <p>You can disable cookies in your browser settings, but some features may not function properly.</p>

    <h2>9. THIRD-PARTY SERVICES</h2>
    <p>Pharmanet integrates with third-party services:</p>
    <ul>
      <li><strong>Stripe:</strong> Payment processing (subject to Stripe's privacy policy)</li>
      <li><strong>Email Providers:</strong> Transactional and marketing emails</li>
      <li><strong>Analytics:</strong> Usage tracking and platform improvements</li>
    </ul>

    <h2>10. UPDATES TO THIS POLICY</h2>
    <p>We may update this policy from time to time. Changes will be communicated via:</p>
    <ul>
      <li>Email notification</li>
      <li>In-app notification</li>
      <li>Platform announcement</li>
    </ul>
    <p>Continued use of Pharmanet after changes constitutes acceptance of the updated policy.</p>

    <h2>Contact Information</h2>
    <p><strong>Privacy Questions:</strong> privacy@pharmanet.ca<br>
    <strong>Data Requests:</strong> data@pharmanet.ca<br>
    <strong>General Support:</strong> support@pharmanet.ca</p>

    <h2>Acknowledgment</h2>
    <p>By agreeing to this policy, you acknowledge that you have read, understood, and agree to the collection, use, and disclosure of your information as described above.</p>
    <p style="margin-top: 20px; color: #6b7280; font-size: 0.875rem;">© 2024 Pharmanet. All Rights Reserved.</p>
  `
};