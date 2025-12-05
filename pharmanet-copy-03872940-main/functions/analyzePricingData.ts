import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    
    const user = await base44.auth.me();
    if (!user || user.role !== 'admin') {
      return Response.json({ error: 'Unauthorized' }, { status: 403 });
    }

    // Get all shifts
    const shifts = await base44.asServiceRole.entities.Shift.list();

    // Analyze pricing distribution
    const urgencyDistribution = {};
    const rateDistribution = {};
    let totalShifts = shifts.length;
    let totalRevenue = 0;
    let avgRate = 0;

    shifts.forEach(shift => {
      // Count by urgency
      if (shift.urgency_level) {
        urgencyDistribution[shift.urgency_level] = (urgencyDistribution[shift.urgency_level] || 0) + 1;
      }

      // Count by rate ranges
      const rate = shift.hourly_rate || 0;
      if (rate >= 90) rateDistribution['$90+'] = (rateDistribution['$90+'] || 0) + 1;
      else if (rate >= 65) rateDistribution['$65-$89'] = (rateDistribution['$65-$89'] || 0) + 1;
      else if (rate >= 60) rateDistribution['$60-$64'] = (rateDistribution['$60-$64'] || 0) + 1;
      else if (rate >= 55) rateDistribution['$55-$59'] = (rateDistribution['$55-$59'] || 0) + 1;
      else rateDistribution['$50-$54'] = (rateDistribution['$50-$54'] || 0) + 1;

      totalRevenue += shift.total_pay || 0;
    });

    avgRate = totalShifts > 0 ? shifts.reduce((sum, s) => sum + (s.hourly_rate || 0), 0) / totalShifts : 0;

    // Get pricing config
    const pricingConfigs = await base44.asServiceRole.entities.PricingConfig.list();

    // Calculate usage per pricing tier
    const tierUsage = pricingConfigs.map(config => {
      const count = urgencyDistribution[config.urgency_level] || 0;
      const percentage = totalShifts > 0 ? (count / totalShifts) * 100 : 0;
      
      return {
        urgency_level: config.urgency_level,
        base_rate: config.base_rate,
        label: config.label,
        shift_count: count,
        usage_percentage: percentage.toFixed(1)
      };
    });

    return Response.json({
      success: true,
      summary: {
        total_shifts: totalShifts,
        total_revenue: totalRevenue.toFixed(2),
        average_rate: avgRate.toFixed(2)
      },
      urgency_distribution: urgencyDistribution,
      rate_distribution: rateDistribution,
      tier_usage: tierUsage,
      pricing_configs: pricingConfigs
    });

  } catch (error) {
    console.error('Error analyzing pricing:', error);
    return Response.json({ 
      error: error.message || 'Failed to analyze pricing' 
    }, { status: 500 });
  }
});