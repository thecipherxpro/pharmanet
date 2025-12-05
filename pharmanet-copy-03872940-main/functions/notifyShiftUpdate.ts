import { createClientFromRequest } from 'npm:@base44/sdk@0.7.1';

/**
 * Send notifications for shift status updates
 * - Application accepted
 * - Application rejected
 * - Shift cancelled
 * - Shift reminder (day before)
 */
Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    
    const { 
      notification_type,
      shift_id,
      pharmacist_id,
      pharmacist_email,
      employer_id,
      additional_data = {}
    } = await req.json();

    if (!notification_type || !shift_id) {
      return Response.json({ 
        error: 'notification_type and shift_id are required' 
      }, { status: 400 });
    }

    // Get shift details
    const shifts = await base44.asServiceRole.entities.Shift.filter({ id: shift_id });
    if (!shifts || shifts.length === 0) {
      return Response.json({ error: 'Shift not found' }, { status: 404 });
    }

    const shift = shifts[0];

    console.log(`📬 [Shift Update] Type: ${notification_type} for shift ${shift_id}`);

    let title = '';
    let message = '';
    let icon = 'bell';
    let priority = 'medium';
    let actionUrl = '';
    let actionText = 'View Details';

    switch (notification_type) {
      case 'application_accepted':
        if (!pharmacist_id || !pharmacist_email) {
          return Response.json({ error: 'pharmacist_id and pharmacist_email required' }, { status: 400 });
        }

        title = '🎉 Application Accepted!';
        message = `Congratulations! Your application for ${shift.pharmacy_name} on ${shift.shift_date} has been accepted - $${shift.total_pay} total pay`;
        icon = 'check';
        priority = 'high';
        actionUrl = `/pharmacist-shift-details?id=${shift_id}`;
        actionText = 'View Shift Details';

        await base44.asServiceRole.functions.invoke('sendNotification', {
          user_id: pharmacist_id,
          user_email: pharmacist_email,
          title,
          message,
          type: 'application_accepted',
          priority,
          action_url: actionUrl,
          action_text: actionText,
          icon,
          metadata: {
            shift_id: shift_id,
            pharmacy_name: shift.pharmacy_name,
            shift_date: shift.shift_date,
            total_pay: shift.total_pay
          },
          send_push: true,
          send_email: true
        });

        console.log(`✅ Sent application accepted notification to ${pharmacist_email}`);
        break;

      case 'application_rejected':
        if (!pharmacist_id || !pharmacist_email) {
          return Response.json({ error: 'pharmacist_id and pharmacist_email required' }, { status: 400 });
        }

        title = 'Application Update';
        message = `Your application for ${shift.pharmacy_name} on ${shift.shift_date} was not selected. Keep applying - there are many more opportunities!`;
        icon = 'x';
        priority = 'low';
        actionUrl = '/browse-shifts';
        actionText = 'Browse More Shifts';

        await base44.asServiceRole.functions.invoke('sendNotification', {
          user_id: pharmacist_id,
          user_email: pharmacist_email,
          title,
          message,
          type: 'application_rejected',
          priority,
          action_url: actionUrl,
          action_text: actionText,
          icon,
          metadata: {
            shift_id: shift_id,
            pharmacy_name: shift.pharmacy_name,
            shift_date: shift.shift_date
          },
          send_push: true,
          send_email: false
        });

        console.log(`✅ Sent application rejected notification to ${pharmacist_email}`);
        break;

      case 'shift_cancelled':
        if (!pharmacist_id || !pharmacist_email) {
          return Response.json({ error: 'pharmacist_id and pharmacist_email required' }, { status: 400 });
        }

        const cancelReason = additional_data.cancel_reason || 'by the employer';

        title = '❌ Shift Cancelled';
        message = `Your shift at ${shift.pharmacy_name} on ${shift.shift_date} has been cancelled ${cancelReason}. You will not be charged.`;
        icon = 'x';
        priority = 'high';
        actionUrl = '/browse-shifts';
        actionText = 'Find Another Shift';

        await base44.asServiceRole.functions.invoke('sendNotification', {
          user_id: pharmacist_id,
          user_email: pharmacist_email,
          title,
          message,
          type: 'shift_cancelled',
          priority,
          action_url: actionUrl,
          action_text: actionText,
          icon,
          metadata: {
            shift_id: shift_id,
            pharmacy_name: shift.pharmacy_name,
            shift_date: shift.shift_date,
            cancel_reason: cancelReason
          },
          send_push: true,
          send_email: true
        });

        console.log(`✅ Sent shift cancelled notification to ${pharmacist_email}`);
        break;

      case 'shift_reminder':
        if (!pharmacist_id || !pharmacist_email) {
          return Response.json({ error: 'pharmacist_id and pharmacist_email required' }, { status: 400 });
        }

        title = '⏰ Shift Reminder';
        message = `Reminder: Your shift at ${shift.pharmacy_name} is tomorrow from ${shift.start_time} to ${shift.end_time}`;
        icon = 'clock';
        priority = 'high';
        actionUrl = `/pharmacist-shift-details?id=${shift_id}`;
        actionText = 'View Details';

        await base44.asServiceRole.functions.invoke('sendNotification', {
          user_id: pharmacist_id,
          user_email: pharmacist_email,
          title,
          message,
          type: 'shift_reminder',
          priority,
          action_url: actionUrl,
          action_text: actionText,
          icon,
          metadata: {
            shift_id: shift_id,
            pharmacy_name: shift.pharmacy_name,
            shift_date: shift.shift_date,
            start_time: shift.start_time,
            end_time: shift.end_time
          },
          send_push: true,
          send_email: true
        });

        console.log(`✅ Sent shift reminder to ${pharmacist_email}`);
        break;

      case 'new_application':
        if (!employer_id) {
          return Response.json({ error: 'employer_id required' }, { status: 400 });
        }

        // Get employer details
        const employers = await base44.asServiceRole.entities.User.filter({ id: employer_id });
        const employer = employers[0];

        if (!employer) {
          return Response.json({ error: 'Employer not found' }, { status: 404 });
        }

        const applicantName = additional_data.applicant_name || 'A pharmacist';

        title = '📬 New Application Received';
        message = `${applicantName} applied for your ${shift.pharmacy_name} shift on ${shift.shift_date}`;
        icon = 'user';
        priority = 'high';
        actionUrl = '/manage-applications';
        actionText = 'Review Application';

        await base44.asServiceRole.functions.invoke('sendNotification', {
          user_id: employer_id,
          user_email: employer.email,
          title,
          message,
          type: 'shift_application',
          priority,
          action_url: actionUrl,
          action_text: actionText,
          icon,
          metadata: {
            shift_id: shift_id,
            pharmacy_name: shift.pharmacy_name,
            shift_date: shift.shift_date,
            applicant_name: applicantName
          },
          send_push: true,
          send_email: false
        });

        console.log(`✅ Sent new application notification to employer ${employer.email}`);
        break;

      default:
        return Response.json({ error: 'Invalid notification_type' }, { status: 400 });
    }

    return Response.json({
      success: true,
      message: 'Notification sent successfully'
    });

  } catch (error) {
    console.error('❌ Error sending shift update notification:', error);
    return Response.json({ 
      error: error.message,
      success: false 
    }, { status: 500 });
  }
});