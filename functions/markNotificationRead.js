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

    if (mark_all) {
      // Mark all notifications as read for this user
      const notifications = await base44.entities.Notification.filter({
        user_email: user.email,
        is_read: false
      });

      const updatePromises = notifications.map(notif => 
        base44.entities.Notification.update(notif.id, {
          is_read: true,
          read_at: new Date().toISOString()
        })
      );

      await Promise.all(updatePromises);

      console.log(`✅ [Notification] Marked ${notifications.length} notifications as read for ${user.email}`);

      return Response.json({
        success: true,
        marked_count: notifications.length
      });
    } else if (notification_id) {
      // Mark single notification as read
      const notification = await base44.entities.Notification.filter({
        id: notification_id,
        user_email: user.email
      });

      if (notification.length === 0) {
        return Response.json({ 
          error: 'Notification not found or unauthorized' 
        }, { status: 404 });
      }

      await base44.entities.Notification.update(notification_id, {
        is_read: true,
        read_at: new Date().toISOString()
      });

      console.log(`✅ [Notification] Marked as read: ${notification_id}`);

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
    console.error('❌ [Notification] Mark read error:', error);
    return Response.json({ 
      error: error.message 
    }, { status: 500 });
  }
});