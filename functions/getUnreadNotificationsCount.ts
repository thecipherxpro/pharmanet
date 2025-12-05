import { createClientFromRequest } from 'npm:@base44/sdk@0.7.1';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    
    // Authenticate user
    const user = await base44.auth.me();
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    console.log('🔔 [Unread Count] Fetching for:', user.email);

    // Get unread notifications count using to_email field
    const unreadNotifications = await base44.entities.Notification.filter({
      to_email: user.email,
      is_read: false
    });

    const count = unreadNotifications.length;

    // Get counts by priority
    const urgentCount = unreadNotifications.filter(n => n.priority === 'urgent').length;
    const highCount = unreadNotifications.filter(n => n.priority === 'high').length;

    console.log(`📊 [Unread Count] Total: ${count}, Urgent: ${urgentCount}, High: ${highCount}`);

    return Response.json({
      success: true,
      count,
      urgent_count: urgentCount,
      high_count: highCount,
      has_unread: count > 0
    });

  } catch (error) {
    console.error('❌ [Unread Count] Error:', error);
    return Response.json({ 
      error: error.message,
      count: 0,
      urgent_count: 0,
      high_count: 0,
      has_unread: false
    }, { status: 500 });
  }
});