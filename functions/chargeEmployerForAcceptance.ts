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

    const { shiftId, pharmacistId, pharmacistName } = await req.json();

    if (!shiftId || !pharmacistId) {
      return Response.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Get shift details
    const shifts = await base44.entities.Shift.filter({ id: shiftId, created_by: user.email });
    if (shifts.length === 0) {
      return Response.json({ error: 'Shift not found or unauthorized' }, { status: 404 });
    }

    const shift = shifts[0];

    // Get employer's default card
    const cards = await base44.entities.WalletCard.filter({ 
      user_id: user.id, 
      is_default: true 
    });

    if (cards.length === 0) {
      return Response.json({ 
        error: 'No default payment card found. Please add a card to your wallet before accepting pharmacists.' 
      }, { status: 400 });
    }

    const defaultCard = cards[0];

    let stripePaymentId = null;
    let status = 'failed';

    try {
      // Create Stripe payment intent for $50 acceptance fee
      const paymentIntent = await stripe.paymentIntents.create({
        amount: 5000, // $50.00 in cents
        currency: 'cad',
        customer: defaultCard.stripe_customer_id,
        payment_method: defaultCard.stripe_payment_method_id,
        off_session: true,
        confirm: true,
        description: `Shift acceptance fee for ${pharmacistName || 'pharmacist'} - ${shift.pharmacy_name}`,
        metadata: {
          shift_id: shiftId,
          employer_id: user.id,
          pharmacist_id: pharmacistId,
          payment_type: 'acceptance_fee'
        }
      });

      stripePaymentId = paymentIntent.id;
      status = 'charged';
    } catch (error) {
      console.error('Stripe charge failed:', error);
      return Response.json({ 
        error: `Payment failed: ${error.message}. Please update your payment method and try again.`,
        paymentRequired: true
      }, { status: 402 });
    }

    // Record payment in database
    const payment = await base44.asServiceRole.entities.EmployerPayment.create({
      employer_id: user.id,
      pharmacist_id: pharmacistId,
      shift_id: shiftId,
      amount: 50,
      type: 'acceptance_fee',
      status: status,
      stripe_payment_id: stripePaymentId,
      description: `Acceptance fee for ${pharmacistName}`,
      pharmacist_name: pharmacistName,
      shift_date: shift.shift_date,
      pharmacy_name: shift.pharmacy_name
    });

    return Response.json({
      success: true,
      message: 'Pharmacist accepted — $50 platform fee charged.',
      payment: {
        id: payment.id,
        amount: 50,
        status: status,
        stripe_payment_id: stripePaymentId
      }
    });

  } catch (error) {
    console.error('Acceptance fee error:', error);
    return Response.json({ 
      error: error.message || 'Failed to process acceptance fee' 
    }, { status: 500 });
  }
});