import { createClientFromRequest } from 'npm:@base44/sdk@0.7.1';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user || user.user_type !== 'employer') {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { pharmacistId } = await req.json();

    if (!pharmacistId) {
      return Response.json({ error: 'Pharmacist ID required' }, { status: 400 });
    }

    // Get the pharmacist's email
    const users = await base44.asServiceRole.entities.User.list();
    const pharmacist = users.find(u => u.id === pharmacistId);
    
    if (!pharmacist) {
      return Response.json({ 
        hasRelationship: false,
        reason: 'pharmacist_not_found'
      });
    }

    // Check if employer has any shifts with this pharmacist
    // 1. Get all employer's shifts
    const employerShifts = await base44.entities.Shift.filter({ 
      created_by: user.email 
    });
    
    const shiftIds = employerShifts.map(s => s.id);

    if (shiftIds.length === 0) {
      return Response.json({ 
        hasRelationship: false,
        reason: 'no_shifts'
      });
    }

    // 2. Check for accepted applications from this pharmacist to any of these shifts
    const acceptedApplications = await base44.asServiceRole.entities.ShiftApplication.filter({
      pharmacist_email: pharmacist.email,
      status: 'accepted'
    });

    // 3. Check if any accepted application is for one of the employer's shifts
    const hasRelationship = acceptedApplications.some(app => 
      shiftIds.includes(app.shift_id)
    );

    return Response.json({ 
      hasRelationship,
      reason: hasRelationship ? 'accepted_shift_exists' : 'no_accepted_shifts'
    });

  } catch (error) {
    console.error('Error verifying relationship:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});