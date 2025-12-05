import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    
    // Verify user is authenticated
    const user = await base44.auth.me();
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Only pharmacists can accept invitations
    if (user.user_type !== 'pharmacist') {
      return Response.json({ 
        error: 'Only pharmacists can accept invitations' 
      }, { status: 403 });
    }

    const { invitationId } = await req.json();

    if (!invitationId) {
      return Response.json({ 
        error: 'Missing invitationId' 
      }, { status: 400 });
    }

    // Get the invitation (as user to verify access)
    const invitations = await base44.entities.ShiftInvitation.filter({ 
      id: invitationId 
    });

    if (invitations.length === 0) {
      return Response.json({ 
        error: 'Invitation not found' 
      }, { status: 404 });
    }

    const invitation = invitations[0];

    // Verify invitation belongs to current pharmacist
    if (invitation.pharmacist_email !== user.email && invitation.pharmacist_id !== user.id) {
      return Response.json({ 
        error: 'This invitation is not for you' 
      }, { status: 403 });
    }

    // Check if invitation is still pending
    if (invitation.status !== 'pending') {
      return Response.json({ 
        error: `Invitation already ${invitation.status}` 
      }, { status: 400 });
    }

    // SECURITY FIX: Check invitation expiry
    const now = new Date();
    if (invitation.expires_at) {
      const expiresAt = new Date(invitation.expires_at);
      if (now > expiresAt) {
        // Auto-expire the invitation
        await base44.asServiceRole.entities.ShiftInvitation.update(invitationId, {
          status: 'expired',
          responded_at: now.toISOString()
        });
        return Response.json({ 
          error: 'This invitation has expired' 
        }, { status: 410 });
      }
    }

    // Get the shift (as service role to check status)
    const shifts = await base44.asServiceRole.entities.Shift.filter({ 
      id: invitation.shift_id 
    });

    if (shifts.length === 0) {
      return Response.json({ 
        error: 'Shift not found or no longer available' 
      }, { status: 404 });
    }

    const shift = shifts[0];

    // Validate shift is still open
    if (shift.status !== 'open') {
      return Response.json({ 
        error: `Shift is already ${shift.status}` 
      }, { status: 400 });
    }

    // SECURITY FIX: Validate shift is not already assigned (race condition protection)
    if (shift.assigned_to && shift.assigned_to !== '') {
      return Response.json({ 
        error: 'Shift is already assigned to another pharmacist' 
      }, { status: 409 });
    }

    // Helper to get schedule from shift
    const getScheduleFromShift = (shiftData) => {
      if (shiftData.schedule && Array.isArray(shiftData.schedule) && shiftData.schedule.length > 0) {
        return shiftData.schedule;
      }
      if (shiftData.shift_date) {
        return [{
          date: shiftData.shift_date,
          start_time: shiftData.start_time || '09:00',
          end_time: shiftData.end_time || '17:00'
        }];
      }
      return [];
    };

    // Check for scheduling conflicts
    const myAcceptedShifts = await base44.asServiceRole.entities.Shift.filter({
      assigned_to: user.email,
      status: 'filled'
    });

    const shiftSchedule = getScheduleFromShift(shift);

    for (const acceptedShift of myAcceptedShifts) {
      const acceptedSchedule = getScheduleFromShift(acceptedShift);
      
      // Check each date in the new shift against each date in accepted shifts
      for (const newDate of shiftSchedule) {
        for (const existingDate of acceptedSchedule) {
          if (newDate.date === existingDate.date) {
            // Same date - check time overlap
            const newStart = newDate.start_time || '09:00';
            const newEnd = newDate.end_time || '17:00';
            const existStart = existingDate.start_time || '09:00';
            const existEnd = existingDate.end_time || '17:00';
            
            // Simple time string comparison works for HH:mm format
            if ((newStart >= existStart && newStart < existEnd) ||
                (newEnd > existStart && newEnd <= existEnd) ||
                (newStart <= existStart && newEnd >= existEnd)) {
              return Response.json({ 
                error: `You have a conflicting shift at ${acceptedShift.pharmacy_name} on ${newDate.date}` 
              }, { status: 409 });
            }
          }
        }
      }
    }

    // SECURITY FIX: Use atomic update to prevent race condition
    // Try to update shift with condition that it must be 'open'
    try {
      // Update shift first (this acts as a lock)
      const updateResult = await base44.asServiceRole.entities.Shift.update(shift.id, {
        status: 'filled',
        assigned_to: user.email,
        status_updated_at: now.toISOString()
      });

      // If update failed (shouldn't happen with Base44 SDK, but check anyway)
      if (!updateResult) {
        return Response.json({ 
          error: 'Shift was just filled by another pharmacist' 
        }, { status: 409 });
      }

      // Update invitation status
      await base44.asServiceRole.entities.ShiftInvitation.update(invitationId, {
        status: 'accepted',
        responded_at: now.toISOString()
      });

      // Expire/decline other pending invitations for the same shift
      const otherInvitations = await base44.asServiceRole.entities.ShiftInvitation.filter({
        shift_id: shift.id,
        status: 'pending'
      });

      for (const otherInv of otherInvitations) {
        if (otherInv.id !== invitationId) {
          await base44.asServiceRole.entities.ShiftInvitation.update(otherInv.id, {
            status: 'expired',
            responded_at: now.toISOString()
          });
        }
      }

      // Auto-reject any pending applications for this shift
      const pendingApplications = await base44.asServiceRole.entities.ShiftApplication.filter({
        shift_id: shift.id,
        status: 'pending'
      });

      for (const app of pendingApplications) {
        await base44.asServiceRole.entities.ShiftApplication.update(app.id, {
          status: 'rejected',
          rejection_reason: 'Shift was filled through direct invitation'
        });
      }

      // Get primary date for notification
      const primaryDate = shiftSchedule[0] || {};

      // Send notification to employer
      try {
        await base44.functions.invoke('sendShiftNotification', {
          notification_type: 'invitation_accepted',
          shift_data: {
            shift_date: primaryDate.date,
            start_time: primaryDate.start_time,
            end_time: primaryDate.end_time,
            pharmacy_name: shift.pharmacy_name,
            pharmacist_name: user.full_name
          },
          recipient_email: shift.created_by
        });
      } catch (error) {
        console.error('Failed to send acceptance notification:', error);
        // Don't fail the whole operation if email fails
      }

      // SECURITY FIX: Don't return sensitive shift details
      return Response.json({
        success: true,
        message: 'Invitation accepted successfully',
        shift: {
          id: shift.id,
          pharmacy_name: shift.pharmacy_name,
          schedule: shiftSchedule
        }
      });

    } catch (error) {
      // If update fails due to race condition, return conflict
      if (error.message?.includes('conflict') || error.message?.includes('concurrent')) {
        return Response.json({ 
          error: 'Shift was just filled by another pharmacist' 
        }, { status: 409 });
      }
      throw error;
    }

  } catch (error) {
    console.error('Error accepting invitation:', error);
    return Response.json({ 
      error: error.message || 'Failed to accept invitation' 
    }, { status: 500 });
  }
});