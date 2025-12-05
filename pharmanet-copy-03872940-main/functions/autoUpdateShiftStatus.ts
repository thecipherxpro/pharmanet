import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';

/**
 * Auto-update shift statuses based on time
 * Also auto-reject applications for expired shifts
 * Run this every hour via cron or manual trigger
 */
Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    
    // Authenticate request
    const user = await base44.auth.me();
    if (!user || (user.role !== 'admin' && user.user_type !== 'admin')) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const now = new Date();
    const results = {
      closedShifts: 0,
      completedShifts: 0,
      rejectedApplications: 0,
      errors: []
    };

    // Get all active shifts using service role
    const allShifts = await base44.asServiceRole.entities.Shift.filter({
      status: { $in: ['open', 'filled'] }
    });

    console.log(`Processing ${allShifts.length} active shifts`);

    for (const shift of allShifts) {
      try {
        const shiftDate = new Date(shift.shift_date);
        const [endHours, endMinutes] = shift.end_time.split(':').map(Number);
        const shiftEndDateTime = new Date(shiftDate);
        shiftEndDateTime.setHours(endHours, endMinutes, 0, 0);

        // Close open shifts that have passed their date
        if (shift.status === 'open' && shiftEndDateTime < now) {
          await base44.asServiceRole.entities.Shift.update(shift.id, {
            status: 'closed',
            closed_at: now.toISOString(),
            status_updated_at: now.toISOString()
          });
          results.closedShifts++;
          console.log(`Closed shift ${shift.id} - ${shift.pharmacy_name}`);

          // Auto-reject all pending applications for this closed shift
          const pendingApps = await base44.asServiceRole.entities.ShiftApplication.filter({
            shift_id: shift.id,
            status: 'pending'
          });

          for (const app of pendingApps) {
            await base44.asServiceRole.entities.ShiftApplication.update(app.id, {
              status: 'rejected'
            });
            results.rejectedApplications++;

            // Send notification to pharmacist
            try {
              await base44.asServiceRole.functions.invoke('sendShiftNotification', {
                notification_type: 'application_rejected',
                shift_data: {
                  shift_date: shift.shift_date,
                  pharmacy_name: shift.pharmacy_name,
                  rejection_reason: 'Shift expired before acceptance'
                },
                recipient_email: app.pharmacist_email
              });
            } catch (notifError) {
              console.error(`Failed to send rejection notification to ${app.pharmacist_email}:`, notifError);
            }
          }
        }

        // Complete filled shifts that have finished
        if (shift.status === 'filled' && shiftEndDateTime < now) {
          await base44.asServiceRole.entities.Shift.update(shift.id, {
            status: 'completed',
            completed_at: now.toISOString(),
            status_updated_at: now.toISOString()
          });
          results.completedShifts++;
          console.log(`Completed shift ${shift.id} - ${shift.pharmacy_name}`);
        }
      } catch (error) {
        console.error(`Error processing shift ${shift.id}:`, error);
        results.errors.push({
          shiftId: shift.id,
          error: error.message
        });
      }
    }

    return Response.json({
      success: true,
      message: 'Shift statuses updated successfully',
      results,
      processedAt: now.toISOString()
    });

  } catch (error) {
    console.error('Auto-update error:', error);
    return Response.json({ 
      error: error.message,
      success: false 
    }, { status: 500 });
  }
});