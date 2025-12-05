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
    const { userId, role, subscription } = body;

    // Validate that user can only subscribe for themselves
    if (userId !== user.id && user.role !== 'admin') {
      return Response.json({ 
        error: 'Cannot subscribe for another user' 
      }, { status: 403 });
    }

    console.log('📲 [Subscribe] Saving subscription for user:', userId, 'role:', role);

    // Check if subscription already exists
    const existing = await base44.entities.PushSubscription.filter({
      user_id: userId,
      endpoint: subscription.endpoint
    });

    if (existing.length > 0) {
      console.log('ℹ️ [Subscribe] Subscription already exists, updating...');
      // Update existing subscription
      await base44.entities.PushSubscription.update(existing[0].id, {
        p256dh: subscription.keys.p256dh,
        auth: subscription.keys.auth,
        role: role
      });
    } else {
      // Create new subscription
      await base44.entities.PushSubscription.create({
        user_id: userId,
        role: role,
        endpoint: subscription.endpoint,
        p256dh: subscription.keys.p256dh,
        auth: subscription.keys.auth
      });
    }

    console.log('✅ [Subscribe] Subscription saved successfully');

    return Response.json({ success: true });

  } catch (error) {
    console.error('❌ [Subscribe] Error:', error);
    return Response.json({ 
      error: error.message 
    }, { status: 500 });
  }
});