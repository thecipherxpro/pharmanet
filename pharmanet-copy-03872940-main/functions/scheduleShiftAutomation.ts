import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';

/**
 * Master scheduler function that runs all automated shift tasks
 * This should be called periodically (e.g., every hour) by a cron service
 * 
 * Tasks performed:
 * 1. Auto-close expired shifts
 * 2. Send shift reminders (24h before)
 * 3. Update shift statuses
 * 
 * Usage: POST to this endpoint with cron secret token
 */
Deno.serve(async (req) => {
  try {
    // Authenticate cron request
    const authHeader = req.headers.get('authorization');
    const expectedToken = Deno.env.get('CRON_SECRET_TOKEN') || 'default-cron-secret';
    
    if (!authHeader || authHeader !== `Bearer ${expectedToken}`) {
      return Response.json({ 
        error: 'Unauthorized - Invalid cron token' 
      }, { status: 401 });
    }

    const base44 = createClientFromRequest(req);
    const now = new Date();
    const results = {
      timestamp: now.toISOString(),
      tasks: {}
    };

    // Task 1: Auto-close expired shifts
    try {
      const closeResponse = await fetch(`${req.headers.get('origin')}/api/functions/cronAutoCloseShifts`, {
        method: 'POST',
        headers: {
          'authorization': authHeader
        }
      });
      
      if (closeResponse.ok) {
        const closeData = await closeResponse.json();
        results.tasks.autoClose = {
          success: true,
          closed_count: closeData.closed_count,
          notified_count: closeData.notified_count
        };
      } else {
        results.tasks.autoClose = {
          success: false,
          error: 'Failed to auto-close shifts'
        };
      }
    } catch (error) {
      results.tasks.autoClose = {
        success: false,
        error: error.message
      };
    }

    // Task 2: Send 24h reminders for upcoming shifts
    try {
      const tomorrow = new Date(now);
      tomorrow.setDate(tomorrow.getDate() + 1);
      const tomorrowDate = tomorrow.toISOString().split('T')[0];

      // Get shifts starting tomorrow that are filled
      const upcomingShifts = await base44.asServiceRole.entities.Shift.filter({
        shift_date: tomorrowDate,
        status: 'filled'
      });

      let remindersSent = 0;
      
      for (const shift of upcomingShifts) {
        if (shift.assigned_to) {
          try {
            // Create notification for pharmacist
            await base44.asServiceRole.entities.Notification.create({
              user_email: shift.assigned_to,
              type: 'shift_reminder',
              title: 'Shift Reminder - Tomorrow',
              message: `Reminder: You have a shift tomorrow at ${shift.pharmacy_name} from ${shift.start_time} to ${shift.end_time}`,
              data: {
                shift_id: shift.id,
                pharmacy_name: shift.pharmacy_name,
                shift_date: shift.shift_date,
                start_time: shift.start_time,
                end_time: shift.end_time
              },
              read: false,
              created_at: now.toISOString()
            });
            
            remindersSent++;
          } catch (notifyError) {
            console.error(`Failed to send reminder for shift ${shift.id}:`, notifyError);
          }
        }
      }

      results.tasks.reminders = {
        success: true,
        reminders_sent: remindersSent,
        upcoming_shifts: upcomingShifts.length
      };
    } catch (error) {
      results.tasks.reminders = {
        success: false,
        error: error.message
      };
    }

    // Task 3: Mark completed shifts (past date + filled status)
    try {
      const yesterday = new Date(now);
      yesterday.setDate(yesterday.getDate() - 1);
      const yesterdayDate = yesterday.toISOString().split('T')[0];

      // Get filled shifts from yesterday or earlier that aren't marked complete
      const filledShifts = await base44.asServiceRole.entities.Shift.filter({
        status: 'filled'
      });

      let markedComplete = 0;
      
      for (const shift of filledShifts) {
        const shiftDate = new Date(shift.shift_date);
        if (shiftDate < yesterday) {
          await base44.asServiceRole.entities.Shift.update(shift.id, {
            status: 'completed',
            completed_at: now.toISOString()
          });
          markedComplete++;
        }
      }

      results.tasks.markComplete = {
        success: true,
        marked_complete: markedComplete
      };
    } catch (error) {
      results.tasks.markComplete = {
        success: false,
        error: error.message
      };
    }

    const successfulTasks = Object.values(results.tasks).filter(t => t.success).length;
    const totalTasks = Object.keys(results.tasks).length;

    return Response.json({
      success: successfulTasks === totalTasks,
      message: `Completed ${successfulTasks}/${totalTasks} tasks successfully`,
      ...results
    });

  } catch (error) {
    console.error('Error in schedule shift automation:', error);
    return Response.json({ 
      error: error.message || 'Failed to run scheduled tasks',
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
});