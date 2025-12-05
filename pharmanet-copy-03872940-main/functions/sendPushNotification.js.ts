import { createClientFromRequest } from 'npm:@base44/sdk@0.7.1';
import webpush from 'npm:web-push@3.6.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { userId, title, body, url, tag, requireInteraction } = await req.json();

    if (!userId) {
      return Response.json({ error: 'User ID is required' }, { status: 400 });
    }

    // Get VAPID keys from environment
    const vapidPublicKey = Deno.env.get('VAPID_PUBLIC_KEY');
    const vapidPrivateKey = Deno.env.get('VAPID_PRIVATE_KEY');
    const vapidSubject = Deno.env.get('VAPID_SUBJECT');

    if (!vapidPublicKey || !vapidPrivateKey || !vapidSubject) {
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

    // Get target user's subscriptions
    const targetUsers = await base44.asServiceRole.entities.User.filter({ id: userId });
    const targetUser = targetUsers[0];

    if (!targetUser || !targetUser.push_subscriptions || targetUser.push_subscriptions.length === 0) {
      return Response.json({ 
        success: false,
        message: 'No push subscriptions found for user'
      });
    }

    // Prepare notification payload
    const notificationPayload = JSON.stringify({
      title: title || 'Pharmanet',
      body: body || 'You have a new notification',
      data: {
        url: url || '/',
        timestamp: Date.now()
      },
      tag: tag || 'notification',
      requireInteraction: requireInteraction || false
    });

    // Send to all user's subscriptions
    const sendPromises = targetUser.push_subscriptions.map(async (subscription) => {
      try {
        await webpush.sendNotification(subscription, notificationPayload);
        return { success: true, endpoint: subscription.endpoint };
      } catch (error) {
        console.error('Failed to send to subscription:', error);
        
        // If subscription is no longer valid, mark for removal
        if (error.statusCode === 410 || error.statusCode === 404) {
          return { success: false, endpoint: subscription.endpoint, expired: true };
        }
        
        return { success: false, endpoint: subscription.endpoint, error: error.message };
      }
    });

    const results = await Promise.all(sendPromises);

    // Remove expired subscriptions
    const expiredEndpoints = results
      .filter(r => r.expired)
      .map(r => r.endpoint);

    if (expiredEndpoints.length > 0) {
      const validSubscriptions = targetUser.push_subscriptions.filter(
        sub => !expiredEndpoints.includes(sub.endpoint)
      );
      
      await base44.asServiceRole.entities.User.update(userId, {
        push_subscriptions: validSubscriptions
      });
    }

    const successCount = results.filter(r => r.success).length;

    return Response.json({ 
      success: true,
      message: `Sent to ${successCount} of ${results.length} subscriptions`,
      results
    });

  } catch (error) {
    console.error('Error sending push notification:', error);
    return Response.json({ 
      error: error.message || 'Failed to send push notification'
    }, { status: 500 });
  }
});