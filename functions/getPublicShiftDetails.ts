import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    
    // Parse shift_id from query params or body
    const url = new URL(req.url);
    let shift_id = url.searchParams.get('shift_id');
    
    if (!shift_id) {
      const body = await req.json().catch(() => ({}));
      shift_id = body.shift_id;
    }

    if (!shift_id) {
      return Response.json({ error: 'Shift ID required' }, { status: 400 });
    }

    // Use service role to fetch shift (public access)
    const shifts = await base44.asServiceRole.entities.Shift.filter({ id: shift_id });
    
    if (!shifts || shifts.length === 0) {
      return Response.json({ error: 'Shift not found' }, { status: 404 });
    }

    const shift = shifts[0];

    // Only return shifts that are open or filled (not cancelled/closed)
    if (shift.status === 'cancelled') {
      return Response.json({ error: 'This shift is no longer available' }, { status: 404 });
    }

    // Return sanitized shift data for public viewing
    return Response.json({
      success: true,
      shift: {
        id: shift.id,
        title: shift.title,
        description: shift.description,
        pharmacy_name: shift.pharmacy_name,
        pharmacy_address: shift.pharmacy_address,
        pharmacy_city: shift.pharmacy_city,
        pharmacy_province: shift.pharmacy_province,
        pharmacy_software: shift.pharmacy_software,
        shift_type: shift.shift_type,
        schedule: shift.schedule,
        hourly_rate: shift.hourly_rate,
        total_hours: shift.total_hours,
        total_pay: shift.total_pay,
        pricing_tier: shift.pricing_tier,
        days_ahead: shift.days_ahead,
        shift_includes: shift.shift_includes,
        requirements: shift.requirements,
        status: shift.status,
        is_multi_date: shift.is_multi_date,
        created_date: shift.created_date
      }
    });

  } catch (error) {
    console.error('Error fetching public shift details:', error);
    return Response.json({ 
      error: error.message || 'Failed to fetch shift details' 
    }, { status: 500 });
  }
});