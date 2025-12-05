import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';

/**
 * Cron endpoint to automatically close expired shifts
 * Should be called hourly via external cron service or platform scheduler
 * 
 * Usage: POST to this endpoint with a secret token for authentication
 */
Deno.serve(async (req) => {
  try {
    // Basic authentication via secret token
    const authHeader = req.headers.get('authorization');
    const expectedToken = Deno.env.get('CRON_SECRET_TOKEN') || 'default-cron-secret';
    
    if (!authHeader || authHeader !== `Bearer ${expectedToken}`) {
      return Response.json({ 
        error: 'Unauthorized - Invalid cron token' 
      }, { status: 401 });
    }

    const base44 = createClientFromRequest(req);
    
    // Use service role for automated task
    const now = new Date();
    const nowISO = now.toISOString();

    // Get all open shifts
    const openShifts = await base44.asServiceRole.entities.Shift.filter({ 
      status: 'open' 
    });

    let closedCount = 0;
    let notifiedCount = 0;
    const closedShifts = [];

    for (const shift of openShifts) {
      let shouldClose = false;
      const schedule = shift.schedule || [];

      if (schedule.length > 0) {
        // Check if ALL dates have passed
        // Use Eastern Time offset (-05:00 for EST, -04:00 for EDT)
        // Using -05:00 as conservative default (EST)
        const allDatesExpired = schedule.every(dateObj => {
          if (!dateObj.date) return true;
          const shiftDateTime = new Date(`${dateObj.date}T${dateObj.end_time || '17:00'}:00-05:00`);
          return shiftDateTime < now;
        });
        shouldClose = allDatesExpired;
      } else {
        // No schedule -> corrupted or old, close it
        shouldClose = true;
      }

      if (shouldClose) {
        // Close the shift
        await base44.asServiceRole.entities.Shift.update(shift.id, {
          status: 'closed',
          closed_at: nowISO
        });
        closedCount++;
        
        const primaryDate = schedule.length > 0 ? schedule[0].date : 'N/A';
        
        closedShifts.push({
          id: shift.id,
          title: shift.title,
          pharmacy_name: shift.pharmacy_name,
          shift_date: primaryDate
        });

        // Send notification to employer
        try {
          // Get employer user
          const employerUsers = await base44.asServiceRole.entities.User.filter({
            id: shift.employer_id
          });
          
          if (employerUsers && employerUsers.length > 0) {
            const employer = employerUsers[0];
            
            // Create notification
            await base44.asServiceRole.entities.Notification.create({
              from_email: 'system@pharmanet.ca',
              from_name: 'System',
              to_email: employer.email,
              to_name: employer.full_name || 'Employer',
              notification_type: 'shift_cancelled', // Reusing type for icon mapping
              title: 'Shift Automatically Closed',
              message: `Your shift at ${shift.pharmacy_name} on ${primaryDate} was automatically closed as the date has passed.`,
              related_entity_type: 'Shift',
              related_entity_id: shift.id,
              is_read: false,
              icon: 'clock',
              priority: 'medium'
            });
            
            notifiedCount++;
          }
        } catch (notifyError) {
          console.error(`Failed to notify employer for shift ${shift.id}:`, notifyError);
          // Continue processing other shifts even if notification fails
        }
      }
    }

    return Response.json({
      success: true,
      timestamp: nowISO,
      total_open_shifts: openShifts.length,
      closed_count: closedCount,
      notified_count: notifiedCount,
      closed_shifts: closedShifts,
      message: `Successfully closed ${closedCount} expired shifts and sent ${notifiedCount} notifications`
    });

  } catch (error) {
    console.error('Error in cron auto-close shifts:', error);
    return Response.json({ 
      error: error.message || 'Failed to auto-close expired shifts',
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
});