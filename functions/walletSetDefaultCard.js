import { createClientFromRequest } from 'npm:@base44/sdk@0.7.1';
import Stripe from 'npm:stripe@14.11.0';

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY'), {
  apiVersion: '2023-10-16',
});

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Allow both pharmacist and employer to set default cards
    if (!['pharmacist', 'employer'].includes(user.user_type)) {
      return Response.json({ error: 'Invalid user type' }, { status: 403 });
    }

    const { cardId } = await req.json();

    if (!cardId) {
      return Response.json({ error: 'Card ID required' }, { status: 400 });
    }

    // Get the card and verify ownership
    const cards = await base44.entities.WalletCard.filter({ user_id: user.id });
    const targetCard = cards.find(c => c.id === cardId);

    if (!targetCard) {
      return Response.json({ error: 'Card not found' }, { status: 404 });
    }

    // Update Stripe customer default payment method
    await stripe.customers.update(targetCard.stripe_customer_id, {
      invoice_settings: { default_payment_method: targetCard.stripe_payment_method_id }
    });

    // Update all cards: set target as default, others as non-default
    for (const card of cards) {
      await base44.asServiceRole.entities.WalletCard.update(card.id, {
        is_default: card.id === cardId
      });
    }

    // Return updated list
    const updatedCards = await base44.entities.WalletCard.filter({ user_id: user.id });

    return Response.json({
      success: true,
      cards: updatedCards.map(c => ({
        id: c.id,
        brand: c.brand,
        last4: c.last4,
        exp_month: c.exp_month,
        exp_year: c.exp_year,
        is_default: c.is_default
      }))
    });

  } catch (error) {
    console.error('Error setting default card:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});