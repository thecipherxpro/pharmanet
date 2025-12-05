import { createClientFromRequest } from 'npm:@base44/sdk@0.7.1';
import Stripe from 'npm:stripe@14.11.0';

Deno.serve(async (req) => {
  // Log request start
  console.log('💳 ========== walletAttachCard START ==========');
  
  try {
    // Check if Stripe key exists
    const stripeKey = Deno.env.get('STRIPE_SECRET_KEY');
    if (!stripeKey) {
      console.error('❌ STRIPE_SECRET_KEY not configured');
      return Response.json({ error: 'Stripe not configured' }, { status: 500 });
    }
    console.log('✅ Stripe key found');

    const stripe = new Stripe(stripeKey, {
      apiVersion: '2023-10-16',
    });

    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    console.log('💳 User authenticated:', {
      id: user?.id,
      email: user?.email,
      user_type: user?.user_type
    });

    if (!user) {
      console.error('❌ No user found');
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Allow both pharmacist and employer to add cards
    if (!['pharmacist', 'employer'].includes(user.user_type)) {
      console.error('❌ Invalid user type:', user.user_type);
      return Response.json({ error: 'Invalid user type. Must be pharmacist or employer.' }, { status: 403 });
    }

    const body = await req.json();
    const { paymentMethodId } = body;
    console.log('💳 Payment Method ID:', paymentMethodId);

    if (!paymentMethodId) {
      console.error('❌ No payment method ID provided');
      return Response.json({ error: 'Payment method ID required' }, { status: 400 });
    }

    // Get existing cards for this user
    console.log('🔍 Checking for existing cards with user_id:', user.id);
    const existingCards = await base44.asServiceRole.entities.WalletCard.filter({ user_id: user.id });
    console.log('💳 Existing cards count:', existingCards.length);
    if (existingCards.length > 0) {
      console.log('📋 Existing cards:', existingCards.map(c => ({ id: c.id, last4: c.last4, is_default: c.is_default })));
    }
    
    let stripeCustomerId;

    if (existingCards.length > 0) {
      stripeCustomerId = existingCards[0].stripe_customer_id;
      console.log('✅ Using existing Stripe customer:', stripeCustomerId);
    } else {
      console.log('🆕 Creating new Stripe customer...');
      try {
        const customer = await stripe.customers.create({
          email: user.email,
          name: user.full_name || user.company_name || user.email,
          metadata: { 
            user_id: user.id,
            user_type: user.user_type
          }
        });
        stripeCustomerId = customer.id;
        console.log('✅ Created Stripe customer:', stripeCustomerId);
      } catch (stripeError) {
        console.error('❌ Stripe customer creation failed:', stripeError.message);
        throw stripeError;
      }
    }

    // Attach payment method to customer
    console.log('🔗 Attaching payment method to customer...');
    let paymentMethod;
    try {
      paymentMethod = await stripe.paymentMethods.attach(paymentMethodId, {
        customer: stripeCustomerId,
      });
      console.log('✅ Payment method attached:', paymentMethod.id);
    } catch (stripeError) {
      console.error('❌ Stripe attach failed:', stripeError.message);
      throw stripeError;
    }

    // Set as default if it's the first card
    const isDefault = existingCards.length === 0;
    console.log('🎯 Is default card:', isDefault);

    // If setting as default, update Stripe customer
    if (isDefault) {
      console.log('⭐ Setting as default payment method in Stripe...');
      try {
        await stripe.customers.update(stripeCustomerId, {
          invoice_settings: { default_payment_method: paymentMethod.id }
        });
        console.log('✅ Default payment method set in Stripe');
      } catch (stripeError) {
        console.error('❌ Stripe set default failed:', stripeError.message);
        // Don't throw - card is attached, just not default
      }
    }

    // Save to database
    const cardData = {
      user_id: user.id,
      stripe_customer_id: stripeCustomerId,
      stripe_payment_method_id: paymentMethod.id,
      brand: paymentMethod.card.brand,
      last4: paymentMethod.card.last4,
      exp_month: paymentMethod.card.exp_month,
      exp_year: paymentMethod.card.exp_year,
      is_default: isDefault
    };

    console.log('💾 Saving card to database:', cardData);
    try {
      const savedCard = await base44.asServiceRole.entities.WalletCard.create(cardData);
      console.log('✅ Card saved to database with ID:', savedCard.id);
    } catch (dbError) {
      console.error('❌ Database save failed:', dbError.message);
      console.error('Full error:', dbError);
      throw dbError;
    }

    console.log('✅ ========== walletAttachCard SUCCESS ==========');
    // Return success
    return Response.json({ 
      success: true,
      message: 'Card added successfully'
    });

  } catch (error) {
    console.error('❌ ========== walletAttachCard ERROR ==========');
    console.error('Error type:', error.constructor.name);
    console.error('Error message:', error.message);
    console.error('Error stack:', error.stack);
    
    return Response.json({ 
      success: false,
      error: error.message || 'Failed to add card',
      details: error.stack
    }, { status: 500 });
  }
});