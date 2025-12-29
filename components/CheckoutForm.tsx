'use client';

import { useEffect, useMemo, useState } from 'react';
import type { Stripe } from '@stripe/stripe-js';
import {
  CardElement,
  useStripe,
  useElements,
  PaymentRequestButtonElement,
} from '@stripe/react-stripe-js';

type Props = {
  amount: number;
  reportId?: string;
  onSuccess?: () => void;
  onBack?: () => void;
  currency?: '€' | '$' | '£';
  showVatBreakdown?: boolean;
  vatRate?: number;
  tierLabel?: string;
};

type StripePaymentRequest = ReturnType<NonNullable<Stripe['paymentRequest']>>;

export default function CheckoutForm({
  amount,
  reportId,
  onSuccess,
  onBack,
  tierLabel = 'Standard search',
}: Props) {
  const stripe = useStripe();
  const elements = useElements();

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [cardholder, setCardholder] = useState('');
  const [country, setCountry] = useState('US');

  const [paymentRequestReady, setPaymentRequestReady] = useState(false);
  const [paymentRequest, setPaymentRequest] =
    useState<StripePaymentRequest | null>(null);

  const total = useMemo(() => Math.max(1, Number(amount || 0)), [amount]);

  const paymentHeaders = {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${process.env.NEXT_PUBLIC_PAYMENT_API_KEY}`,
  };

  // -------- Apple / Google Pay --------
  useEffect(() => {
    if (!stripe) return;

    const pr = stripe.paymentRequest({
      country: country.toUpperCase(),
      currency: 'usd',
      total: {
        label: tierLabel || 'Activate my search',
        amount: Math.round(total * 100),
      },
      requestPayerName: true,
    });

    pr.canMakePayment().then((res) => {
      if (res) {
        setPaymentRequest(pr);
        setPaymentRequestReady(true);
      }
    });

    pr.on('paymentmethod', async (ev) => {
      try {
        setLoading(true);
        setMessage('');

        const r = await fetch('/api/create-payment-intent', {
          method: 'POST',
          headers: paymentHeaders,
          body: JSON.stringify({
            amount: total,
            currency: 'usd',
            reportId,
            description: tierLabel,
          }),
        });

        const { clientSecret, error } = await r.json();
        if (!clientSecret || error) {
          ev.complete('fail');
          setMessage(error || 'Payment initialization failed.');
          return;
        }

        const { error: confirmError, paymentIntent } =
          await stripe.confirmCardPayment(
            clientSecret,
            { payment_method: ev.paymentMethod.id },
            { handleActions: false }
          );

        if (confirmError) {
          ev.complete('fail');
          setMessage(confirmError.message || 'Payment failed.');
          return;
        }

        ev.complete('success');

        if (paymentIntent?.status === 'requires_action') {
          const { error } = await stripe.confirmCardPayment(clientSecret);
          if (error) {
            setMessage(error.message || 'Authentication failed.');
            return;
          }
        }

        setMessage('✅ Payment confirmed. Your search is activated.');
        onSuccess?.();
      } catch (e: any) {
        ev.complete('fail');
        setMessage(e?.message || 'Unexpected error.');
      } finally {
        setLoading(false);
      }
    });
  }, [stripe, total, reportId, country, tierLabel]);

  // -------- Card payment --------
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!stripe || !elements) return;

    setLoading(true);
    setMessage('');

    try {
      const res = await fetch('/api/create-payment-intent', {
        method: 'POST',
        headers: paymentHeaders,
        body: JSON.stringify({
          amount: total,
          currency: 'usd',
          reportId,
          description: tierLabel,
        }),
      });

      const { clientSecret, error } = await res.json();
      if (!clientSecret || error) {
        setMessage(error || 'Unable to create payment.');
        return;
      }

      const card = elements.getElement(CardElement);
      if (!card) {
        setMessage('Card element not found.');
        return;
      }

      const result = await stripe.confirmCardPayment(clientSecret, {
        payment_method: {
          card,
          billing_details: { name: cardholder || undefined },
        },
      });

      if (result.error) {
        setMessage(result.error.message || 'Payment failed.');
      } else if (result.paymentIntent?.status === 'succeeded') {
        setMessage('✅ Payment confirmed. Your search is activated.');
        onSuccess?.();
      }
    } catch (err: any) {
      setMessage(err?.message || 'Unexpected error.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full grid grid-cols-1 md:grid-cols-2 gap-8">
      <aside className="bg-[#eaf8ef] rounded-xl p-6 border border-green-200">
        <p className="text-sm text-[#1f6b3a] mb-2">Your contribution</p>
        <div className="text-4xl font-bold text-[#1f6b3a]">
          ${total.toFixed(2)}
        </div>
      </aside>

      <section className="bg-white rounded-xl p-6 border">
        {paymentRequestReady && paymentRequest && (
          <div className="mb-4">
            <PaymentRequestButtonElement options={{ paymentRequest }} />
            <p className="text-xs text-gray-500 mt-2 text-center">
              Apple Pay / Google Pay
            </p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            value={cardholder}
            onChange={(e) => setCardholder(e.target.value)}
            placeholder="Cardholder name"
            className="w-full border p-2 rounded"
          />

          <div className="border p-3 rounded">
            <CardElement options={{ hidePostalCode: true }} />
          </div>

          <button
            type="submit"
            disabled={loading || !stripe}
            className="w-full bg-green-600 text-white py-2 rounded"
          >
            {loading ? 'Processing…' : 'Confirm contribution'}
          </button>

          {message && <p className="text-sm text-center">{message}</p>}
        </form>
      </section>
    </div>
  );
}
