import { createClientFromRequest } from 'npm:@base44/sdk@0.7.1';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { subscription, endpoint, userAgent } = await req.json();

    if (!subscription || !subscription.endpoint) {
      return Response.json({ error: 'Invalid subscription data' }, { status: 400 });
    }

    // Store subscription in user data
    const existingSubscriptions = user.push_subscriptions || [];
    
    // Check if subscription already exists
    const existingIndex = existingSubscriptions.findIndex(
      sub => sub.endpoint === subscription.endpoint
    );

    if (existingIndex >= 0) {
      // Update existing subscription
      existingSubscriptions[existingIndex] = {
        ...subscription,
        updated_at: new Date().toISOString(),
        user_agent: userAgent || 'unknown'
      };
    } else {
      // Add new subscription
      existingSubscriptions.push({
        ...subscription,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        user_agent: userAgent || 'unknown'
      });
    }

    // Update user with subscriptions
    await base44.auth.updateMe({
      push_subscriptions: existingSubscriptions
    });

    return Response.json({ 
      success: true,
      message: 'Push subscription registered successfully'
    });

  } catch (error) {
    console.error('Error registering push subscription:', error);
    return Response.json({ 
      error: error.message || 'Failed to register push subscription'
    }, { status: 500 });
  }
});