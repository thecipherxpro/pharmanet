import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';

/**
 * Pharmacist checks out at shift end
 */

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    
    if (!user || user.user_type !== 'pharmacist') {
      return Response.json({ 
        error: 'Only pharmacists can check out' 
      }, { status: 403 });
    }

    const { shiftId, location, pharmacistSignature } = await req.json();

    if (!shiftId) {
      return Response.json({ error: 'Missing shiftId' }, { status: 400 });
    }

    // Get check-in record
    const checkIns = await base44.entities.ShiftCheckIn.filter({
      shift_id: shiftId,
      pharmacist_id: user.id
    });

    if (checkIns.length === 0) {
      return Response.json({ 
        error: 'No check-in found. Please check in first.' 
      }, { status: 400 });
    }

    const checkIn = checkIns[0];

    if (checkIn.check_out_time) {
      return Response.json({ 
        error: 'Already checked out' 
      }, { status: 400 });
    }

    // Calculate hours worked
    const checkInTime = new Date(checkIn.check_in_time);
    const checkOutTime = new Date();
    const hoursWorked = (checkOutTime - checkInTime) / (1000 * 60 * 60);

    // Update check-in with check-out info
    const updatedCheckIn = await base44.asServiceRole.entities.ShiftCheckIn.update(checkIn.id, {
      check_out_time: checkOutTime.toISOString(),
      check_out_location: location || null,
      total_hours_worked: Number(hoursWorked.toFixed(2)),
      pharmacist_signature: pharmacistSignature || null,
      status: 'checked_out'
    });

    // Update shift status to completed
    await base44.asServiceRole.entities.Shift.update(shiftId, {
      status: 'completed',
      completed_at: checkOutTime.toISOString()
    });

    // Notify employer to confirm hours
    const shift = await base44.asServiceRole.entities.Shift.filter({ id: shiftId });
    if (shift.length > 0) {
      try {
        await base44.asServiceRole.functions.invoke('triggerNotification', {
          from_email: user.email,
          from_name: user.full_name,
          to_email: shift[0].created_by,
          to_name: shift[0].created_by,
          notification_type: 'shift_completed',
          title: '🎉 Shift Completed',
          message: `${user.full_name} has completed the shift at ${shift[0].pharmacy_name}. Hours worked: ${hoursWorked.toFixed(2)}h. Please review and confirm.`,
          priority: 'high',
          action_url: `CompletedShiftDetails?id=${shiftId}`,
          action_text: 'Review & Sign',
          icon: 'check'
        });
      } catch (error) {
        console.error('Failed to notify employer:', error);
      }
    }

    return Response.json({
      success: true,
      checkIn: updatedCheckIn,
      hoursWorked: Number(hoursWorked.toFixed(2)),
      message: 'Checked out successfully'
    });

  } catch (error) {
    console.error('Check-out error:', error);
    return Response.json({ 
      error: error.message || 'Failed to check out' 
    }, { status: 500 });
  }
});