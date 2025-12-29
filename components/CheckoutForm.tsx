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
  amount: number; // USD (ex: 30 => $30)
  reportId?: string;
  onSuccess?: () => void;
  onBack?: () => void;

  // kept for compat
  currency?: '€' | '$' | '£';
  showVatBreakdown?: boolean;
  vatRate?: number;
  tierLabel?: string; // "Standard search" | "Extended search" | "Maximum search"
};

/** Safe alias for Payment Request */
type StripePaymentRequest = ReturnType<NonNullable<Stripe['paymentRequest']>>;

export default function CheckoutForm({
  amount,
  reportId,
  onSuccess,
  onBack,
  currency = '$', // compat, not used (US)
  showVatBreakdown = false,
  vatRate = 0,
  tierLabel = 'Standard search',
}: Props) {
  const stripe = useStripe();
  const elements = useElements();

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string>('');
  const [cardholder, setCardholder] = useState<string>('');
  const [country, setCountry] = useState<string>('US');

  const [paymentRequestReady, setPaymentRequestReady] = useState(false);
  const [paymentRequest, setPaymentRequest] = useState<StripePaymentRequest | null>(null);

  // ---- Format USD ----
  const fmtUSD = (v: number) =>
    new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(v);

  // Total US = simple amount (no VAT)
  const total = useMemo(() => Math.max(1, Number(amount || 0)), [amount]); // min $1

  /**
   * NOTE IMPORTANT (pour que “ça marche comme avant” sans exposer de clé côté navigateur) :
   * - Ce composant n’envoie PAS de Authorization header (sinon ça exposerait un secret côté client).
   * - Donc ton /api/create-payment-intent DOIT accepter les appels navigateur same-origin (Origin autorisé),
   *   sans exiger PAYMENT_API_KEY côté client.
   *   (Tu m’as dit que le 401 est réglé : parfait, ce composant reste propre et sûr.)
   */

  // --- Apple/Google Pay (Payment Request) ---
  useEffect(() => {
    if (!stripe) return;

    const pr = stripe.paymentRequest({
      country: (country || 'US').toUpperCase(),
      currency: 'usd',
      total: { label: tierLabel || 'Activate my search', amount: Math.round(total * 100) }, // cents
      requestPayerEmail: false,
      requestPayerName: true,
    });

    pr.canMakePayment().then((res) => {
      if (res) {
        setPaymentRequest(pr);
        setPaymentRequestReady(true);
      } else {
        setPaymentRequest(null);
        setPaymentRequestReady(false);
      }
    });

    pr.on('paymentmethod', async (ev) => {
      try {
        setLoading(true);
        setMessage('');

        const r = await fetch('/api/create-payment-intent', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          cache: 'no-store',
          body: JSON.stringify({
            amount: total, // dollars — backend converts to cents
            currency: 'usd',
            reportId,
            description: tierLabel,
          }),
        });

        const data = await r.json().catch(() => null);
        const clientSecret = data?.clientSecret;
        const apiError = data?.error;

        if (!r.ok || apiError || !clientSecret) {
          ev.complete('fail');
          setMessage(apiError || 'Could not initialize payment.');
          return;
        }

        // confirm with paymentMethod from PR
        const { error: confirmError, paymentIntent } = await stripe.confirmCardPayment(
          clientSecret,
          { payment_method: ev.paymentMethod.id },
          { handleActions: false }
        );

        if (confirmError) {
          ev.complete('fail');
          setMessage(confirmError.message || 'Payment declined.');
          return;
        }

        ev.complete('success');

        // Handle 3DS / SCA if needed
        if (paymentIntent && paymentIntent.status === 'requires_action') {
          const { error: actionError, paymentIntent: pi } = await stripe.confirmCardPayment(clientSecret);
          if (actionError) {
            setMessage(actionError.message || 'Authentication required.');
            return;
          }
          if (pi?.status === 'succeeded') {
            setMessage('✅ Payment confirmed. Your search is activated.');
            onSuccess?.();
          }
        } else if (paymentIntent?.status === 'succeeded') {
          setMessage('✅ Payment confirmed. Your search is activated.');
          onSuccess?.();
        }
      } catch (e: any) {
        ev.complete('fail');
        setMessage(e?.message || 'Unexpected error.');
      } finally {
        setLoading(false);
      }
    });

    // Cleanup to avoid duplicate handlers if deps change
    return () => {
      try {
        pr.off?.('paymentmethod', () => {});
      } catch {
        // ignore
      }
    };
  }, [stripe, total, reportId, country, tierLabel, onSuccess]);

  // --- Card payment (CardElement) ---
  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!stripe || !elements) return;

    setLoading(true);
    setMessage('');

    try {
      const res = await fetch('/api/create-payment-intent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        cache: 'no-store',
        body: JSON.stringify({
          amount: total, // dollars -> backend converts to cents
          currency: 'usd',
          reportId,
          description: tierLabel,
        }),
      });

      const data = await res.json().catch(() => null);
      const clientSecret = data?.clientSecret;
      const apiError = data?.error;

      if (!res.ok || apiError || !clientSecret) {
        setMessage(apiError || 'Unable to create payment.');
        return;
      }

      const card = elements.getElement(CardElement);
      if (!card) {
        setMessage('Card field not found.');
        return;
      }

      const result = await stripe.confirmCardPayment(clientSecret, {
        payment_method: {
          card,
          billing_details: {
            name: cardholder || undefined,
          },
        },
      });

      if (result.error) {
        setMessage(result.error.message || 'Payment declined.');
      } else if (result.paymentIntent?.status === 'succeeded') {
        setMessage('✅ Payment confirmed. Your search is activated.');
        onSuccess?.();
      } else if (result.paymentIntent?.status) {
        // Defensive: show status if not succeeded
        setMessage(`Payment status: ${result.paymentIntent.status}`);
      }
    } catch (err: any) {
      setMessage(err?.message || 'Unexpected error.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full">
      {/* 2-column Stripe-like layout */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Left column: summary */}
        <aside className="bg-[#eaf8ef] rounded-xl p-6 md:p-8 border border-green-200">
          <p className="text-sm text-[#1f6b3a] opacity-90 mb-2">Your contribution to ReportLost.org</p>
          <div className="text-4xl font-bold text-[#1f6b3a] mb-6">{fmtUSD(total)}</div>

          <div className="space-y-3 text-sm text-[#0f2b1c]">
            <div className="flex items-center justify-between">
              <span className="opacity-90">Search activation</span>
              <span className="font-medium">{fmtUSD(total)}</span>
            </div>
            {/* No VAT for US */}
          </div>
        </aside>

        {/* Right column: payment form */}
        <section className="bg-white rounded-xl p-6 md:p-8 border border-gray-200 shadow-sm">
          <h3 className="text-lg font-semibold mb-4">Billing information</h3>

          {/* Apple Pay / Google Pay if available */}
          {paymentRequestReady && paymentRequest && (
            <div className="mb-4">
              <PaymentRequestButtonElement
                options={{ paymentRequest }}
                className="PaymentRequestButton"
              />
              <p className="text-xs text-gray-500 mt-2 text-center">Apple Pay / Google Pay</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">Cardholder name</label>
              <input
                type="text"
                value={cardholder}
                onChange={(e) => setCardholder(e.target.value)}
                autoComplete="cc-name"
                className="w-full border rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-green-300"
                placeholder="Full name"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Card</label>
              <div className="border rounded-md p-3">
                <CardElement options={{ hidePostalCode: true }} />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Country or region</label>
              <select
                value={country}
                onChange={(e) => setCountry(e.target.value)}
                className="w-full border rounded-md p-2"
              >
                <option value="US">United States</option>
                <option value="CA">Canada</option>
                <option value="GB">United Kingdom</option>
                <option value="AU">Australia</option>
                <option value="FR">France</option>
                <option value="DE">Germany</option>
                <option value="ES">Spain</option>
                <option value="IT">Italy</option>
              </select>
            </div>

            {/* Actions */}
            <div className="flex items-center justify-between gap-3 pt-2">
              {onBack && (
                <button
                  type="button"
                  onClick={onBack}
                  className="px-4 py-2 rounded-md border border-gray-300 text-gray-800 hover:bg-gray-50"
                >
                  ← Back
                </button>
              )}

              <button
                type="submit"
                disabled={!stripe || loading}
                className="inline-flex items-center justify-center rounded-lg bg-gradient-to-r from-[#26723e] to-[#2ea052] hover:from-[#226638] hover:to-[#279449] text-white font-semibold px-6 py-2.5 shadow disabled:opacity-60"
              >
                {loading ? 'Processing…' : 'Confirm contribution'}
              </button>
            </div>

            {message && (
              <p className="text-sm text-center mt-2 text-gray-800 bg-gray-50 border border-gray-200 px-3 py-2 rounded">
                {message}
              </p>
            )}

            <p className="text-xs text-gray-500 text-center mt-2">
              Secured by Stripe — PCI DSS compliant. We do not store your card details.
            </p>
          </form>
        </section>
      </div>
    </div>
  );
}
