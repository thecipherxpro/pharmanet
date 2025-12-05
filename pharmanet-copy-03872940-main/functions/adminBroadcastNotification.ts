import { createClientFromRequest } from 'npm:@base44/sdk@0.7.1';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    
    // Authenticate and verify admin
    const user = await base44.auth.me();
    
    if (!user || (user.role !== 'admin' && user.user_type !== 'admin')) {
      return Response.json({ 
        error: 'Unauthorized - Admin only' 
      }, { status: 403 });
    }

    const body = await req.json();
    const {
      title,
      message,
      target_audience = 'all', // 'all', 'pharmacists', 'employers'
      type = 'system_announcement',
      priority = 'medium',
      icon = 'bell',
      action_url,
      action_text,
      send_email = false
    } = body;

    console.log('📢 [Broadcast] Admin:', user.email, '- Audience:', target_audience);

    // Get target users
    let targetUsers = [];
    
    if (target_audience === 'all') {
      targetUsers = await base44.asServiceRole.entities.User.list();
    } else if (target_audience === 'pharmacists') {
      targetUsers = await base44.asServiceRole.entities.User.filter({
        user_type: 'pharmacist'
      });
    } else if (target_audience === 'employers') {
      targetUsers = await base44.asServiceRole.entities.User.filter({
        user_type: 'employer'
      });
    }

    console.log(`👥 [Broadcast] Creating notifications for ${targetUsers.length} users`);

    // Create notifications for each target user using new email-based schema
    const notificationPromises = targetUsers.map(async (targetUser) => {
      if (!targetUser.email) return null;

      return await base44.asServiceRole.entities.Notification.create({
        from_email: user.email,
        from_name: user.full_name || 'Admin',
        to_email: targetUser.email,
        to_name: targetUser.full_name || targetUser.email,
        notification_type: type,
        title: title,
        message: message,
        priority: priority,
        icon: icon,
        action_url: action_url || null,
        action_text: action_text || null,
        is_read: false,
        related_entity_type: 'User'
      });
    });

    await Promise.all(notificationPromises);
    console.log('✅ [Broadcast] Notifications created in database');

    let emailResult = { success: false, sent: 0 };

    // Send emails if enabled
    if (send_email) {
      try {
        console.log('📧 [Broadcast] Sending emails...');
        
        let sentCount = 0;
        
        for (const targetUser of targetUsers) {
          if (!targetUser.email) continue;
          
          try {
            await base44.asServiceRole.integrations.Core.SendEmail({
              to: targetUser.email,
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
                      This is an automated notification from Pharmanet Admin Portal
                    </p>
                  </div>
                </div>
              `,
              from_name: 'Pharmanet Admin'
            });
            
            sentCount++;
          } catch (emailError) {
            console.error('❌ [Broadcast] Email failed for:', targetUser.email);
          }
        }
        
        emailResult = { success: true, sent: sentCount };
        console.log(`✅ [Broadcast] Emails sent to ${sentCount} users`);
      } catch (error) {
        console.error('❌ [Broadcast] Email error:', error);
        emailResult = { success: false, error: error.message };
      }
    }

    console.log('🎉 [Broadcast] Complete');

    return Response.json({
      success: true,
      message: `Broadcast sent to ${targetUsers.length} users`,
      target_audience,
      notifications_created: targetUsers.length,
      email: emailResult
    });

  } catch (error) {
    console.error('❌ [Broadcast] Error:', error);
    return Response.json({ 
      error: error.message 
    }, { status: 500 });
  }
});