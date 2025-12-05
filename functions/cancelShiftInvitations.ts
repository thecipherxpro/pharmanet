import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    
    const user = await base44.auth.me();
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { shiftId, reason } = await req.json();

    if (!shiftId) {
      return Response.json({ error: 'Missing shiftId' }, { status: 400 });
    }

    // Get shift details
    const shifts = await base44.asServiceRole.entities.Shift.filter({ id: shiftId });
    
    if (shifts.length === 0) {
      return Response.json({ error: 'Shift not found' }, { status: 404 });
    }

    const shift = shifts[0];

    // Get all pending invitations for this shift
    const invitations = await base44.asServiceRole.entities.ShiftInvitation.filter({
      shift_id: shiftId,
      status: 'pending'
    });

    // Cancel each invitation
    for (const invitation of invitations) {
      await base44.asServiceRole.entities.ShiftInvitation.update(invitation.id, {
        status: 'cancelled',
        cancellation_reason: reason || 'Shift was deleted by employer',
        cancelled_by: 'system',
        responded_at: new Date().toISOString()
      });

      // Send notification to pharmacist
      try {
        await base44.asServiceRole.entities.Notification.create({
          from_email: user.email,
          from_name: user.full_name || 'Pharmanet',
          to_email: invitation.pharmacist_email,
          to_name: invitation.pharmacist_name,
          notification_type: 'shift_cancelled',
          title: 'Shift Invitation Cancelled',
          message: `The shift at ${shift.pharmacy_name} on ${shift.shift_date} has been removed. Your invitation is no longer valid.`,
          priority: 'high',
          icon: 'x',
          related_entity_type: 'ShiftInvitation',
          related_entity_id: invitation.id,
          shift_id: shiftId
        });
      } catch (error) {
        console.error('Failed to create notification:', error);
      }
    }

    // Get all pending applications
    const applications = await base44.asServiceRole.entities.ShiftApplication.filter({
      shift_id: shiftId,
      status: 'pending'
    });

    // Reject each application
    for (const application of applications) {
      await base44.asServiceRole.entities.ShiftApplication.update(application.id, {
        status: 'rejected',
        rejection_reason: 'Shift was deleted by employer'
      });

      // Send notification to pharmacist
      try {
        await base44.asServiceRole.entities.Notification.create({
          from_email: user.email,
          from_name: user.full_name || 'Pharmanet',
          to_email: application.pharmacist_email,
          to_name: application.pharmacist_name,
          notification_type: 'shift_cancelled',
          title: 'Shift No Longer Available',
          message: `The shift you applied to at ${shift.pharmacy_name} has been removed by the employer.`,
          priority: 'medium',
          icon: 'x',
          related_entity_type: 'ShiftApplication',
          related_entity_id: application.id,
          shift_id: shiftId
        });
      } catch (error) {
        console.error('Failed to create notification:', error);
      }
    }

    return Response.json({
      success: true,
      cancelledInvitations: invitations.length,
      rejectedApplications: applications.length
    });

  } catch (error) {
    console.error('Error cancelling shift invitations:', error);
    return Response.json({ 
      error: error.message || 'Failed to cancel invitations' 
    }, { status: 500 });
  }
});