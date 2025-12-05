import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);

    // This function should be called via a scheduled cron job every hour
    // It will mark all filled shifts as completed once their end time has passed

    const now = new Date();
    
    // Get all filled shifts
    const filledShifts = await base44.asServiceRole.entities.Shift.filter({
      status: 'filled'
    });

    let updatedCount = 0;
    const errors = [];

    for (const shift of filledShifts) {
      try {
        const schedule = shift.schedule || [];
        if (schedule.length === 0) continue;

        // Find the very last end time of the entire shift (multi-day support)
        let lastEndTime = new Date(0); // Epoch

        for (const session of schedule) {
            if (!session.date || !session.end_time) continue;
            
            const [endHours, endMinutes] = session.end_time.split(':').map(Number);
            const sessionEnd = new Date(session.date);
            sessionEnd.setHours(endHours, endMinutes, 0, 0);

            if (sessionEnd > lastEndTime) {
                lastEndTime = sessionEnd;
            }
        }

        // Check if the entire shift series has ended
        if (now > lastEndTime && lastEndTime.getTime() > 0) {
          // Update shift status to completed
          await base44.asServiceRole.entities.Shift.update(shift.id, {
            status: 'completed',
            completed_at: now.toISOString()
          });

          updatedCount++;

          // Update pharmacist stats
          if (shift.assigned_to) {
            try {
              await base44.functions.invoke('updatePublicProfileStats', {
                pharmacistEmail: shift.assigned_to
              });
            } catch (error) {
              console.error('Failed to update pharmacist stats:', error);
            }
          }

          // Send completion notifications
          try {
            // Get employer details
            const employers = await base44.asServiceRole.entities.User.filter({
              email: shift.created_by
            });

            if (employers.length > 0) {
              const employer = employers[0];

              // Trigger notification to employer
              await base44.functions.invoke('triggerNotification', {
                from_email: 'system@pharmanet.ca',
                from_name: 'Pharmanet',
                to_email: employer.email,
                to_name: employer.full_name || employer.company_name,
                notification_type: 'shift_completed',
                title: 'Shift Completed',
                message: `Your shift at ${shift.pharmacy_name} has been completed. You can now review the pharmacist and process payroll.`,
                priority: 'medium',
                action_url: `/completed-shift-details?id=${shift.id}`,
                action_text: 'Review & Pay',
                icon: 'check',
                shift_id: shift.id
              });
            }

            // Send notification to pharmacist
            if (shift.assigned_to) {
              const pharmacists = await base44.asServiceRole.entities.User.filter({
                email: shift.assigned_to
              });

              if (pharmacists.length > 0) {
                const pharmacist = pharmacists[0];

                await base44.functions.invoke('triggerNotification', {
                  from_email: 'system@pharmanet.ca',
                  from_name: 'Pharmanet',
                  to_email: pharmacist.email,
                  to_name: pharmacist.full_name,
                  notification_type: 'shift_completed',
                  title: 'Shift Completed!',
                  message: `Great work! Your shift at ${shift.pharmacy_name} has been completed. Total pay: $${shift.total_pay?.toFixed(2)}`,
                  priority: 'medium',
                  action_url: '/my-schedule',
                  action_text: 'View Details',
                  icon: 'check',
                  shift_id: shift.id
                });
              }
            }
          } catch (emailError) {
            console.error(`Failed to send completion notifications for shift ${shift.id}:`, emailError);
          }
        }
      } catch (error) {
        console.error(`Error processing shift ${shift.id}:`, error);
        errors.push({ shiftId: shift.id, error: error.message });
      }
    }

    return Response.json({
      success: true,
      message: `Marked ${updatedCount} shifts as completed`,
      totalChecked: filledShifts.length,
      updatedCount,
      errors: errors.length > 0 ? errors : undefined,
      timestamp: now.toISOString()
    });

  } catch (error) {
    console.error('Error in markShiftsAsCompleted:', error);
    return Response.json({ 
      error: 'Failed to mark shifts as completed',
      details: error.message 
    }, { status: 500 });
  }
});