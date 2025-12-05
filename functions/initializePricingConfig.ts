import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    
    const user = await base44.auth.me();
    if (!user || user.role !== 'admin') {
      return Response.json({ error: 'Unauthorized' }, { status: 403 });
    }

    // Check if pricing configs already exist
    const existing = await base44.asServiceRole.entities.PricingConfig.list();
    
    if (existing.length > 0) {
      return Response.json({
        success: true,
        message: 'Pricing configs already exist',
        configs: existing
      });
    }

    // Initialize default pricing configs
    const defaultConfigs = [
      {
        urgency_level: 'emergency',
        base_rate: 90,
        label: '🚨 Emergency',
        color: 'border-red-600 bg-red-50 text-red-700',
        description: 'Same-day shift (within 24 hours)',
        min_days_ahead: 0,
        max_days_ahead: 1,
        is_active: true
      },
      {
        urgency_level: 'very_urgent',
        base_rate: 65,
        label: '⚡ Very Urgent',
        color: 'border-orange-600 bg-orange-50 text-orange-700',
        description: '1-3 days notice',
        min_days_ahead: 1,
        max_days_ahead: 3,
        is_active: true
      },
      {
        urgency_level: 'urgent',
        base_rate: 60,
        label: '🔥 Urgent',
        color: 'border-yellow-600 bg-yellow-50 text-yellow-700',
        description: '4-6 days notice',
        min_days_ahead: 4,
        max_days_ahead: 6,
        is_active: true
      },
      {
        urgency_level: 'short_notice',
        base_rate: 55,
        label: 'Short Notice',
        color: 'border-blue-600 bg-blue-50 text-blue-700',
        description: '7-13 days notice',
        min_days_ahead: 7,
        max_days_ahead: 13,
        is_active: true
      },
      {
        urgency_level: 'moderate',
        base_rate: 53,
        label: 'Moderate',
        color: 'border-indigo-600 bg-indigo-50 text-indigo-700',
        description: '14-20 days notice',
        min_days_ahead: 14,
        max_days_ahead: 20,
        is_active: true
      },
      {
        urgency_level: 'reasonable',
        base_rate: 51,
        label: 'Reasonable',
        color: 'border-purple-600 bg-purple-50 text-purple-700',
        description: '21-29 days notice',
        min_days_ahead: 21,
        max_days_ahead: 29,
        is_active: true
      },
      {
        urgency_level: 'planned',
        base_rate: 50,
        label: '📅 Planned',
        color: 'border-green-600 bg-green-50 text-green-700',
        description: '30+ days notice',
        min_days_ahead: 30,
        max_days_ahead: 9999,
        is_active: true
      }
    ];

    const created = [];
    for (const config of defaultConfigs) {
      const result = await base44.asServiceRole.entities.PricingConfig.create(config);
      created.push(result);
    }

    return Response.json({
      success: true,
      message: 'Pricing configs initialized',
      configs: created
    });

  } catch (error) {
    console.error('Error initializing pricing:', error);
    return Response.json({ 
      error: error.message || 'Failed to initialize pricing' 
    }, { status: 500 });
  }
});