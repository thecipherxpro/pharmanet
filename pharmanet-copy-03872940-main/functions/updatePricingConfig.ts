import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    
    const user = await base44.auth.me();
    if (!user || user.role !== 'admin') {
      return Response.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const { pricingUpdates } = await req.json();

    if (!pricingUpdates || !Array.isArray(pricingUpdates)) {
      return Response.json({ error: 'Invalid pricing updates' }, { status: 400 });
    }

    // Update each pricing config
    const results = [];
    for (const update of pricingUpdates) {
      const { id, base_rate, label, description, is_active } = update;
      
      if (!id) continue;

      const updated = await base44.asServiceRole.entities.PricingConfig.update(id, {
        base_rate,
        label,
        description,
        is_active
      });
      
      results.push(updated);
    }

    return Response.json({
      success: true,
      updated: results.length,
      configs: results
    });

  } catch (error) {
    console.error('Error updating pricing:', error);
    return Response.json({ 
      error: error.message || 'Failed to update pricing' 
    }, { status: 500 });
  }
});