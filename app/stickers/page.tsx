'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import {
  loadStripe,
  type PaymentRequest as StripePaymentRequest,
  type PaymentRequestOptions,
} from '@stripe/stripe-js';
import {
  Elements,
  CardElement,
  useStripe,
  useElements,
  PaymentRequestButtonElement,
} from '@stripe/react-stripe-js';

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!);

// ---------- Sous-composant : formulaire de paiement (12 $) ----------
function StickersCheckoutForm() {
  const stripe = useStripe();
  const elements = useElements();

  const [email, setEmail] = useState('');
  const [cardholder, setCardholder] = useState('');
  const [country, setCountry] = useState('US');

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string>('');
  const [paid, setPaid] = useState(false);

  // Apple / Google Pay
  const [paymentRequest, setPaymentRequest] = useState<StripePaymentRequest | null>(null);
  const [paymentRequestReady, setPaymentRequestReady] = useState(false);

  // Prix unique
  const amount = 12;
  const total = useMemo(() => Math.max(1, Number(amount || 0)), [amount]);
  const fmtUSD = (v: number) =>
    new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(v);

  // --- Apple/Google Pay (Payment Request) ---
  useEffect(() => {
    if (!stripe) return;

    const opts: PaymentRequestOptions = {
      country: (country || 'US').toUpperCase() as PaymentRequestOptions['country'],
      currency: 'usd',
      total: { label: 'Stickers PDF (protected relay)', amount: Math.round(total * 100) },
      requestPayerEmail: true,
      requestPayerName: true,
    };

    const pr = stripe.paymentRequest(opts);

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
            amount: total,
            currency: 'usd',
            description: 'Stickers PDF (protected relay)',
            email: ev.payerEmail,
          }),
        });

        const { clientSecret, error } = await r.json();
        if (error || !clientSecret) {
          ev.complete('fail');
          setMessage(error || 'Could not initialize payment.');
          setLoading(false);
          return;
        }

        const { error: confirmError, paymentIntent } = await stripe.confirmCardPayment(
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
          const { error: actionError, paymentIntent: pi } =
            await stripe.confirmCardPayment(clientSecret);
          if (actionError) {
            setMessage(actionError.message || 'Authentication required.');
            setLoading(false);
            return;
          }
          if (pi?.status === 'succeeded') {
            setPaid(true);
            setMessage('✅ Payment confirmed. You can download your stickers.');
          }
        } else if (paymentIntent?.status === 'succeeded') {
          setPaid(true);
          setMessage('✅ Payment confirmed. You can download your stickers.');
        }
      } catch (e: any) {
        ev.complete('fail');
        setMessage(e?.message || 'Unexpected error.');
      } finally {
        setLoading(false);
      }
    });
  }, [stripe, total, country]);

  // --- Paiement par carte (avec email obligatoire) ---
  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!stripe || !elements) return;

    if (!email || !/\S+@\S+\.\S+/.test(email)) {
      setMessage('Please enter a valid email address.');
      return;
    }

    setLoading(true);
    setMessage('');

    try {
      const res = await fetch('/api/create-payment-intent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: total,
          currency: 'usd',
          description: 'Stickers PDF (protected relay)',
          email,
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
            email,
          },
        },
      });

      if (result.error) {
        setMessage(result.error.message || 'Payment declined.');
      } else if (result.paymentIntent?.status === 'succeeded') {
        setPaid(true);
        setMessage('✅ Payment confirmed. You can download your stickers.');
      }
    } catch (err: any) {
      setMessage(err?.message || 'Unexpected error.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full">
      {/* 2 colonnes façon checkout */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Résumé prix */}
        <aside className="bg-[#eaf8ef] rounded-xl p-6 md:p-8 border border-green-200">
          <p className="text-sm text-[#1f6b3a] opacity-90 mb-2">One-time purchase</p>
          <div className="text-4xl font-bold text-[#1f6b3a] mb-6">{fmtUSD(total)}</div>

          <div className="space-y-3 text-sm text-[#0f2b1c]">
            <div className="flex items-center justify-between">
              <span className="opacity-90">Stickers PDF (protected relay)</span>
              <span className="font-medium">{fmtUSD(total)}</span>
            </div>
          </div>

          <p className="mt-6 text-sm text-[#1f6b3a]">
            <b>Included for free</b> in <i>Maximum search</i>. If you only need the stickers sheet, you can buy it here.
          </p>
        </aside>

        {/* Formulaire paiement */}
        <section className="bg-white rounded-xl p-6 md:p-8 border border-gray-200 shadow-sm">
          <h3 className="text-lg font-semibold mb-4">Billing & payment</h3>

          {/* Apple/Google Pay */}
          {paymentRequestReady && paymentRequest && (
            <div className="mb-4">
              <PaymentRequestButtonElement options={{ paymentRequest }} className="PaymentRequestButton" />
              <p className="text-xs text-gray-500 mt-2 text-center">Apple Pay / Google Pay</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">Email (receipt)</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="email"
                className="w-full border rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-green-300"
                placeholder="you@example.com"
              />
            </div>

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
              <button
                type="submit"
                disabled={!stripe || loading}
                className="inline-flex items-center justify-center rounded-lg bg-gradient-to-r from-[#26723e] to-[#2ea052] hover:from-[#226638] hover:to-[#279449] text-white font-semibold px-6 py-2.5 shadow disabled:opacity-60"
              >
                {loading ? 'Processing…' : 'Pay ' + fmtUSD(total)}
              </button>

              {/* Bouton téléchargement (désactivé tant que non payé) */}
              {paid ? (
                <Link
                  href="/stickers"
                  className="inline-flex items-center justify-center rounded-lg bg-black text-white font-semibold px-5 py-2.5 shadow"
                >
                  Download your stickers (PDF)
                </Link>
              ) : (
                <button
                  type="button"
                  disabled
                  className="inline-flex items-center justify-center rounded-lg bg-gray-200 text-gray-500 font-semibold px-5 py-2.5 shadow cursor-not-allowed"
                  title="Available after payment"
                >
                  Download your stickers (PDF)
                </button>
              )}
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

// ---------- Page ----------
export default function Page() {
  return (
    <main className="min-h-screen bg-white -mt-20 sm:-mt-24">
      {/* Hero compact (marges haut encore réduites) */}
      <section className="relative overflow-hidden -mt-10 md:-mt-12">
        <div className="absolute inset-0 -z-10 bg-gradient-to-br from-emerald-600 via-emerald-500 to-lime-400" />
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 py-6 text-white">
          <h1 className="text-3xl sm:text-4xl font-extrabold">Stickers — protected email relay</h1>
          <p className="mt-2 opacity-95">
            Get a printable PDF sheet of “SCAN ME” stickers that route finders to a private relay
            address (no personal email or phone displayed on the item). Price: $12.
            <br />
            <span className="opacity-90">
              <b>Free</b> if you choose <i>Maximum search</i>.
            </span>
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 py-6">
        <Elements stripe={stripePromise}>
          <StickersCheckoutForm />
        </Elements>
      </section>
    </main>
  );
}
