import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';

/**
 * Pharmacist requests coverage for accepted shift
 */

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    
    if (!user || user.user_type !== 'pharmacist') {
      return Response.json({ 
        error: 'Only pharmacists can request coverage' 
      }, { status: 403 });
    }

    const { shiftId, reason, urgencyLevel } = await req.json();

    if (!shiftId || !reason) {
      return Response.json({ 
        error: 'Missing shiftId or reason' 
      }, { status: 400 });
    }

    // Get shift
    const shifts = await base44.entities.Shift.filter({ id: shiftId });
    
    if (shifts.length === 0) {
      return Response.json({ error: 'Shift not found' }, { status: 404 });
    }

    const shift = shifts[0];

    // Verify pharmacist is assigned
    if (shift.assigned_to !== user.email) {
      return Response.json({ 
        error: 'You are not assigned to this shift' 
      }, { status: 403 });
    }

    // Check if coverage request already exists
    const existingRequests = await base44.entities.ShiftCoverageRequest.filter({
      shift_id: shiftId,
      status: 'open'
    });

    if (existingRequests.length > 0) {
      return Response.json({ 
        error: 'Coverage request already exists for this shift' 
      }, { status: 400 });
    }

    // Get employer details
    const employerUsers = await base44.asServiceRole.entities.User.filter({
      email: shift.created_by
    });
    const employerUserId = employerUsers.length > 0 ? employerUsers[0].id : shift.created_by;

    // Create coverage request
    const coverageRequest = await base44.entities.ShiftCoverageRequest.create({
      shift_id: shiftId,
      original_pharmacist_id: user.id,
      original_pharmacist_email: user.email,
      original_pharmacist_name: user.full_name,
      employer_id: employerUserId,
      employer_email: shift.created_by,
      reason: reason,
      status: 'open',
      pharmacy_name: shift.pharmacy_name,
      shift_date: shift.shift_date,
      start_time: shift.start_time,
      end_time: shift.end_time,
      urgency_level: urgencyLevel || 'medium'
    });

    // Notify other pharmacists in area
    try {
      const allPharmacists = await base44.asServiceRole.entities.User.filter({
        user_type: 'pharmacist'
      });

      for (const pharmacist of allPharmacists) {
        if (pharmacist.id !== user.id) {
          await base44.asServiceRole.functions.invoke('triggerNotification', {
            from_email: user.email,
            from_name: user.full_name,
            to_email: pharmacist.email,
            to_name: pharmacist.full_name,
            notification_type: 'shift_posted',
            title: '🆘 Coverage Needed',
            message: `${user.full_name} needs coverage for ${shift.pharmacy_name} on ${shift.shift_date}. ${urgencyLevel === 'emergency' ? '⚠️ URGENT!' : ''}`,
            priority: urgencyLevel === 'emergency' ? 'urgent' : 'high',
            action_url: `BrowseShifts`,
            action_text: 'Offer Coverage',
            icon: 'calendar'
          });
        }
      }
    } catch (error) {
      console.error('Failed to notify pharmacists:', error);
    }

    return Response.json({
      success: true,
      coverageRequest: coverageRequest,
      message: 'Coverage request posted. Nearby pharmacists have been notified.'
    });

  } catch (error) {
    console.error('Coverage request error:', error);
    return Response.json({ 
      error: error.message || 'Failed to request coverage' 
    }, { status: 500 });
  }
});