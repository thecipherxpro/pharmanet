import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';
import Stripe from 'npm:stripe@14.11.0';

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY'), {
  apiVersion: '2023-10-16',
});

const WEBHOOK_SECRET = Deno.env.get('STRIPE_WEBHOOK_SECRET');

Deno.serve(async (req) => {
  try {
    // Get the signature from headers
    const signature = req.headers.get('stripe-signature');
    
    if (!signature) {
      return Response.json({ error: 'No signature found' }, { status: 400 });
    }

    // Get raw body
    const body = await req.text();

    // Verify webhook signature
    let event;
    try {
      event = await stripe.webhooks.constructEventAsync(
        body,
        signature,
        WEBHOOK_SECRET
      );
    } catch (err) {
      console.error('Webhook signature verification failed:', err.message);
      return Response.json({ error: `Webhook Error: ${err.message}` }, { status: 400 });
    }

    // Initialize base44 client with service role for webhook operations
    const base44 = createClientFromRequest(req);

    // Handle the event
    switch (event.type) {
      case 'payment_intent.succeeded':
        await handlePaymentSuccess(event.data.object, base44);
        break;

      case 'payment_intent.payment_failed':
        await handlePaymentFailure(event.data.object, base44);
        break;

      case 'charge.refunded':
        await handleRefund(event.data.object, base44);
        break;

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    return Response.json({ received: true });

  } catch (error) {
    console.error('Webhook error:', error);
    return Response.json({ 
      error: error.message || 'Webhook processing failed' 
    }, { status: 500 });
  }
});

async function handlePaymentSuccess(paymentIntent, base44) {
  console.log('Payment succeeded:', paymentIntent.id);
  
  const metadata = paymentIntent.metadata;
  
  // Update payment record status
  if (metadata.payment_type === 'acceptance_fee') {
    // Find and update EmployerPayment record
    const payments = await base44.asServiceRole.entities.EmployerPayment.filter({
      stripe_payment_id: paymentIntent.id
    });
    
    if (payments.length > 0) {
      await base44.asServiceRole.entities.EmployerPayment.update(payments[0].id, {
        status: 'charged'
      });
    }
  } else if (metadata.penalty_type === 'shift_cancellation') {
    // Find and update ShiftCancellation record
    const cancellations = await base44.asServiceRole.entities.ShiftCancellation.filter({
      stripe_payment_id: paymentIntent.id
    });
    
    if (cancellations.length > 0) {
      await base44.asServiceRole.entities.ShiftCancellation.update(cancellations[0].id, {
        status: 'charged'
      });
    }
  } else if (metadata.penalty_type === 'employer_shift_cancellation') {
    // Find and update EmployerPayment record for cancellation
    const payments = await base44.asServiceRole.entities.EmployerPayment.filter({
      stripe_payment_id: paymentIntent.id
    });
    
    if (payments.length > 0) {
      await base44.asServiceRole.entities.EmployerPayment.update(payments[0].id, {
        status: 'charged'
      });
    }
  }
}

async function handlePaymentFailure(paymentIntent, base44) {
  console.log('Payment failed:', paymentIntent.id);
  
  const metadata = paymentIntent.metadata;
  
  // Update payment record status
  if (metadata.payment_type === 'acceptance_fee') {
    const payments = await base44.asServiceRole.entities.EmployerPayment.filter({
      stripe_payment_id: paymentIntent.id
    });
    
    if (payments.length > 0) {
      await base44.asServiceRole.entities.EmployerPayment.update(payments[0].id, {
        status: 'failed'
      });
    }
  } else if (metadata.penalty_type) {
    // Handle cancellation payment failure
    if (metadata.penalty_type === 'shift_cancellation') {
      const cancellations = await base44.asServiceRole.entities.ShiftCancellation.filter({
        stripe_payment_id: paymentIntent.id
      });
      
      if (cancellations.length > 0) {
        await base44.asServiceRole.entities.ShiftCancellation.update(cancellations[0].id, {
          status: 'failed'
        });
      }
    } else if (metadata.penalty_type === 'employer_shift_cancellation') {
      const payments = await base44.asServiceRole.entities.EmployerPayment.filter({
        stripe_payment_id: paymentIntent.id
      });
      
      if (payments.length > 0) {
        await base44.asServiceRole.entities.EmployerPayment.update(payments[0].id, {
          status: 'failed'
        });
      }
    }
  }
}

async function handleRefund(charge, base44) {
  console.log('Charge refunded:', charge.id);
  
  // Find payment by charge ID and update status
  const payments = await base44.asServiceRole.entities.EmployerPayment.filter({
    stripe_payment_id: charge.payment_intent
  });
  
  if (payments.length > 0) {
    await base44.asServiceRole.entities.EmployerPayment.update(payments[0].id, {
      status: 'refunded'
    });
  }
  
  // Also check ShiftCancellation records
  const cancellations = await base44.asServiceRole.entities.ShiftCancellation.filter({
    stripe_payment_id: charge.payment_intent
  });
  
  if (cancellations.length > 0) {
    await base44.asServiceRole.entities.ShiftCancellation.update(cancellations[0].id, {
      status: 'refunded'
    });
  }
}