import { createClientFromRequest } from 'npm:@base44/sdk@0.7.1';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    
    // Verify admin or service role
    const user = await base44.auth.me();
    if (!user && !req.headers.get('x-service-role')) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const {
      user_id,
      user_email,
      title,
      message,
      type = 'general',
      priority = 'medium',
      action_url,
      action_text,
      icon = 'bell',
      metadata = {},
      send_push = true,
      send_email = false
    } = body;

    if (!user_id || !user_email || !title || !message) {
      return Response.json({ 
        error: 'Missing required fields: user_id, user_email, title, message' 
      }, { status: 400 });
    }

    console.log('📬 [Notification] Sending to:', user_email);

    // 1. Create in-app notification
    const notification = await base44.asServiceRole.entities.Notification.create({
      user_id,
      user_email,
      title,
      message,
      type,
      priority,
      action_url,
      action_text,
      icon,
      metadata,
      is_read: false,
      push_sent: false
    });

    console.log('✅ [Notification] In-app notification created:', notification.id);

    let pushResult = null;
    let emailResult = null;

    // 2. Send push notification if enabled
    if (send_push) {
      try {
        const pushResponse = await base44.asServiceRole.functions.invoke('sendPushNotification', {
          user_email,
          title,
          body: message,
          icon: '/icon-192.png',
          badge: '/icon-192.png',
          data: {
            url: action_url || '/',
            notification_id: notification.id,
            type,
            ...metadata
          }
        });

        pushResult = pushResponse.data;

        // Mark push as sent
        await base44.asServiceRole.entities.Notification.update(notification.id, {
          push_sent: true,
          push_sent_at: new Date().toISOString()
        });

        console.log('✅ [Notification] Push sent:', pushResult);
      } catch (pushError) {
        console.error('⚠️ [Notification] Push failed:', pushError.message);
        pushResult = { success: false, error: pushError.message };
      }
    }

    // 3. Send email notification if enabled
    if (send_email) {
      try {
        const emailResponse = await base44.asServiceRole.integrations.Core.SendEmail({
          to: user_email,
          subject: title,
          body: `
            <h2>${title}</h2>
            <p>${message}</p>
            ${action_url ? `<p><a href="${action_url}" style="display: inline-block; padding: 12px 24px; background: #14b8a6; color: white; text-decoration: none; border-radius: 8px; margin-top: 16px;">${action_text || 'View Details'}</a></p>` : ''}
            <hr style="margin: 24px 0; border: none; border-top: 1px solid #e5e7eb;">
            <p style="color: #6b7280; font-size: 14px;">This is an automated notification from Pharmanet</p>
          `,
          from_name: 'Pharmanet Notifications'
        });

        emailResult = { success: true };
        console.log('✅ [Notification] Email sent');
      } catch (emailError) {
        console.error('⚠️ [Notification] Email failed:', emailError.message);
        emailResult = { success: false, error: emailError.message };
      }
    }

    return Response.json({
      success: true,
      notification,
      push: pushResult,
      email: emailResult
    });

  } catch (error) {
    console.error('❌ [Notification] Error:', error);
    return Response.json({ 
      error: error.message,
      success: false 
    }, { status: 500 });
  }
});