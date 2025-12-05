import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { shift_id } = await req.json();

    if (!shift_id) {
      return Response.json({ error: 'Shift ID required' }, { status: 400 });
    }

    // Verify shift exists and user has access
    const shifts = await base44.entities.Shift.filter({ id: shift_id });
    
    if (!shifts || shifts.length === 0) {
      return Response.json({ error: 'Shift not found' }, { status: 404 });
    }

    const shift = shifts[0];

    // Verify ownership (employers can share their own shifts, admins can share any)
    if (shift.created_by !== user.email && user.role !== 'admin') {
      return Response.json({ error: 'You do not have permission to share this shift' }, { status: 403 });
    }

    // Use hardcoded production domain
    const publicDomain = 'https://shifts.pharmanet.ca';
    const shareUrl = `${publicDomain}/PublicShift?id=${shift_id}`;

    return Response.json({
      success: true,
      share_url: shareUrl,
      shift: {
        id: shift.id,
        title: shift.title,
        pharmacy_name: shift.pharmacy_name,
        // Always use shift_dates array
        shift_dates: shift.shift_dates,
        primary_date: shift.shift_dates?.[0]?.date || null
      }
    });

  } catch (error) {
    console.error('Error generating share link:', error);
    return Response.json({ 
      error: error.message || 'Failed to generate share link' 
    }, { status: 500 });
  }
});