import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';
import Stripe from 'npm:stripe@14.11.0';
import { asyncHandler, ErrorTypes, validateRequired, logError } from './helpers/errorHandler.js';
import { retryStripeOperation } from './helpers/retryHelper.js';

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY'), {
  apiVersion: '2023-10-16',
});

Deno.serve(asyncHandler(async (req) => {
  const base44 = createClientFromRequest(req);
  const user = await base44.auth.me();

  if (!user || user.user_type !== 'employer') {
    throw ErrorTypes.UNAUTHORIZED('Employer access only');
  }

  const body = await req.json();
  validateRequired(body, ['shift_id', 'pharmacist_id']);
  
  const { shift_id, pharmacist_id, pharmacist_name } = body;

  // Get shift details
  const shifts = await base44.entities.Shift.filter({ id: shift_id });
  
  if (!shifts || shifts.length === 0) {
    throw ErrorTypes.NOT_FOUND('Shift not found');
  }
  
  // Verify ownership
  if (shifts[0].created_by !== user.email && shifts[0].employer_id !== user.id) {
    throw ErrorTypes.FORBIDDEN('You do not own this shift');
  }

  const shift = shifts[0];

  // Get pricing config
  const pricingConfigs = await base44.asServiceRole.entities.PricingConfig.list();
  const acceptanceFee = pricingConfigs?.[0]?.employer_acceptance_fee || 50;

  // Get employer's default card
  const cards = await base44.entities.WalletCard.filter({ 
    user_id: user.id, 
    is_default: true 
  });

  if (!cards || cards.length === 0) {
    throw ErrorTypes.PAYMENT_ERROR(
      'No default payment card found. Please add a card to your wallet.',
      { action_required: 'add_card' }
    );
  }

  const defaultCard = cards[0];

  // Create Stripe charge with retry logic
  const paymentIntent = await retryStripeOperation(async () => {
    return await stripe.paymentIntents.create({
      amount: Math.round(acceptanceFee * 100),
      currency: 'cad',
      customer: defaultCard.stripe_customer_id,
      payment_method: defaultCard.stripe_payment_method_id,
      off_session: true,
      confirm: true,
      description: `Acceptance fee - ${shift.pharmacy_name} on ${shift.shift_date}`,
      metadata: {
        employer_id: user.id,
        shift_id: shift_id,
        pharmacist_id: pharmacist_id,
        fee_type: 'acceptance'
      }
    });
  }, 'Acceptance fee charge');

  // Record payment in database
  const payment = await base44.asServiceRole.entities.EmployerPayment.create({
    employer_id: user.id,
    pharmacist_id: pharmacist_id,
    shift_id: shift_id,
    amount: acceptanceFee,
    type: 'acceptance_fee',
    status: 'charged',
    stripe_payment_id: paymentIntent.id,
    description: `Acceptance fee for ${pharmacist_name || 'pharmacist'}`,
    pharmacist_name: pharmacist_name,
    shift_date: shift.shift_date,
    pharmacy_name: shift.pharmacy_name
  });

  return Response.json({
    success: true,
    message: `$${acceptanceFee} acceptance fee charged successfully`,
    payment: {
      id: payment.id,
      amount: acceptanceFee,
      status: 'charged',
      stripe_payment_id: paymentIntent.id
    }
  });
}));