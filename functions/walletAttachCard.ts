import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';
import Stripe from 'npm:stripe@14.11.0';

Deno.serve(async (req) => {
  try {
    const stripeKey = Deno.env.get('STRIPE_SECRET_KEY');
    if (!stripeKey) {
      return Response.json({ error: 'Stripe not configured' }, { status: 500 });
    }

    const stripe = new Stripe(stripeKey, {
      apiVersion: '2023-10-16',
    });

    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { paymentMethodId } = body;

    if (!paymentMethodId) {
      return Response.json({ error: 'Payment method ID required' }, { status: 400 });
    }

    // Check if user has any existing cards to determine default status
    const existingCards = await base44.entities.WalletCard.filter({});
    const isDefault = existingCards.length === 0;

    // Find or create Stripe customer
    let stripeCustomerId;
    
    const customers = await stripe.customers.list({
      email: user.email,
      limit: 1
    });

    if (customers.data.length > 0) {
      stripeCustomerId = customers.data[0].id;
    } else {
      const customer = await stripe.customers.create({
        email: user.email,
        name: user.full_name || user.company_name || user.email,
        metadata: { 
          user_id: user.id,
          user_type: user.user_type
        }
      });
      stripeCustomerId = customer.id;
    }

    // Attach payment method to customer
    const paymentMethod = await stripe.paymentMethods.attach(paymentMethodId, {
      customer: stripeCustomerId,
    });

    // Verify the card is active by creating a small SetupIntent to validate
    // This confirms the card can be charged in production
    const setupIntent = await stripe.setupIntents.create({
      customer: stripeCustomerId,
      payment_method: paymentMethod.id,
      confirm: true,
      usage: 'off_session',
      return_url: 'https://app.base44.com/wallet-callback',
    });

    // Check if card verification succeeded
    if (setupIntent.status !== 'succeeded') {
      // Card validation failed - detach and return error
      await stripe.paymentMethods.detach(paymentMethod.id);
      return Response.json({ 
        success: false,
        error: 'Card could not be verified. Please try a different card.'
      }, { status: 400 });
    }

    // Set as default in Stripe if it's the first card
    if (isDefault) {
      await stripe.customers.update(stripeCustomerId, {
        invoice_settings: { default_payment_method: paymentMethod.id }
      });
    }

    // Create wallet card record - card is verified and active
    await base44.entities.WalletCard.create({
      user_id: user.id,
      stripe_customer_id: stripeCustomerId,
      stripe_payment_method_id: paymentMethod.id,
      brand: paymentMethod.card.brand,
      last4: paymentMethod.card.last4,
      exp_month: paymentMethod.card.exp_month,
      exp_year: paymentMethod.card.exp_year,
      is_default: isDefault
    });

    return Response.json({ 
      success: true,
      message: 'Card verified and added successfully'
    });

  } catch (error) {
    console.error('Error adding card:', error);
    
    // Handle specific Stripe errors
    if (error.type === 'StripeCardError') {
      return Response.json({ 
        success: false,
        error: error.message,
        code: error.code,
        decline_code: error.decline_code
      }, { status: 400 });
    }
    
    return Response.json({ 
      success: false,
      error: error.message || 'Failed to add card'
    }, { status: 500 });
  }
});