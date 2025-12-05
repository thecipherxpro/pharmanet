import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        
        // Verify user is authenticated
        const user = await base44.auth.me();
        if (!user) {
            return Response.json({ error: 'Unauthorized' }, { status: 401 });
        }
        
        // Get Stripe publishable key from environment
        const publishableKey = Deno.env.get("STRIPE_PUBLISHABLE_KEY");
        
        if (!publishableKey) {
            console.error('STRIPE_PUBLISHABLE_KEY not found');
            return Response.json({ 
                error: 'Stripe not configured' 
            }, { status: 500 });
        }

        return Response.json({ publishableKey });
    } catch (error) {
        console.error('Error:', error);
        return Response.json({ error: error.message }, { status: 500 });
    }
});