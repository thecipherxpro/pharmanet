import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    
    // Get user to determine audience
    let userType = 'all';
    try {
      const user = await base44.auth.me();
      userType = user?.user_type || 'all';
    } catch (error) {
      // Public access allowed
    }

    // Get all enabled notifications
    const notifications = await base44.asServiceRole.entities.Notify.filter({ 
      is_enabled: true 
    });

    if (!notifications || notifications.length === 0) {
      return Response.json({ notification: null });
    }

    // Filter by target audience
    const filtered = notifications.filter(n => 
      n.target_audience === 'all' || n.target_audience === userType
    );

    // Return the most recent one
    const sorted = filtered.sort((a, b) => 
      new Date(b.created_date) - new Date(a.created_date)
    );

    return Response.json({ 
      notification: sorted[0] || null 
    });

  } catch (error) {
    console.error('Error fetching active notification:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});