import { createClientFromRequest } from 'npm:@base44/sdk@0.7.1';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user || user.user_type !== 'employer') {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { pharmacistEmail } = await req.json();

    if (!pharmacistEmail) {
      return Response.json({ error: 'Pharmacist email required' }, { status: 400 });
    }

    // Check if employer has any relationship with this pharmacist
    // 1. Check if pharmacist applied to any of employer's shifts
    const employerShifts = await base44.entities.Shift.filter({ created_by: user.email });
    const shiftIds = employerShifts.map(s => s.id);

    const applications = await base44.entities.ShiftApplication.filter({
      pharmacist_email: pharmacistEmail
    });

    const hasRelationship = applications.some(app => shiftIds.includes(app.shift_id));

    return Response.json({ 
      hasAccess: hasRelationship,
      reason: hasRelationship ? 'pharmacist_applied' : 'no_relationship'
    });

  } catch (error) {
    console.error('Error verifying access:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});