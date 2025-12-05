import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';

/**
 * Create a payment dispute for unfair charges
 */

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { 
      paymentId,
      paymentType,
      disputeType,
      amountDisputed,
      reason,
      evidenceUrls,
      shiftId,
      shiftDate,
      pharmacyName
    } = await req.json();

    if (!paymentId || !disputeType || !amountDisputed || !reason) {
      return Response.json({ 
        error: 'Missing required fields' 
      }, { status: 400 });
    }

    // Create dispute
    const dispute = await base44.entities.PaymentDispute.create({
      payment_id: paymentId,
      payment_type: paymentType,
      disputer_id: user.id,
      disputer_email: user.email,
      disputer_type: user.user_type,
      dispute_type: disputeType,
      amount_disputed: amountDisputed,
      reason: reason,
      evidence_urls: evidenceUrls || [],
      status: 'pending',
      shift_id: shiftId,
      shift_date: shiftDate,
      pharmacy_name: pharmacyName
    });

    // Notify admin
    try {
      await base44.asServiceRole.functions.invoke('triggerNotification', {
        from_email: user.email,
        from_name: user.full_name,
        to_email: 'admin@pharmanet.app', // Replace with actual admin email
        to_name: 'Admin',
        notification_type: 'system_announcement',
        title: '🚨 New Payment Dispute',
        message: `${user.full_name} (${user.user_type}) has opened a dispute for $${amountDisputed}: ${reason.substring(0, 100)}`,
        priority: 'urgent',
        action_url: 'AdminWallet',
        action_text: 'Review Dispute',
        icon: 'alert'
      });
    } catch (error) {
      console.error('Failed to notify admin:', error);
    }

    return Response.json({
      success: true,
      dispute: dispute,
      message: 'Dispute submitted successfully. Our team will review within 24-48 hours.'
    });

  } catch (error) {
    console.error('Dispute creation error:', error);
    return Response.json({ 
      error: error.message || 'Failed to create dispute' 
    }, { status: 500 });
  }
});