import { createClientFromRequest } from 'npm:@base44/sdk@0.7.1';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    
    // Authenticate user
    const user = await base44.auth.me();
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get unread notifications count
    const unreadNotifications = await base44.entities.Notification.filter({
      user_email: user.email,
      is_read: false
    });

    const count = unreadNotifications.length;

    // Get counts by priority
    const urgentCount = unreadNotifications.filter(n => n.priority === 'urgent').length;
    const highCount = unreadNotifications.filter(n => n.priority === 'high').length;

    console.log(`📊 [Notification] Unread count for ${user.email}: ${count}`);

    return Response.json({
      success: true,
      count,
      urgent_count: urgentCount,
      high_count: highCount,
      has_unread: count > 0
    });

  } catch (error) {
    console.error('❌ [Notification] Count error:', error);
    return Response.json({ 
      error: error.message 
    }, { status: 500 });
  }
});