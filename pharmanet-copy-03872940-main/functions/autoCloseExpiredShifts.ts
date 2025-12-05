import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    
    // Use service role for automated task
    const now = new Date();

    // Get all open shifts
    const openShifts = await base44.asServiceRole.entities.Shift.filter({ 
      status: 'open' 
    });

    let closedCount = 0;
    const closedShifts = [];

    for (const shift of openShifts) {
      let shouldClose = false;

      // Check schedule
      const schedule = shift.schedule || [];
      
      if (schedule.length > 0) {
        // Check if ALL dates have passed
        // Use Eastern Time offset (-05:00 for EST, -04:00 for EDT)
        // Using -05:00 as conservative default (EST)
        const allDatesExpired = schedule.every(dateObj => {
          if (!dateObj.date) return true; // Invalid date is considered expired/skippable
          const shiftDateTime = new Date(`${dateObj.date}T${dateObj.end_time || '17:00'}:00-05:00`);
          return shiftDateTime < now;
        });
        shouldClose = allDatesExpired;
      } else {
        // No dates = should close
        shouldClose = true;
      }

      if (shouldClose) {
        await base44.asServiceRole.entities.Shift.update(shift.id, {
          status: 'closed',
          closed_at: now.toISOString()
        });
        closedCount++;
        closedShifts.push({
          id: shift.id,
          title: shift.title,
          pharmacy_name: shift.pharmacy_name,
          primary_date: schedule.length > 0 ? schedule[0].date : 'N/A'
        });
      }
    }

    return Response.json({
      success: true,
      closed_count: closedCount,
      closed_shifts: closedShifts,
      message: `Successfully closed ${closedCount} expired shifts`
    });

  } catch (error) {
    console.error('Error auto-closing expired shifts:', error);
    return Response.json({ 
      error: error.message || 'Failed to auto-close expired shifts' 
    }, { status: 500 });
  }
});