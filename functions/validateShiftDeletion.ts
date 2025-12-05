import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    
    const user = await base44.auth.me();
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { shiftId } = await req.json();

    if (!shiftId) {
      return Response.json({ error: 'Missing shiftId' }, { status: 400 });
    }

    // Get shift details
    const shifts = await base44.asServiceRole.entities.Shift.filter({ id: shiftId });
    
    if (shifts.length === 0) {
      return Response.json({ error: 'Shift not found' }, { status: 404 });
    }

    const shift = shifts[0];

    // Verify user owns the shift
    if (shift.created_by !== user.email && user.role !== 'admin') {
      return Response.json({ error: 'Unauthorized to delete this shift' }, { status: 403 });
    }

    // Check if shift is filled
    if (shift.status === 'filled') {
      return Response.json({
        canDelete: false,
        error: 'Cannot delete a filled shift. Please cancel it first.',
        warnings: ['This shift has been assigned to a pharmacist']
      });
    }

    // Get pending invitations
    const invitations = await base44.asServiceRole.entities.ShiftInvitation.filter({
      shift_id: shiftId,
      status: 'pending'
    });

    // Get pending applications
    const applications = await base44.asServiceRole.entities.ShiftApplication.filter({
      shift_id: shiftId,
      status: 'pending'
    });

    // Check if shift is in the past
    const schedule = shift.schedule || [];
    const primaryDateStr = schedule.length > 0 ? schedule[0].date : new Date().toISOString().split('T')[0];
    const primaryStart = schedule.length > 0 ? schedule[0].start_time : '09:00';
    
    const shiftDate = new Date(`${primaryDateStr}T${primaryStart}`);
    const now = new Date();
    const isPast = shiftDate < now;

    // Build warnings
    const warnings = [];
    
    if (invitations.length > 0) {
      warnings.push(`${invitations.length} pending invitation${invitations.length > 1 ? 's' : ''} will be cancelled`);
    }
    
    if (applications.length > 0) {
      warnings.push(`${applications.length} pending application${applications.length > 1 ? 's' : ''} will be rejected`);
    }

    // Check shift timing
    const hoursUntilShift = (shiftDate.getTime() - now.getTime()) / (1000 * 60 * 60);
    if (hoursUntilShift > 0 && hoursUntilShift < 24) {
      warnings.push(`⚠️ This shift is in ${Math.floor(hoursUntilShift)} hours - urgent deletion`);
    }

    if (isPast) {
      warnings.push('This shift is in the past');
    }

    return Response.json({
      canDelete: true,
      warnings,
      invitationCount: invitations.length,
      applicationCount: applications.length,
      invitations: invitations.map(inv => ({
        id: inv.id,
        pharmacist_name: inv.pharmacist_name,
        pharmacist_email: inv.pharmacist_email,
        invited_at: inv.invited_at
      })),
      applications: applications.map(app => ({
        id: app.id,
        pharmacist_name: app.pharmacist_name,
        pharmacist_email: app.pharmacist_email,
        applied_date: app.applied_date
      }))
    });

  } catch (error) {
    console.error('Error validating shift deletion:', error);
    return Response.json({ 
      error: error.message || 'Failed to validate shift deletion' 
    }, { status: 500 });
  }
});