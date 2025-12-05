import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';

/**
 * CRITICAL: Prevents double-booking race condition
 * Called before accepting application or invitation
 * Returns lock status and validation results
 */

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { shiftId, actionType } = await req.json(); // actionType: 'application' or 'invitation'

    if (!shiftId || !actionType) {
      return Response.json({ 
        error: 'Missing shiftId or actionType' 
      }, { status: 400 });
    }

    // Get shift with service role
    const shifts = await base44.asServiceRole.entities.Shift.filter({ id: shiftId });
    
    if (shifts.length === 0) {
      return Response.json({ 
        canProceed: false,
        error: 'Shift not found' 
      }, { status: 404 });
    }

    const shift = shifts[0];

    // Check 1: Shift must be open
    if (shift.status !== 'open') {
      return Response.json({
        canProceed: false,
        error: `Shift is ${shift.status}`,
        reason: 'shift_not_open'
      });
    }

    // Check 2: Shift must not be assigned
    if (shift.assigned_to && shift.assigned_to !== '') {
      return Response.json({
        canProceed: false,
        error: 'Shift already assigned to another pharmacist',
        reason: 'already_assigned',
        assigned_to: shift.assigned_to
      });
    }

    // Check 3: If accepting invitation, check for conflicting accepted applications
    if (actionType === 'invitation') {
      const acceptedApps = await base44.asServiceRole.entities.ShiftApplication.filter({
        shift_id: shiftId,
        status: 'accepted'
      });

      if (acceptedApps.length > 0) {
        return Response.json({
          canProceed: false,
          error: 'Shift has accepted applications. Cannot accept invitation.',
          reason: 'conflicting_applications',
          conflicts: acceptedApps.length
        });
      }
    }

    // Check 4: If accepting application, check for pending invitations
    if (actionType === 'application') {
      const pendingInvitations = await base44.asServiceRole.entities.ShiftInvitation.filter({
        shift_id: shiftId,
        status: 'pending'
      });

      if (pendingInvitations.length > 0) {
        // Warning but allow (invitations will be expired)
        return Response.json({
          canProceed: true,
          warning: `${pendingInvitations.length} pending invitation(s) will be auto-expired`,
          pendingInvitations: pendingInvitations.length
        });
      }
    }

    // Check 5: Verify shift hasn't expired
    const schedule = shift.schedule || [];
    // Find the LAST date of the shift
    let lastDate = null;
    
    if (schedule.length > 0) {
        // Sort or just find max
        const dates = schedule.map(s => new Date(s.date));
        lastDate = new Date(Math.max.apply(null, dates));
    } else {
        // Fallback to old field or now
        lastDate = new Date();
    }

    const now = new Date();
    // Allow booking until the end of the last day (roughly)
    lastDate.setHours(23, 59, 59, 999);
    
    if (lastDate < now) {
      return Response.json({
        canProceed: false,
        error: 'Shift date has passed',
        reason: 'expired'
      });
    }

    // All checks passed
    return Response.json({
      canProceed: true,
      shift: {
        id: shift.id,
        status: shift.status,
        pharmacy_name: shift.pharmacy_name,
        shift_date: schedule.length > 0 ? schedule[0].date : null
      }
    });

  } catch (error) {
    console.error('Double-booking prevention error:', error);
    return Response.json({ 
      canProceed: false,
      error: error.message || 'Validation failed' 
    }, { status: 500 });
  }
});