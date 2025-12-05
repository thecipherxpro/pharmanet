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

    const { 
      priceId, 
      amount, 
      currency = 'cad', 
      productName = 'Product', 
      mode = 'payment', 
      successUrl, 
      cancelUrl, 
      metadata = {} 
    } = await req.json();

    let line_items;

    if (priceId) {
      line_items = [{ price: priceId, quantity: 1 }];
    } else if (amount) {
      line_items = [{
        price_data: {
          currency: currency,
          product_data: {
            name: productName,
          },
          unit_amount: Math.round(amount * 100), // Stripe uses cents
        },
        quantity: 1,
      }];
    } else {
      return Response.json({ error: 'Price ID or Amount is required' }, { status: 400 });
    }

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: line_items,
      mode: mode,
      success_url: successUrl,
      cancel_url: cancelUrl,
      customer_email: user.email,
      metadata: {
        userId: user.id,
        userEmail: user.email,
        ...metadata
      },
    });

    return Response.json({ sessionId: session.id, url: session.url });

  } catch (error) {
    console.error('Checkout session error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});