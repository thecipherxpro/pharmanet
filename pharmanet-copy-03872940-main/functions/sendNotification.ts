import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    
    const user = await base44.auth.me();
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { 
      to_email, 
      to_name, 
      notification_type, 
      title, 
      message, 
      action_url,
      related_entity_type,
      related_entity_id,
      priority = 'medium'
    } = await req.json();

    if (!to_email || !notification_type || !title || !message) {
      return Response.json({ 
        error: 'Missing required fields: to_email, notification_type, title, message' 
      }, { status: 400 });
    }

    // Create notification using service role
    const notification = await base44.asServiceRole.entities.Notification.create({
      from_email: user.email,
      from_name: user.full_name,
      to_email,
      to_name,
      notification_type,
      title,
      message,
      action_url,
      related_entity_type,
      related_entity_id,
      priority,
      icon: notification_type.includes('message') ? 'mail' : 'bell'
    });

    return Response.json({ success: true, notification });
  } catch (error) {
    console.error('Notification error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});