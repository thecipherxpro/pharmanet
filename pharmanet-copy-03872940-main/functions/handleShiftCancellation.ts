import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';
import Stripe from 'npm:stripe@14.11.0';

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY'), {
  apiVersion: '2023-10-16',
});

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user || user.user_type !== 'pharmacist') {
      return Response.json({ error: 'Unauthorized - Pharmacist only' }, { status: 401 });
    }

    const { shiftId, cancelledAt } = await req.json();

    if (!shiftId || !cancelledAt) {
      return Response.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Get shift details
    const shifts = await base44.entities.Shift.filter({ id: shiftId });
    if (shifts.length === 0) {
      return Response.json({ error: 'Shift not found' }, { status: 404 });
    }

    const shift = shifts[0];

    // Verify pharmacist is assigned to this shift
    if (shift.assigned_to !== user.email) {
      return Response.json({ error: 'Not authorized for this shift' }, { status: 403 });
    }

    // Verify shift is in 'filled' status
    if (shift.status !== 'filled') {
      return Response.json({ error: 'Shift must be in filled status to cancel' }, { status: 400 });
    }

    // Get employer user details to get their ID
    const employerUsers = await base44.asServiceRole.entities.User.filter({ 
      email: shift.created_by 
    });
    const employerUserId = employerUsers.length > 0 ? employerUsers[0].id : shift.created_by;

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
        // Fallback (shouldn't happen with valid shifts)
        earliestStart = new Date();
        primaryDate = new Date().toISOString().split('T')[0];
    }

    const cancelDateTime = new Date(cancelledAt);
    const hoursBeforeStart = Math.floor((earliestStart - cancelDateTime) / (1000 * 60 * 60));

    // Calculate penalty based on cancellation timeline
    let penaltyTotal = 0;
    let penaltyEmployerShare = 0;
    let penaltyAppShare = 0;

    if (hoursBeforeStart >= 120) {
      // 5+ days before: No penalty
      penaltyTotal = 0;
      penaltyEmployerShare = 0;
      penaltyAppShare = 0;
    } else if (hoursBeforeStart >= 72) {
      // 3-5 days before: $50 total
      penaltyTotal = 50;
      penaltyEmployerShare = 0;
      penaltyAppShare = 50;
    } else if (hoursBeforeStart >= 48) {
      // 2-3 days before: $100 total
      penaltyTotal = 100;
      penaltyEmployerShare = 50;
      penaltyAppShare = 50;
    } else if (hoursBeforeStart >= 24) {
      // 1-2 days before: $150 total
      penaltyTotal = 150;
      penaltyEmployerShare = 80;
      penaltyAppShare = 70;
    } else {
      // Less than 24 hours: $300 total
      penaltyTotal = 300;
      penaltyEmployerShare = 200;
      penaltyAppShare = 100;
    }

    let stripePaymentId = null;
    let status = 'waived';

    // Charge pharmacist if penalty applies
    if (penaltyTotal > 0) {
      // Get pharmacist's default card
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
          description: `Cancellation penalty for shift at ${shift.pharmacy_name} on ${primaryDate}`,
          metadata: {
            shift_id: shiftId,
            pharmacist_id: user.id,
            employer_id: employerUserId,
            penalty_type: 'shift_cancellation'
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

    // Record cancellation in database with BOTH email and ID for employer
    const cancellation = await base44.asServiceRole.entities.ShiftCancellation.create({
      shift_id: shiftId,
      pharmacist_id: user.id,
      employer_id: shift.created_by,
      employer_user_id: employerUserId,
      cancelled_at: cancelledAt,
      hours_before_start: hoursBeforeStart,
      penalty_total: penaltyTotal,
      penalty_employer_share: penaltyEmployerShare,
      penalty_app_share: penaltyAppShare,
      stripe_payment_id: stripePaymentId,
      status: status,
      shift_date: primaryDate,
      pharmacy_name: shift.pharmacy_name
    });

    // Update shift status to cancelled
    await base44.asServiceRole.entities.Shift.update(shiftId, {
      status: 'cancelled',
      assigned_to: null
    });

    // Update application status to withdrawn
    const applications = await base44.entities.ShiftApplication.filter({
      shift_id: shiftId,
      pharmacist_email: user.email,
      status: 'accepted'
    });

    if (applications.length > 0) {
      await base44.asServiceRole.entities.ShiftApplication.update(applications[0].id, {
        status: 'withdrawn'
      });
    }

    // Send notification to employer
    try {
      await base44.functions.invoke('sendShiftNotification', {
        notification_type: 'shift_cancelled_by_pharmacist',
        shift_data: {
          shift_date: primaryDate,
          // Use info from first session for notification
          start_time: schedule.length > 0 ? schedule[0].start_time : 'N/A',
          end_time: schedule.length > 0 ? schedule[0].end_time : 'N/A',
          pharmacy_name: shift.pharmacy_name,
          pharmacist_name: user.full_name,
          hours_before_start: hoursBeforeStart,
          penalty_employer_share: penaltyEmployerShare
        },
        recipient_email: shift.created_by
      });
    } catch (error) {
      console.error('Failed to send cancellation email:', error);
    }

    return Response.json({
      success: true,
      message: penaltyTotal > 0 
        ? `Shift cancelled. Cancellation fee of $${penaltyTotal.toFixed(2)} has been charged.`
        : 'Shift cancelled successfully with no penalty.',
      cancellation: {
        id: cancellation.id,
        totalPenalty: penaltyTotal,
        employerShare: penaltyEmployerShare,
        appShare: penaltyAppShare,
        hoursBeforeStart: hoursBeforeStart,
        status: status
      }
    });

  } catch (error) {
    console.error('Cancellation error:', error);
    return Response.json({ 
      error: error.message || 'Failed to process cancellation' 
    }, { status: 500 });
  }
});