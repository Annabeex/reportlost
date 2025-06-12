'use client';

import { useState } from 'react';
import {
  CardElement,
  useStripe,
  useElements,
  CardElementComponent,
} from '@stripe/react-stripe-js';

interface Props {
  amount: number;
}

export default function CheckoutForm({ amount }: Props) {
  const stripe = useStripe();
  const elements = useElements();
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');

    if (!stripe || !elements) {
      setMessage('Stripe has not loaded yet.');
      setLoading(false);
      return;
    }

    const res = await fetch('/api/create-payment-intent', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ amount }),
    });

    const { clientSecret, error } = await res.json();

    if (error || !clientSecret) {
      setMessage(error || 'Failed to get client secret.');
      setLoading(false);
      return;
    }

    const cardElement = elements.getElement(CardElement);

    if (!cardElement) {
      setMessage('Card element not found.');
      setLoading(false);
      return;
    }

    const result = await stripe.confirmCardPayment(clientSecret, {
      payment_method: {
        card: cardElement,
      },
    });

    if (result.error) {
      setMessage(result.error.message || 'Payment failed.');
    } else if (result.paymentIntent?.status === 'succeeded') {
      setMessage('✅ Payment successful. Your report has been submitted.');
    }

    setLoading(false);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <label className="block text-gray-700 text-sm font-medium">Card details</label>
      <div className="border p-4 rounded">
        <CardElement options={{ hidePostalCode: true }} />
      </div>

      <button
        type="submit"
        disabled={!stripe || loading}
        className="bg-green-600 text-white px-6 py-2 rounded hover:bg-green-700"
      >
        {loading ? 'Processing...' : `Pay $${amount}`}
      </button>

      {message && (
        <p className="text-sm text-center mt-4 text-gray-800 bg-gray-100 p-2 rounded">
          {message}
        </p>
      )}
    </form>
  );
}
