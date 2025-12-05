import { createClientFromRequest } from 'npm:@base44/sdk@0.7.1';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    
    // Authenticate user
    const user = await base44.auth.me();
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { notification_id, mark_all = false } = body;

    console.log('📖 [Mark Read] User:', user.email, '- Mark All:', mark_all);

    if (mark_all) {
      // Mark all notifications as read for this user
      const notifications = await base44.entities.Notification.filter({
        to_email: user.email,
        is_read: false
      });

      console.log('📋 [Mark All] Found', notifications.length, 'unread notifications');

      const updatePromises = notifications.map(notif => 
        base44.entities.Notification.update(notif.id, {
          is_read: true,
          read_at: new Date().toISOString()
        })
      );

      await Promise.all(updatePromises);

      console.log(`✅ [Mark All] Marked ${notifications.length} notifications as read for ${user.email}`);

      return Response.json({
        success: true,
        marked_count: notifications.length
      });
    } else if (notification_id) {
      // Mark single notification as read
      const notifications = await base44.entities.Notification.filter({
        id: notification_id
      });

      if (notifications.length === 0) {
        console.error('❌ [Mark Read] Notification not found:', notification_id);
        return Response.json({ 
          error: 'Notification not found' 
        }, { status: 404 });
      }

      const notification = notifications[0];

      // Verify this notification belongs to the current user
      if (notification.to_email !== user.email) {
        console.error('❌ [Mark Read] Unauthorized - notification belongs to:', notification.to_email);
        return Response.json({ 
          error: 'Unauthorized' 
        }, { status: 403 });
      }

      await base44.entities.Notification.update(notification_id, {
        is_read: true,
        read_at: new Date().toISOString()
      });

      console.log(`✅ [Mark Read] Marked as read: ${notification_id}`);

      return Response.json({
        success: true,
        notification_id
      });
    } else {
      return Response.json({ 
        error: 'Either notification_id or mark_all must be provided' 
      }, { status: 400 });
    }

  } catch (error) {
    console.error('❌ [Mark Read] Error:', error);
    return Response.json({ 
      error: error.message 
    }, { status: 500 });
  }
});