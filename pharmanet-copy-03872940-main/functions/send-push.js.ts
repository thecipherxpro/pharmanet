import { createClientFromRequest } from 'npm:@base44/sdk@0.7.1';
import webpush from 'npm:web-push@3.6.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    
    // Authenticate user
    const user = await base44.auth.me();
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { title, message, target_role, user_id } = body;

    console.log('📤 [Send Push] Request:', { title, target_role, user_id });

    // Get VAPID keys from environment
    const vapidSubject = Deno.env.get('VAPID_SUBJECT');
    const vapidPublicKey = Deno.env.get('VAPID_PUBLIC_KEY');
    const vapidPrivateKey = Deno.env.get('VAPID_PRIVATE_KEY');

    if (!vapidSubject || !vapidPublicKey || !vapidPrivateKey) {
      console.error('❌ [Send Push] VAPID keys not configured');
      return Response.json({ 
        error: 'VAPID keys not configured' 
      }, { status: 500 });
    }

    // Configure web-push
    webpush.setVapidDetails(
      vapidSubject,
      vapidPublicKey,
      vapidPrivateKey
    );

    // Store notification in Notifications table for history
    console.log('💾 [Send Push] Storing notification in database...');
    
    if (user_id) {
      // Get target user info
      const targetUser = await base44.asServiceRole.entities.User.filter({ id: user_id });
      if (targetUser.length > 0) {
        await base44.asServiceRole.entities.Notification.create({
          user_id: user_id,
          user_email: targetUser[0].email,
          target_role: target_role || null,
          title: title,
          message: message,
          type: 'general',
          priority: 'medium',
          icon: 'bell',
          is_read: false
        });
      }
    } else if (target_role) {
      // Role-based notification - store for each user with that role
      const targetUsers = await base44.asServiceRole.entities.User.filter({
        user_type: target_role
      });
      
      for (const targetUser of targetUsers) {
        await base44.asServiceRole.entities.Notification.create({
          user_id: targetUser.id,
          user_email: targetUser.email,
          target_role: target_role,
          title: title,
          message: message,
          type: 'general',
          priority: 'medium',
          icon: 'bell',
          is_read: false
        });
      }
    }

    // Get push subscriptions based on filters
    let subs = [];
    
    if (user_id && target_role) {
      // Both user_id and role specified
      subs = await base44.asServiceRole.entities.PushSubscription.filter({
        user_id: user_id,
        role: target_role
      });
    } else if (user_id) {
      // Only user_id specified
      subs = await base44.asServiceRole.entities.PushSubscription.filter({
        user_id: user_id
      });
    } else if (target_role) {
      // Only role specified
      subs = await base44.asServiceRole.entities.PushSubscription.filter({
        role: target_role
      });
    } else {
      // No filters - get all subscriptions
      subs = await base44.asServiceRole.entities.PushSubscription.list();
    }

    console.log(`📬 [Send Push] Found ${subs.length} subscription(s)`);

    // Send push notifications
    const payload = JSON.stringify({ 
      title, 
      body: message,
      data: {
        url: '/notifications',
        timestamp: Date.now()
      }
    });

    let successCount = 0;
    let failedCount = 0;

    for (const sub of subs) {
      try {
        const pushSubscription = {
          endpoint: sub.endpoint,
          keys: {
            p256dh: sub.p256dh,
            auth: sub.auth
          }
        };

        await webpush.sendNotification(pushSubscription, payload);
        successCount++;
        console.log('✅ [Send Push] Sent to:', sub.endpoint.substring(0, 50) + '...');
        
        // Mark as push sent if we created a notification
        if (user_id) {
          const notifications = await base44.asServiceRole.entities.Notification.filter({
            user_id: user_id,
            title: title
          }, '-created_date', 1);
          
          if (notifications.length > 0) {
            await base44.asServiceRole.entities.Notification.update(notifications[0].id, {
              push_sent: true,
              push_sent_at: new Date().toISOString()
            });
          }
        }
      } catch (error) {
        failedCount++;
        console.error('❌ [Send Push] Failed to send:', error.message);
        
        // If subscription is expired (410), delete it
        if (error.statusCode === 410 || error.statusCode === 404) {
          console.log('🧹 [Send Push] Removing expired subscription');
          await base44.asServiceRole.entities.PushSubscription.delete(sub.id);
        }
      }
    }

    console.log(`🎉 [Send Push] Complete - Success: ${successCount}, Failed: ${failedCount}`);

    return Response.json({ 
      success: true, 
      delivered: successCount,
      failed: failedCount,
      total: subs.length
    });

  } catch (error) {
    console.error('❌ [Send Push] Error:', error);
    return Response.json({ 
      error: error.message 
    }, { status: 500 });
  }
});