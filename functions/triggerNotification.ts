import { createClientFromRequest } from 'npm:@base44/sdk@0.7.1';

/**
 * Trigger Notification Function
 * Creates in-app notifications for various events
 * 
 * Usage:
 * await base44.functions.invoke('triggerNotification', {
 *   from_email: 'sender@example.com',
 *   from_name: 'John Doe',
 *   to_email: 'recipient@example.com',
 *   to_name: 'Jane Smith',
 *   notification_type: 'review_received',
 *   title: 'New Review Received',
 *   message: 'You received a 5-star review!',
 *   priority: 'medium',
 *   icon: 'star',
 *   action_url: '/reviews',
 *   action_text: 'View Review',
 *   related_entity_type: 'Review',
 *   related_entity_id: 'review_id_here',
 *   send_email: false
 * });
 */

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    
    // Authenticate user
    const user = await base44.auth.me();
    
    if (!user) {
      return Response.json({ 
        error: 'Unauthorized' 
      }, { status: 401 });
    }

    const body = await req.json();
    const {
      from_email,
      from_name,
      to_email,
      to_name,
      notification_type,
      title,
      message,
      priority = 'medium',
      icon = 'bell',
      action_url = null,
      action_text = null,
      related_entity_type = null,
      related_entity_id = null,
      review_id = null,
      shift_id = null,
      application_id = null,
      invitation_id = null,
      payment_id = null,
      metadata = null,
      expires_at = null,
      send_email = false
    } = body;

    console.log('📬 [Trigger Notification]', {
      type: notification_type,
      from: from_email,
      to: to_email
    });

    // Validate required fields
    if (!from_email || !to_email || !notification_type || !title || !message) {
      return Response.json({ 
        error: 'Missing required fields: from_email, to_email, notification_type, title, message' 
      }, { status: 400 });
    }

    // Create the notification
    const notification = await base44.asServiceRole.entities.Notification.create({
      from_email,
      from_name: from_name || from_email,
      to_email,
      to_name: to_name || to_email,
      notification_type,
      title,
      message,
      priority,
      icon,
      action_url,
      action_text,
      related_entity_type,
      related_entity_id,
      review_id,
      shift_id,
      application_id,
      invitation_id,
      payment_id,
      metadata,
      expires_at,
      is_read: false
    });

    console.log('✅ [Trigger Notification] Created:', notification.id);

    // Send email if requested
    let emailSent = false;
    if (send_email && to_email) {
      try {
        await base44.asServiceRole.integrations.Core.SendEmail({
          to: to_email,
          subject: title,
          body: `
            <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto;">
              <div style="background: linear-gradient(135deg, #14b8a6, #0891b2); padding: 32px; text-align: center; border-radius: 12px 12px 0 0;">
                <h2 style="margin: 0; color: white; font-size: 24px;">${title}</h2>
              </div>
              <div style="background: white; padding: 32px; border-radius: 0 0 12px 12px; border: 1px solid #e5e7eb;">
                <p style="margin: 0 0 20px; color: #374151; font-size: 16px; line-height: 1.6;">${message}</p>
                ${action_url ? `
                  <div style="text-align: center; margin: 24px 0;">
                    <a href="${action_url}" style="display: inline-block; padding: 14px 32px; background: #14b8a6; color: white; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px;">
                      ${action_text || 'View Details'}
                    </a>
                  </div>
                ` : ''}
                <hr style="margin: 24px 0; border: none; border-top: 1px solid #e5e7eb;">
                <p style="color: #6b7280; font-size: 14px; margin: 0;">
                  This is an automated notification from Pharmanet
                </p>
              </div>
            </div>
          `,
          from_name: 'Pharmanet'
        });
        
        emailSent = true;
        console.log('📧 [Trigger Notification] Email sent to:', to_email);
      } catch (emailError) {
        console.error('❌ [Trigger Notification] Email failed:', emailError);
      }
    }

    return Response.json({
      success: true,
      notification_id: notification.id,
      email_sent: emailSent
    });

  } catch (error) {
    console.error('❌ [Trigger Notification] Error:', error);
    return Response.json({ 
      error: error.message 
    }, { status: 500 });
  }
});