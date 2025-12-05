import { createClientFromRequest } from 'npm:@base44/sdk@0.7.1';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    
    // Allow both authenticated users and service role
    let isServiceRole = false;
    let user = null;
    
    try {
      user = await base44.auth.me();
      console.log('👤 [Auth] User:', user?.email, '- Type:', user?.user_type);
    } catch (error) {
      // Check if this is a service role request
      const authHeader = req.headers.get('authorization');
      if (authHeader && authHeader.includes('service_role')) {
        isServiceRole = true;
        console.log('🔑 [Auth] Using service role');
      } else {
        return Response.json({ error: 'Unauthorized' }, { status: 401 });
      }
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

    console.log(`📬 [Notification] Creating for: ${user_email} (Type: ${type}, Priority: ${priority})`);

    // Get target user to check user_type for proper RLS
    const targetUsers = await base44.asServiceRole.entities.User.filter({ id: user_id });
    const targetUser = targetUsers[0];

    if (!targetUser) {
      console.error('❌ [Notification] User not found:', user_id);
      return Response.json({ error: 'User not found' }, { status: 404 });
    }

    console.log('👥 [Target User]:', targetUser.email, '- Type:', targetUser.user_type);

    // Validate user_type is set (required for RLS)
    if (!targetUser.user_type && targetUser.role !== 'admin') {
      console.warn('⚠️ [Notification] User has no user_type set:', targetUser.email);
      return Response.json({ 
        error: 'User must have user_type set (pharmacist/employer/admin)'
      }, { status: 400 });
    }

    // 1. Create in-app notification using service role
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
        console.log('📲 [Push] Attempting to send push notification...');
        
        // Check if user has push subscriptions
        if (!targetUser.push_subscriptions || targetUser.push_subscriptions.length === 0) {
          console.log('ℹ️ [Push] No push subscriptions for user:', user_email);
          pushResult = { success: false, error: 'No push subscriptions' };
        } else {
          // Import web-push
          const webpush = await import('npm:web-push@3.6.6');

          // Get VAPID keys
          const vapidPublicKey = Deno.env.get('VAPID_PUBLIC_KEY');
          const vapidPrivateKey = Deno.env.get('VAPID_PRIVATE_KEY');
          const vapidSubject = Deno.env.get('VAPID_SUBJECT');

          if (!vapidPublicKey || !vapidPrivateKey || !vapidSubject) {
            console.error('❌ [Push] VAPID keys not configured');
            pushResult = { success: false, error: 'VAPID keys not configured' };
          } else {
            // Configure web-push
            webpush.default.setVapidDetails(
              vapidSubject,
              vapidPublicKey,
              vapidPrivateKey
            );

            // Prepare payload with user_type info
            const notificationPayload = JSON.stringify({
              title: title,
              body: message,
              icon: 'https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/68fc5eaf1b32d1359be8744a/6852a121a_android-launchericon-512-512.png',
              badge: 'https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/68fc5eaf1b32d1359be8744a/6852a121a_android-launchericon-512-512.png',
              data: {
                url: action_url || '/',
                notification_id: notification.id,
                user_type: targetUser.user_type,
                type,
                ...metadata
              },
              tag: type,
              requireInteraction: priority === 'urgent',
              vibrate: priority === 'urgent' ? [200, 100, 200] : [100],
              silent: false
            });

            console.log(`📤 [Push] Sending to ${targetUser.push_subscriptions.length} subscription(s)`);

            // Send to all subscriptions
            const sendPromises = targetUser.push_subscriptions.map(async (subscription) => {
              try {
                await webpush.default.sendNotification(subscription, notificationPayload);
                console.log('✅ [Push] Sent to endpoint:', subscription.endpoint.substring(0, 50) + '...');
                return { success: true, endpoint: subscription.endpoint };
              } catch (error) {
                console.error('❌ [Push] Failed to send:', error.message);
                
                // Mark expired subscriptions
                if (error.statusCode === 410 || error.statusCode === 404) {
                  return { success: false, endpoint: subscription.endpoint, expired: true };
                }
                
                return { success: false, endpoint: subscription.endpoint, error: error.message };
              }
            });

            const results = await Promise.all(sendPromises);
            const successCount = results.filter(r => r.success).length;
            
            console.log(`✅ [Push] Sent to ${successCount} of ${results.length} subscriptions`);

            // Remove expired subscriptions
            const expiredEndpoints = results.filter(r => r.expired).map(r => r.endpoint);
            if (expiredEndpoints.length > 0) {
              const validSubscriptions = targetUser.push_subscriptions.filter(
                sub => !expiredEndpoints.includes(sub.endpoint)
              );
              await base44.asServiceRole.entities.User.update(user_id, {
                push_subscriptions: validSubscriptions
              });
              console.log(`🧹 [Push] Removed ${expiredEndpoints.length} expired subscriptions`);
            }

            pushResult = {
              success: successCount > 0,
              sent: successCount,
              total: results.length,
              results
            };

            // Mark push as sent
            if (successCount > 0) {
              await base44.asServiceRole.entities.Notification.update(notification.id, {
                push_sent: true,
                push_sent_at: new Date().toISOString()
              });
            }
          }
        }
      } catch (pushError) {
        console.error('⚠️ [Notification] Push failed:', pushError);
        pushResult = { success: false, error: pushError.message };
      }
    }

    // 3. Send email notification if enabled
    if (send_email) {
      try {
        console.log('📧 [Email] Sending email notification...');
        
        await base44.asServiceRole.integrations.Core.SendEmail({
          to: user_email,
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
                  This is an automated notification from Pharmanet ${targetUser.user_type === 'pharmacist' ? 'Pharmacist' : targetUser.user_type === 'employer' ? 'Employer' : 'Admin'} Portal
                </p>
              </div>
            </div>
          `,
          from_name: 'Pharmanet'
        });

        emailResult = { success: true };
        console.log('✅ [Email] Email sent successfully');
      } catch (emailError) {
        console.error('⚠️ [Notification] Email failed:', emailError);
        emailResult = { success: false, error: emailError.message };
      }
    }

    console.log(`🎉 [Notification] Complete - Push: ${pushResult?.success}, Email: ${emailResult?.success}`);

    return Response.json({
      success: true,
      notification,
      push: pushResult,
      email: emailResult,
      target_user_type: targetUser.user_type
    });

  } catch (error) {
    console.error('❌ [Notification] Error:', error);
    return Response.json({ 
      error: error.message,
      success: false 
    }, { status: 500 });
  }
});