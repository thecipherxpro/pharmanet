import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';

/**
 * Pharmacist checks in at shift start
 */

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    
    if (!user || user.user_type !== 'pharmacist') {
      return Response.json({ 
        error: 'Only pharmacists can check in' 
      }, { status: 403 });
    }

    const { shiftId, location, notes } = await req.json();

    if (!shiftId) {
      return Response.json({ error: 'Missing shiftId' }, { status: 400 });
    }

    // Get shift
    const shifts = await base44.entities.Shift.filter({ id: shiftId });
    
    if (shifts.length === 0) {
      return Response.json({ error: 'Shift not found' }, { status: 404 });
    }

    const shift = shifts[0];

    // Verify assignment
    if (shift.assigned_to !== user.email) {
      return Response.json({ 
        error: 'You are not assigned to this shift' 
      }, { status: 403 });
    }

    // Check if already checked in
    const existingCheckIns = await base44.entities.ShiftCheckIn.filter({
      shift_id: shiftId,
      pharmacist_id: user.id
    });

    if (existingCheckIns.length > 0) {
      return Response.json({ 
        error: 'Already checked in to this shift' 
      }, { status: 400 });
    }

    // Get employer ID
    const employerUsers = await base44.asServiceRole.entities.User.filter({
      email: shift.created_by
    });
    const employerUserId = employerUsers.length > 0 ? employerUsers[0].id : null;

    // Determine primary shift date (first date in schedule)
    const schedule = shift.schedule || [];
    const primaryDate = schedule.length > 0 ? schedule[0].date : new Date().toISOString().split('T')[0];

    // Create check-in
    const checkIn = await base44.entities.ShiftCheckIn.create({
      shift_id: shiftId,
      pharmacist_id: user.id,
      pharmacist_email: user.email,
      employer_id: employerUserId,
      check_in_time: new Date().toISOString(),
      check_in_location: location || null,
      notes: notes || null,
      status: 'checked_in',
      pharmacy_name: shift.pharmacy_name,
      shift_date: primaryDate
    });

    // Notify employer
    try {
      await base44.asServiceRole.functions.invoke('triggerNotification', {
        from_email: user.email,
        from_name: user.full_name,
        to_email: shift.created_by,
        to_name: shift.created_by,
        notification_type: 'shift_application_received',
        title: '✅ Pharmacist Checked In',
        message: `${user.full_name} has checked in at ${shift.pharmacy_name}`,
        priority: 'high',
        icon: 'check'
      });
    } catch (error) {
      console.error('Failed to notify employer:', error);
    }

    return Response.json({
      success: true,
      checkIn: checkIn,
      message: 'Checked in successfully'
    });

  } catch (error) {
    console.error('Check-in error:', error);
    return Response.json({ 
      error: error.message || 'Failed to check in' 
    }, { status: 500 });
  }
});