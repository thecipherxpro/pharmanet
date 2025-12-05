import React, { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { CreditCard, Lock, AlertCircle } from "lucide-react";
import { base44 } from "@/api/base44Client";

// Map Stripe error codes to user-friendly messages
const getCardErrorMessage = (error) => {
  const errorCode = error?.code || error?.decline_code;
  const errorMessages = {
    'card_declined': 'Your card was declined. Please try a different card.',
    'insufficient_funds': 'Insufficient funds. Please try a different card.',
    'invalid_number': 'Invalid card number. Please check and try again.',
    'invalid_expiry_month': 'Invalid expiration month.',
    'invalid_expiry_year': 'Invalid expiration year.',
    'invalid_cvc': 'Invalid security code (CVC).',
    'expired_card': 'This card has expired. Please use a different card.',
    'incorrect_cvc': 'Incorrect security code. Please check and try again.',
    'incorrect_number': 'Incorrect card number. Please check and try again.',
    'processing_error': 'An error occurred while processing. Please try again.',
    'rate_limit': 'Too many requests. Please wait a moment and try again.',
    'lost_card': 'This card has been reported lost. Please use a different card.',
    'stolen_card': 'This card has been reported stolen. Please use a different card.',
    'generic_decline': 'Your card was declined. Please try a different card.',
    'do_not_honor': 'Your card was declined. Please contact your bank.',
    'fraudulent': 'This transaction was flagged. Please contact your bank.',
    'card_not_supported': 'This card type is not supported. Please try a different card.',
    'currency_not_supported': 'This card does not support CAD. Please try a different card.',
    'duplicate_transaction': 'A similar transaction was recently submitted.',
    'try_again_later': 'Unable to process. Please try again later.',
  };
  
  return errorMessages[errorCode] || error?.message || 'Failed to add card. Please try again.';
};

export default function AddCardForm({ onSuccess, onCancel, onError, onBannerMessage }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [stripe, setStripe] = useState(null);
  const [cardElement, setCardElement] = useState(null);
  const [publishableKey, setPublishableKey] = useState(null);
  const [stripeLoaded, setStripeLoaded] = useState(false);
  const cardContainerRef = useRef(null);
  const elementsRef = useRef(null);
  const cardElementRef = useRef(null);

  useEffect(() => {
    loadStripe();
    
    return () => {
      // Cleanup: unmount card element when component unmounts
      if (cardElementRef.current) {
        try {
          cardElementRef.current.unmount();
        } catch (e) {
          console.log('Card element already unmounted');
        }
      }
    };
  }, []);

  const loadStripe = async () => {
    try {
      // Get publishable key from backend
      console.log('Fetching Stripe publishable key...');
      const response = await base44.functions.invoke('getStripePublishableKey');
      console.log('Stripe key response:', response);
      
      const key = response?.data?.publishableKey;
      
      if (!key) {
        console.error('No publishable key in response:', response);
        setError('Unable to load payment form. Please try again later.');
        return;
      }
      
      setPublishableKey(key);

      // Check if Stripe.js is already loaded
      if (window.Stripe) {
        console.log('Stripe.js already loaded');
        initializeStripe(key);
      } else {
        // Load Stripe.js script
        console.log('Loading Stripe.js...');
        const script = document.createElement('script');
        script.src = 'https://js.stripe.com/v3/';
        script.async = true;
        script.onload = () => {
          console.log('Stripe.js loaded successfully');
          setStripeLoaded(true);
          initializeStripe(key);
        };
        script.onerror = () => {
          setError('Failed to load Stripe. Please refresh the page.');
        };
        document.body.appendChild(script);
      }
    } catch (err) {
      console.error('Stripe loading error:', err);
      setError('Failed to load payment form. Please try again.');
    }
  };

  const initializeStripe = (publishableKey) => {
    try {
      const stripeInstance = window.Stripe(publishableKey);
      setStripe(stripeInstance);
      
      const elements = stripeInstance.elements();
      elementsRef.current = elements;
      
      const card = elements.create('card', {
        style: {
          base: {
            fontSize: '16px',
            color: '#1f2937',
            fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, sans-serif',
            '::placeholder': {
              color: '#9ca3af',
            },
          },
          invalid: {
            color: '#ef4444',
            iconColor: '#ef4444',
          },
        },
        hidePostalCode: false,
      });
      
      cardElementRef.current = card;
      
      // Wait for container to be in DOM, then mount
      const mountCard = () => {
        if (cardContainerRef.current) {
          console.log('Mounting card element...');
          card.mount(cardContainerRef.current);
          setCardElement(card);
          
          // Add event listeners
          card.on('change', (event) => {
            if (event.error) {
              setError(event.error.message);
            } else {
              setError(null);
            }
          });
          
          console.log('Card element mounted successfully');
        } else {
          console.log('Container not ready, retrying...');
          setTimeout(mountCard, 100);
        }
      };
      
      // Small delay to ensure DOM is ready
      setTimeout(mountCard, 100);
      
    } catch (err) {
      console.error('Error initializing Stripe:', err);
      setError('Failed to initialize payment form. Please try again.');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!stripe || !cardElementRef.current) {
      setError('Payment form not ready. Please wait a moment.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      console.log('Creating payment method...');
      
      // Create payment method with Stripe
      const { paymentMethod, error: stripeError } = await stripe.createPaymentMethod({
        type: 'card',
        card: cardElementRef.current,
      });

      if (stripeError) {
        console.error('Stripe error:', stripeError);
        const friendlyMessage = getCardErrorMessage(stripeError);
        setError(friendlyMessage);
        onBannerMessage?.(friendlyMessage, 'error');
        setLoading(false);
        return;
      }

      console.log('Payment method created:', paymentMethod.id);

      // Send payment method to backend
      const { data } = await base44.functions.invoke('walletAttachCard', {
        paymentMethodId: paymentMethod.id
      });

      console.log('Backend response:', data);

      if (data.success) {
        onBannerMessage?.('Card added successfully!', 'success');
        onSuccess();
      } else {
        const friendlyMessage = getCardErrorMessage({ message: data.error });
        setError(friendlyMessage);
        onBannerMessage?.(friendlyMessage, 'error');
      }
    } catch (err) {
      console.error('Error adding card:', err);
      const friendlyMessage = getCardErrorMessage(err);
      setError(friendlyMessage);
      onBannerMessage?.(friendlyMessage, 'error');
    }

    setLoading(false);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Card Element Container */}
      <div>
        <Label className="text-sm font-semibold mb-2 block">Card Details</Label>
        <div className="border-2 border-gray-200 rounded-lg p-4 bg-white">
          <div 
            ref={cardContainerRef}
            className="min-h-[40px]"
          />
        </div>
        {!stripe && !error && (
          <p className="text-xs text-gray-500 mt-2">
            Loading payment form...
          </p>
        )}
        {stripe && (
          <p className="text-xs text-gray-500 mt-2">
            Your card information is encrypted and secure.
          </p>
        )}
      </div>

      {/* Error Message */}
      {error && (
        <div className="flex items-start gap-2 p-3 bg-red-50 border border-red-200 rounded-lg">
          <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-red-800">{error}</p>
        </div>
      )}

      {/* Security Notice */}
      <div className="flex items-start gap-2 p-4 bg-blue-50 rounded-lg border border-blue-200">
        <Lock className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
        <div>
          <p className="text-sm font-semibold text-blue-900 mb-1">Secure Payment</p>
          <p className="text-xs text-blue-800">
            Card information is processed securely through Stripe. We never store your full card number.
          </p>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex gap-3">
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
          className="flex-1 h-12"
          disabled={loading}
        >
          Cancel
        </Button>
        <Button
          type="submit"
          disabled={loading || !stripe || !cardElement}
          className="flex-1 h-12 bg-blue-600 hover:bg-blue-700"
        >
          {loading ? (
            <>
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
              Adding Card...
            </>
          ) : (
            <>
              <CreditCard className="w-4 h-4 mr-2" />
              Add Card
            </>
          )}
        </Button>
      </div>
    </form>
  );
}