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

// ⚠️ Cette liste était écrite en dur sur la formule à 25 $ et s'affichait
// telle quelle à quelqu'un payant 12 $ : elle lui promettait, carte en main,
// un dépôt auprès du service compétent, des démarches auprès des commerces,
// une annonce publiée et douze mois de veille — dont sa formule ne contient
// rien. C'est l'écran qui fait foi en cas de litige : il doit décrire ce qui
// est réellement acheté, et dire ce qui ne l'est pas.
const SUMMARY_FULL = [
  'Filed with the local lost-property service',
  'Nearby places contacted, notice published',
  '12 months of web monitoring, human-checked',
  'Loss certificate + QR sticker sheet',
];

const SUMMARY_AUTO = [
  '6 months of web monitoring',
  'Loss certificate + QR sticker sheet',
];

/** Seuil de la formule complète. En dessous, on est sur l'automatique seule. */
const FULL_PLAN_MIN = 25;

export default function CheckoutForm({
  amount,
  reportId,
  onSuccess,
  onBack,
  tierLabel = 'Active search',
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
  const isFullPlan = total >= FULL_PLAN_MIN;

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
        <p className="text-sm text-[#1f6b3a] mb-2">{tierLabel}</p>
        <div className="text-4xl font-bold text-[#1f6b3a]">
          ${total.toFixed(2)}
        </div>
        <p className="mt-2 text-sm text-gray-600">
          One-time payment, never a subscription.
        </p>

        {/* L'encadré n'affichait que le montant. C'est ici, carte en main, que
            le doute revient : quatre lignes suffisent à le lever. */}
        <hr className="my-4 border-green-200" />
        <ul className="space-y-2 text-sm text-gray-700">
          {(isFullPlan ? SUMMARY_FULL : SUMMARY_AUTO).map((line) => (
            <li key={line} className="flex gap-2 leading-snug">
              <span className="flex-none text-green-600">✓</span>
              <span>{line}</span>
            </li>
          ))}
        </ul>
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
          {/* Libellés au-dessus des champs : un placeholder disparaît dès la
              première frappe, et l'utilisateur ne sait plus ce qu'on lui demande. */}
          <div>
            <label
              htmlFor="cardholder"
              className="mb-1.5 block text-[12.5px] font-medium text-gray-700"
            >
              Cardholder name
            </label>
            <input
              id="cardholder"
              value={cardholder}
              onChange={(e) => setCardholder(e.target.value)}
              placeholder="Name as printed on the card"
              className="w-full rounded border p-2"
            />
          </div>

          <div>
            <label className="mb-1.5 block text-[12.5px] font-medium text-gray-700">
              Card details
            </label>
            {/* hidePostalCode repassé à false : aux États-Unis le code postal
                sert à la vérification d'adresse, le masquer augmente les refus
                bancaires et les litiges. */}
            <div className="rounded border p-3">
              <CardElement options={{ hidePostalCode: false }} />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading || !stripe}
            className="w-full rounded bg-gradient-to-r from-[#26723e] to-[#2ea052] py-3 font-semibold text-white disabled:opacity-60"
          >
            {loading ? 'Processing…' : `Pay $${total.toFixed(2)} and start my search`}
          </button>

          {message && <p className="text-sm text-center">{message}</p>}

          <p className="text-center text-[11.5px] leading-relaxed text-gray-500">
            🔒 Your card details go straight to Stripe and never touch our servers.
            <br />
            No account is created, and nothing is charged again.
          </p>

          {/* ⚠️ onBack était passé par ReportForm mais n'était affiché nulle part :
              une fois une formule payante choisie, on se retrouvait devant Stripe
              sans retour possible, hormis le bouton du navigateur — qui repart au
              début du formulaire et perd la saisie. */}
          {onBack && (
            <div className="text-center">
              <button
                type="button"
                onClick={onBack}
                disabled={loading}
                className="text-[13.5px] text-gray-500 underline underline-offset-2 hover:text-gray-700 disabled:opacity-50"
              >
                ← Back to plans
              </button>
            </div>
          )}
        </form>
      </section>
    </div>
  );
}
