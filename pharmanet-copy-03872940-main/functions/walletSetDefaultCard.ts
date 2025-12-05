import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';
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

    const { cardId } = await req.json();

    if (!cardId) {
      return Response.json({ error: 'Card ID required' }, { status: 400 });
    }

    // Get user's cards
    const cards = await base44.entities.WalletCard.filter({});
    const targetCard = cards.find(c => c.id === cardId);

    if (!targetCard) {
      return Response.json({ error: 'Card not found' }, { status: 404 });
    }

    // Update Stripe customer default payment method
    await stripe.customers.update(targetCard.stripe_customer_id, {
      invoice_settings: { default_payment_method: targetCard.stripe_payment_method_id }
    });

    // Update all cards: set target as default, others as non-default
    // We can use Promise.all for parallel updates
    const updatePromises = cards.map(card => {
      const shouldBeDefault = card.id === cardId;
      // Only update if status changed
      if (card.is_default !== shouldBeDefault) {
        return base44.entities.WalletCard.update(card.id, {
          is_default: shouldBeDefault
        });
      }
      return Promise.resolve();
    });

    await Promise.all(updatePromises);

    // Return updated list
    const updatedCards = await base44.entities.WalletCard.filter({});

    return Response.json({
      success: true,
      cards: updatedCards
    });

  } catch (error) {
    console.error('Error setting default card:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});