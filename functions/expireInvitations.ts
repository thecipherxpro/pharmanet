import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    
    // This function should be called via cron/scheduled task
    // No user authentication required for system tasks
    
    const now = new Date();

    // Get all pending invitations
    const invitations = await base44.asServiceRole.entities.ShiftInvitation.filter({
      status: 'pending'
    });

    let expiredCount = 0;

    for (const invitation of invitations) {
      // Check if invitation has expired (7 days or if expires_at is set)
      let shouldExpire = false;

      if (invitation.expires_at) {
        const expiryDate = new Date(invitation.expires_at);
        shouldExpire = now >= expiryDate;
      } else {
        // Default: expire after 7 days from invited_at
        const invitedDate = new Date(invitation.invited_at);
        const daysSinceInvited = (now.getTime() - invitedDate.getTime()) / (1000 * 60 * 60 * 24);
        shouldExpire = daysSinceInvited >= 7;
      }

      // Also check if shift date has passed
      const shifts = await base44.asServiceRole.entities.Shift.filter({ 
        id: invitation.shift_id 
      });
      
      if (shifts.length > 0) {
        const shift = shifts[0];
        
        // Get schedule from shift (supports new schedule array format)
        const getScheduleFromShift = (shiftData) => {
          if (shiftData.schedule && Array.isArray(shiftData.schedule) && shiftData.schedule.length > 0) {
            return shiftData.schedule;
          }
          if (shiftData.shift_date) {
            return [{ date: shiftData.shift_date }];
          }
          return [];
        };
        
        const schedule = getScheduleFromShift(shift);
        
        // Check if ALL shift dates have passed
        if (schedule.length > 0) {
          const allDatesPassed = schedule.every(dateInfo => {
            if (!dateInfo.date) return true;
            const [year, month, day] = dateInfo.date.split('-').map(Number);
            const shiftDate = new Date(year, month - 1, day);
            shiftDate.setHours(23, 59, 59, 999); // End of day
            return shiftDate < now;
          });
          
          if (allDatesPassed) {
            shouldExpire = true;
          }
        }

        // If shift is no longer open, expire invitation
        if (shift.status !== 'open') {
          shouldExpire = true;
        }
      } else {
        // Shift was deleted, expire invitation
        shouldExpire = true;
      }

      if (shouldExpire) {
        await base44.asServiceRole.entities.ShiftInvitation.update(invitation.id, {
          status: 'expired',
          responded_at: new Date().toISOString()
        });

        expiredCount++;

        // Send notification to pharmacist
        try {
          await base44.asServiceRole.entities.Notification.create({
            from_email: 'system@pharmanet.ca',
            from_name: 'Pharmanet',
            to_email: invitation.pharmacist_email,
            to_name: invitation.pharmacist_name,
            notification_type: 'system_announcement',
            title: 'Invitation Expired',
            message: `Your invitation from ${invitation.employer_name} has expired.`,
            priority: 'low',
            icon: 'clock',
            related_entity_type: 'ShiftInvitation',
            related_entity_id: invitation.id
          });
        } catch (error) {
          console.error('Failed to create notification:', error);
        }
      }
    }

    return Response.json({
      success: true,
      expiredCount,
      message: `Expired ${expiredCount} invitation(s)`
    });

  } catch (error) {
    console.error('Error expiring invitations:', error);
    return Response.json({ 
      error: error.message || 'Failed to expire invitations' 
    }, { status: 500 });
  }
});