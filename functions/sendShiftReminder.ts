import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);

    // This function should be called via a scheduled cron job
    // Get all shifts happening in the next 1-2 hours

    const now = new Date();
    const oneHourFromNow = new Date(now.getTime() + 60 * 60 * 1000);
    const twoHoursFromNow = new Date(now.getTime() + 2 * 60 * 60 * 1000);

    // Get today's date string YYYY-MM-DD (local time approximation or use UTC if stored as such)
    // Ideally, we should use the timezone of the pharmacy, but for simplicity we'll check all filled shifts
    
    // Get all filled shifts
    // Note: In a production app with many shifts, we would need a better way to filter this efficiently
    const shifts = await base44.asServiceRole.entities.Shift.filter({
      status: 'filled'
    });

    let remindersSent = 0;
    const errors = [];

    for (const shift of shifts) {
      try {
        const schedule = shift.schedule || [];
        if (schedule.length === 0) continue;

        // Check each scheduled date
        for (const session of schedule) {
            if (!session.date || !session.start_time) continue;

            // Parse shift start time
            const [hours, minutes] = session.start_time.split(':').map(Number);
            const shiftDateTime = new Date(session.date);
            shiftDateTime.setHours(hours, minutes, 0, 0);

            // Check if THIS SPECIFIC SESSION starts in 1-2 hours
            if (shiftDateTime >= oneHourFromNow && shiftDateTime <= twoHoursFromNow) {
                // Get pharmacist email
                const pharmacistEmail = shift.assigned_to;
                
                if (!pharmacistEmail) continue;

                // Get pharmacist details
                const users = await base44.asServiceRole.entities.User.filter({
                    email: pharmacistEmail
                });

                if (users.length === 0) continue;

                const pharmacist = users[0];

                // Format time in 12-hour format
                const formatTime = (time) => {
                    const [h, m] = time.split(':').map(Number);
                    const period = h >= 12 ? 'PM' : 'AM';
                    const hour12 = h % 12 || 12;
                    return `${hour12}:${m.toString().padStart(2, '0')} ${period}`;
                };

                // Send in-app notification
                await base44.functions.invoke('triggerNotification', {
                    from_email: 'system@pharmanet.ca',
                    from_name: 'Pharmanet',
                    to_email: pharmacistEmail,
                    to_name: pharmacist.full_name,
                    notification_type: 'shift_reminder',
                    title: '⏰ Shift Starting Soon',
                    message: `Your shift at ${shift.pharmacy_name} starts in approximately 1 hour at ${formatTime(session.start_time)}`,
                    priority: 'high',
                    action_url: `/pharmacist-shift-details?id=${shift.id}`,
                    action_text: 'View Details',
                    icon: 'clock',
                    shift_id: shift.id,
                    metadata: {
                    shift_start_time: session.start_time,
                    pharmacy_address: shift.pharmacy_address,
                    pharmacy_city: shift.pharmacy_city,
                    session_date: session.date
                    }
                });

                remindersSent++;
                // Break loop for this shift to avoid double notification if multiple sessions are close (unlikely but possible)
                break; 
            }
        }
      } catch (error) {
        console.error(`Error processing shift ${shift.id}:`, error);
        errors.push({ shiftId: shift.id, error: error.message });
      }
    }

    return Response.json({
      success: true,
      remindersSent,
      totalShiftsChecked: shifts.length,
      errors: errors.length > 0 ? errors : undefined
    });

  } catch (error) {
    console.error('Error sending shift reminders:', error);
    return Response.json({ 
      error: 'Failed to send reminders',
      details: error.message 
    }, { status: 500 });
  }
});