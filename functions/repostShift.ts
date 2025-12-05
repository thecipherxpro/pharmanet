import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';

/**
 * Allows employers to repost cancelled or expired shifts with new date/time
 */

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);

    // Verify user is authenticated and is an employer
    const user = await base44.auth.me();
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (user.user_type !== 'employer' && user.role !== 'admin') {
      return Response.json({ 
        error: 'Only employers can repost shifts' 
      }, { status: 403 });
    }

    const { original_shift_id, new_date, new_start_time, new_end_time } = await req.json();

    // Validate inputs
    if (!original_shift_id || !new_date || !new_start_time || !new_end_time) {
      return Response.json({ 
        error: 'Missing required fields: original_shift_id, new_date, new_start_time, new_end_time' 
      }, { status: 400 });
    }

    // Fetch original shift
    const originalShifts = await base44.entities.Shift.filter({ id: original_shift_id });
    
    if (!originalShifts || originalShifts.length === 0) {
      return Response.json({ error: 'Original shift not found' }, { status: 404 });
    }

    const originalShift = originalShifts[0];

    // Verify ownership
    if (originalShift.created_by !== user.email && user.role !== 'admin') {
      return Response.json({ 
        error: 'You can only repost your own shifts' 
      }, { status: 403 });
    }

    // Verify shift is cancelled, completed, or closed
    if (!['cancelled', 'completed', 'closed'].includes(originalShift.status)) {
      return Response.json({ 
        error: 'Can only repost cancelled, completed, or closed shifts' 
      }, { status: 400 });
    }

    // Calculate new shift details
    const shiftDate = new Date(new_date);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const daysAhead = Math.ceil((shiftDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

    // Calculate rate based on urgency
    const { RateCalculator } = await import('../components/shift/RateCalculator.js');
    const { rate, urgency } = RateCalculator.calculateRate(daysAhead);

    // Calculate hours
    const [startHour, startMin] = new_start_time.split(':').map(Number);
    const [endHour, endMin] = new_end_time.split(':').map(Number);
    const totalHours = (endHour + endMin / 60) - (startHour + startMin / 60);

    // Create new shift (clone original with new details)
    // Use new schedule array structure
    const newShiftData = {
      // Copy from original
      employer_id: originalShift.employer_id || user.id,
      employer_email: originalShift.employer_email || user.email,
      pharmacy_id: originalShift.pharmacy_id,
      pharmacy_name: originalShift.pharmacy_name,
      pharmacy_address: originalShift.pharmacy_address,
      pharmacy_city: originalShift.pharmacy_city,
      pharmacy_province: originalShift.pharmacy_province,
      pharmacy_software: originalShift.pharmacy_software,
      title: originalShift.title,
      description: originalShift.description,
      shift_type: originalShift.shift_type,
      shift_includes: originalShift.shift_includes,
      requirements: originalShift.requirements,
      
      // New schedule structure (simple array)
      schedule: [{
        date: new_date,
        start_time: new_start_time,
        end_time: new_end_time
      }],
      
      // Pricing fields
      hourly_rate: rate,
      pricing_tier: urgency, // Ensure RateCalculator returns compatible value
      days_ahead: daysAhead,
      total_hours: totalHours,
      total_pay: rate * totalHours,
      
      // Reset status
      status: 'open',
      assigned_to: null,
      
      // Tracking
      reposted_from: original_shift_id
    };

    const newShift = await base44.entities.Shift.create(newShiftData);

    // Update original shift to mark it as reposted
    await base44.asServiceRole.entities.Shift.update(original_shift_id, {
      reposted_to: newShift.id,
      reposted_at: new Date().toISOString()
    });

    return Response.json({
      success: true,
      message: `Shift reposted successfully for ${new_date}`,
      new_shift_id: newShift.id,
      new_shift: newShift,
      original_shift_id: original_shift_id
    });

  } catch (error) {
    console.error('Error reposting shift:', error);
    return Response.json({ 
      error: 'Failed to repost shift',
      details: error.message 
    }, { status: 500 });
  }
});