import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';
import Stripe from 'npm:stripe@14.11.0';

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY'), {
  apiVersion: '2023-10-16',
});

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user || user.user_type !== 'employer') {
      return Response.json({ error: 'Unauthorized - Employer only' }, { status: 401 });
    }

    const { shiftId, cancelledAt, reason } = await req.json();

    if (!shiftId || !cancelledAt) {
      return Response.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Get shift details
    const shifts = await base44.entities.Shift.filter({ id: shiftId, created_by: user.email });
    if (shifts.length === 0) {
      return Response.json({ error: 'Shift not found or unauthorized' }, { status: 404 });
    }

    const shift = shifts[0];

    // Verify shift is in 'filled' status
    if (shift.status !== 'filled') {
      return Response.json({ error: 'Can only cancel filled shifts' }, { status: 400 });
    }

    // Get pharmacist details
    const pharmacistUsers = await base44.asServiceRole.entities.User.filter({ 
      email: shift.assigned_to 
    });
    const pharmacistUserId = pharmacistUsers.length > 0 ? pharmacistUsers[0].id : null;
    const pharmacistName = pharmacistUsers.length > 0 ? pharmacistUsers[0].full_name : 'Pharmacist';

    // Calculate hours before shift start
    // Find the earliest start time from schedule
    const schedule = shift.schedule || [];
    let earliestStart = null;
    let primaryDate = '';

    if (schedule.length > 0) {
        // Sort to find earliest
        const sortedSchedule = [...schedule].sort((a, b) => {
            const dateA = new Date(a.date + 'T' + a.start_time);
            const dateB = new Date(b.date + 'T' + b.start_time);
            return dateA - dateB;
        });
        const firstSession = sortedSchedule[0];
        earliestStart = new Date(firstSession.date + 'T' + firstSession.start_time);
        primaryDate = firstSession.date;
    } else {
        earliestStart = new Date();
        primaryDate = new Date().toISOString().split('T')[0];
    }

    const cancelDateTime = new Date(cancelledAt);
    const hoursBeforeStart = Math.floor((earliestStart - cancelDateTime) / (1000 * 60 * 60));

    // Calculate penalty based on cancellation timeline (SAME AS PHARMACIST)
    let penaltyTotal = 0;
    let penaltyPharmacistShare = 0;
    let penaltyAppShare = 0;

    if (hoursBeforeStart >= 120) {
      // 5+ days before: No penalty
      penaltyTotal = 0;
      penaltyPharmacistShare = 0;
      penaltyAppShare = 0;
    } else if (hoursBeforeStart >= 72) {
      // 3-5 days before: $50 total
      penaltyTotal = 50;
      penaltyPharmacistShare = 0;
      penaltyAppShare = 50;
    } else if (hoursBeforeStart >= 48) {
      // 2-3 days before: $100 total
      penaltyTotal = 100;
      penaltyPharmacistShare = 50;
      penaltyAppShare = 50;
    } else if (hoursBeforeStart >= 24) {
      // 1-2 days before: $150 total
      penaltyTotal = 150;
      penaltyPharmacistShare = 80;
      penaltyAppShare = 70;
    } else {
      // Less than 24 hours: $300 total
      penaltyTotal = 300;
      penaltyPharmacistShare = 200;
      penaltyAppShare = 100;
    }

    let stripePaymentId = null;
    let status = 'waived';

    // Charge employer if penalty applies
    if (penaltyTotal > 0) {
      // Get employer's default card
      const cards = await base44.entities.WalletCard.filter({ 
        user_id: user.id, 
        is_default: true 
      });

      if (cards.length === 0) {
        return Response.json({ 
          error: 'No default payment card found. Please add a card to your wallet before canceling.' 
        }, { status: 400 });
      }

      const defaultCard = cards[0];

      try {
        // Create Stripe payment intent
        const paymentIntent = await stripe.paymentIntents.create({
          amount: Math.round(penaltyTotal * 100), // Convert to cents
          currency: 'cad',
          customer: defaultCard.stripe_customer_id,
          payment_method: defaultCard.stripe_payment_method_id,
          off_session: true,
          confirm: true,
          description: `Employer cancellation penalty for shift at ${shift.pharmacy_name} on ${primaryDate}`,
          metadata: {
            shift_id: shiftId,
            employer_id: user.id,
            pharmacist_id: pharmacistUserId || 'unknown',
            penalty_type: 'employer_shift_cancellation'
          }
        });

        stripePaymentId = paymentIntent.id;
        status = 'charged';
      } catch (error) {
        console.error('Stripe charge failed:', error);
        return Response.json({ 
          error: `Payment failed: ${error.message}. Please update your payment method and try again.` 
        }, { status: 402 });
      }
    }

    // Record employer payment
    await base44.asServiceRole.entities.EmployerPayment.create({
      employer_id: user.id,
      pharmacist_id: pharmacistUserId,
      shift_id: shiftId,
      amount: penaltyTotal,
      type: 'cancellation_penalty',
      status: status,
      stripe_payment_id: stripePaymentId,
      description: `Cancellation penalty - ${hoursBeforeStart}h notice`,
      pharmacist_name: pharmacistName,
      shift_date: primaryDate,
      pharmacy_name: shift.pharmacy_name
    });

    // Update shift status to cancelled
    await base44.asServiceRole.entities.Shift.update(shiftId, {
      status: 'cancelled',
      assigned_to: null,
      cancelled_at: cancelledAt,
      cancelled_reason: reason || 'Cancelled by employer'
    });

    // Update application status to withdrawn
    if (shift.assigned_to) {
      const applications = await base44.entities.ShiftApplication.filter({
        shift_id: shiftId,
        pharmacist_email: shift.assigned_to,
        status: 'accepted'
      });

      if (applications.length > 0) {
        await base44.asServiceRole.entities.ShiftApplication.update(applications[0].id, {
          status: 'withdrawn'
        });
      }
    }

    // Send notification to pharmacist if assigned
    if (shift.assigned_to && pharmacistUserId) {
      try {
        await base44.functions.invoke('triggerNotification', {
          from_email: user.email,
          from_name: user.full_name || user.company_name || 'Employer',
          to_email: shift.assigned_to,
          to_name: pharmacistName,
          notification_type: 'shift_cancelled',
          title: 'Shift Cancelled by Employer',
          message: `Your shift at ${shift.pharmacy_name} on ${primaryDate} has been cancelled by the employer. ${penaltyPharmacistShare > 0 ? `You will receive $${penaltyPharmacistShare.toFixed(2)} compensation.` : ''}`,
          priority: 'high',
          action_url: '/my-schedule',
          action_text: 'View Schedule',
          icon: 'x',
          shift_id: shiftId,
          metadata: {
            compensation: penaltyPharmacistShare,
            hours_notice: hoursBeforeStart
          }
        });
      } catch (error) {
        console.error('Failed to send notification:', error);
      }
    }

    return Response.json({
      success: true,
      message: penaltyTotal > 0 
        ? `Shift cancelled. Cancellation fee of $${penaltyTotal.toFixed(2)} has been charged. ${penaltyPharmacistShare > 0 ? `$${penaltyPharmacistShare.toFixed(2)} will be paid to the pharmacist.` : ''}`
        : 'Shift cancelled successfully with no penalty.',
      cancellation: {
        totalPenalty: penaltyTotal,
        pharmacistShare: penaltyPharmacistShare,
        appShare: penaltyAppShare,
        hoursBeforeStart: hoursBeforeStart,
        status: status
      }
    });

  } catch (error) {
    console.error('Employer cancellation error:', error);
    return Response.json({ 
      error: error.message || 'Failed to process cancellation' 
    }, { status: 500 });
  }
});