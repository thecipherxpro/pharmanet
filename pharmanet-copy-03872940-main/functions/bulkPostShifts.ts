import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';

/**
 * Post multiple shifts at once (same pharmacy, different dates)
 */

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    
    if (!user || (user.user_type !== 'employer' && user.role !== 'admin')) {
      return Response.json({ 
        error: 'Only employers can post shifts' 
      }, { status: 403 });
    }

    const { shiftTemplate, dates } = await req.json(); // dates: array of date strings

    if (!shiftTemplate || !dates || dates.length === 0) {
      return Response.json({ 
        error: 'Missing shiftTemplate or dates' 
      }, { status: 400 });
    }

    if (dates.length > 30) {
      return Response.json({ 
        error: 'Maximum 30 shifts can be posted at once' 
      }, { status: 400 });
    }

    const createdShifts = [];
    const errors = [];

    for (const date of dates) {
      try {
        const shiftDate = new Date(date);
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const daysAhead = Math.ceil((shiftDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

        // Calculate rate based on urgency
        const { RateCalculator } = await import('../components/shift/RateCalculator.js');
        const { rate, urgency } = RateCalculator.calculateRate(daysAhead);

        // Calculate hours
        const [startHour, startMin] = shiftTemplate.start_time.split(':').map(Number);
        const [endHour, endMin] = shiftTemplate.end_time.split(':').map(Number);
        const totalHours = (endHour + endMin / 60) - (startHour + startMin / 60);

        const newShift = await base44.entities.Shift.create({
          ...shiftTemplate,
          schedule: [{
            date: date,
            start_time: shiftTemplate.start_time,
            end_time: shiftTemplate.end_time
          }],
          hourly_rate: rate,
          days_ahead: daysAhead,
          pricing_tier: urgency,
          total_hours: totalHours,
          total_pay: rate * totalHours,
          status: 'open'
        });

        createdShifts.push(newShift);
      } catch (error) {
        errors.push({ date, error: error.message });
      }
    }

    return Response.json({
      success: true,
      created: createdShifts.length,
      failed: errors.length,
      shifts: createdShifts,
      errors: errors,
      message: `Successfully posted ${createdShifts.length} shifts${errors.length > 0 ? `, ${errors.length} failed` : ''}`
    });

  } catch (error) {
    console.error('Bulk post error:', error);
    return Response.json({ 
      error: error.message || 'Failed to post shifts' 
    }, { status: 500 });
  }
});