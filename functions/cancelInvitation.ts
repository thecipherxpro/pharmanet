import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    
    const user = await base44.auth.me();
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { invitationId, reason } = await req.json();

    if (!invitationId) {
      return Response.json({ error: 'Missing invitationId' }, { status: 400 });
    }

    // Get invitation
    const invitations = await base44.entities.ShiftInvitation.filter({ id: invitationId });
    
    if (invitations.length === 0) {
      return Response.json({ error: 'Invitation not found' }, { status: 404 });
    }

    const invitation = invitations[0];

    // Verify user is the employer who sent it
    if (invitation.employer_email !== user.email && user.role !== 'admin') {
      return Response.json({ error: 'Unauthorized to cancel this invitation' }, { status: 403 });
    }

    // Check if already responded
    if (invitation.status !== 'pending') {
      return Response.json({ 
        error: `Cannot cancel invitation that is already ${invitation.status}` 
      }, { status: 400 });
    }

    // Get shift details for notification
    const shifts = await base44.asServiceRole.entities.Shift.filter({ 
      id: invitation.shift_id 
    });
    const shift = shifts[0];

    // Cancel the invitation
    await base44.asServiceRole.entities.ShiftInvitation.update(invitationId, {
      status: 'cancelled',
      cancellation_reason: reason || 'Cancelled by employer',
      cancelled_by: 'employer',
      responded_at: new Date().toISOString()
    });

    // Get primary date from schedule array
    const getScheduleFromShift = (shiftData) => {
      if (shiftData.schedule && Array.isArray(shiftData.schedule) && shiftData.schedule.length > 0) {
        return shiftData.schedule;
      }
      if (shiftData.shift_date) {
        return [{ date: shiftData.shift_date }];
      }
      return [];
    };
    const schedule = getScheduleFromShift(shift);
    const primaryDate = schedule[0]?.date || 'N/A';

    // Send notification to pharmacist
    try {
      await base44.asServiceRole.entities.Notification.create({
        from_email: user.email,
        from_name: user.full_name || 'Pharmanet',
        to_email: invitation.pharmacist_email,
        to_name: invitation.pharmacist_name,
        notification_type: 'shift_invitation_declined',
        title: 'Invitation Cancelled',
        message: `The employer has cancelled your invitation to work at ${shift.pharmacy_name} on ${primaryDate}.`,
        priority: 'medium',
        icon: 'x',
        related_entity_type: 'ShiftInvitation',
        related_entity_id: invitationId,
        invitation_id: invitationId,
        shift_id: invitation.shift_id
      });
    } catch (error) {
      console.error('Failed to create notification:', error);
    }

    return Response.json({
      success: true,
      message: 'Invitation cancelled successfully'
    });

  } catch (error) {
    console.error('Error cancelling invitation:', error);
    return Response.json({ 
      error: error.message || 'Failed to cancel invitation' 
    }, { status: 500 });
  }
});