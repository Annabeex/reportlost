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
  amount: number;                 // Montant en USD (ex: 30 pour $30)
  reportId?: string;
  onSuccess?: () => void;
  onBack?: () => void;
  // Props gardées pour compat, non utilisées côté US
  currency?: '€' | '$' | '£';
  showVatBreakdown?: boolean;
  vatRate?: number;
  tierLabel?: string;             // "Standard search" | "Extended search" | "Maximum search"
};

/** Alias safe pour Payment Request */
type StripePaymentRequest = ReturnType<NonNullable<Stripe['paymentRequest']>>;

export default function CheckoutForm({
  amount,
  reportId,
  onSuccess,
  onBack,
  currency = '$',          // laissé pour compat mais pas utilisé
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

  // Total US = montant simple (pas de TVA)
  const total = useMemo(() => Math.max(1, Number(amount || 0)), [amount]); // minimum $1

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
          body: JSON.stringify({
            amount: total,       // dollars — ton API convertit en cents
            currency: 'usd',
            reportId,
            description: tierLabel,
          }),
        });

        const { clientSecret, error } = await r.json();
        if (error || !clientSecret) {
          ev.complete('fail');
          setMessage(error || 'Could not initialize payment.');
          setLoading(false);
          return;
        }

        const { error: confirmError, paymentIntent } = await stripe!.confirmCardPayment(
          clientSecret,
          { payment_method: ev.paymentMethod.id },
          { handleActions: false }
        );

        if (confirmError) {
          ev.complete('fail');
          setMessage(confirmError.message || 'Payment declined.');
          setLoading(false);
          return;
        }

        ev.complete('success');

        if (paymentIntent && paymentIntent.status === 'requires_action') {
          const { error: actionError, paymentIntent: pi } = await stripe!.confirmCardPayment(clientSecret);
          if (actionError) {
            setMessage(actionError.message || 'Authentication required.');
            setLoading(false);
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
  }, [stripe, total, reportId, country, tierLabel]);

  // --- Paiement par carte classique ---
  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!stripe || !elements) return;

    setLoading(true);
    setMessage('');

    try {
      const res = await fetch('/api/create-payment-intent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: total,        // dollars -> backend convertit en cents
          currency: 'usd',
          reportId,
          description: tierLabel,
        }),
      });

      const { clientSecret, error } = await res.json();
      if (error || !clientSecret) {
        setMessage(error || 'Unable to create payment.');
        setLoading(false);
        return;
      }

      const card = elements.getElement(CardElement);
      if (!card) {
        setMessage('Card field not found.');
        setLoading(false);
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
      }
    } catch (err: any) {
      setMessage(err?.message || 'Unexpected error.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full">
      {/* Layout 2 colonnes façon Checkout Stripe */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Colonne gauche : résumé / total avec fond vert clair */}
        <aside className="bg-[#eaf8ef] rounded-xl p-6 md:p-8 border border-green-200">
          {/* ⬇️ wording modifié */}
          <p className="text-sm text-[#1f6b3a] opacity-90 mb-2">Your contribution to ReportLost.org</p>
          <div className="text-4xl font-bold text-[#1f6b3a] mb-6">
            {fmtUSD(total)}
          </div>

          <div className="space-y-3 text-sm text-[#0f2b1c]">
            <div className="flex items-center justify-between">
              {/* ⬇️ wording modifié (affichage): Search activation */}
              <span className="opacity-90">Search activation</span>
              <span className="font-medium">{fmtUSD(total)}</span>
            </div>
            {/* Pas de TVA aux US */}
          </div>
        </aside>

        {/* Colonne droite : formulaire de paiement */}
        <section className="bg-white rounded-xl p-6 md:p-8 border border-gray-200 shadow-sm">
          {/* ⬇️ wording modifié */}
          <h3 className="text-lg font-semibold mb-4">Billing information</h3>

          {/* Apple/Google Pay si dispo */}
          {paymentRequestReady && paymentRequest && (
            <div className="mb-4">
              <PaymentRequestButtonElement options={{ paymentRequest }} className="PaymentRequestButton" />
              <p className="text-xs text-gray-500 mt-2 text-center">Apple Pay / Google Pay</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Email supprimé (selon demande) */}

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

              {/* ⬇️ wording modifié */}
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
