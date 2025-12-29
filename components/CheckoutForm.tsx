"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useElements, useStripe, PaymentElement } from "@stripe/react-stripe-js";

type Props = {
  amount: number; // USD, ex: 12, 15, 30...
  reportId: string;
  reportPublicId?: string;
  onSuccess: (paymentIntentId?: string) => void;
  onBack: () => void;
  tierLabel?: string;
};

export default function CheckoutForm({
  amount,
  reportId,
  reportPublicId,
  onSuccess,
  onBack,
  tierLabel,
}: Props) {
  const stripe = useStripe();
  const elements = useElements();

  const [clientSecret, setClientSecret] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [loadingIntent, setLoadingIntent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const amountSafe = useMemo(() => {
    const n = Number(amount || 0);
    return Number.isFinite(n) ? n : 0;
  }, [amount]);

  // Create PaymentIntent when entering the page / when amount changes
  useEffect(() => {
    let cancelled = false;

    async function createIntent() {
      setError(null);
      setLoadingIntent(true);
      try {
        const res = await fetch("/api/create-payment-intent", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            amount: amountSafe,
            currency: "usd",
            reportId,
            reportPublicId,
          }),
          cache: "no-store",
        });

        const data = await res.json().catch(() => null);

        if (!res.ok) {
          const msg =
            (data && (data.error || data.message)) ||
            `Failed to initialize payment (HTTP ${res.status}).`;
          throw new Error(msg);
        }

        if (!data?.clientSecret) {
          throw new Error("Missing clientSecret from server.");
        }

        if (!cancelled) setClientSecret(String(data.clientSecret));
      } catch (e: any) {
        if (!cancelled) setError(e?.message || "Payment initialization failed.");
      } finally {
        if (!cancelled) setLoadingIntent(false);
      }
    }

    if (amountSafe > 0 && reportId) createIntent();

    return () => {
      cancelled = true;
    };
  }, [amountSafe, reportId, reportPublicId]);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!stripe || !elements) {
      setError("Stripe is not ready yet. Please wait a moment and retry.");
      return;
    }
    if (!clientSecret) {
      setError("Payment is not initialized yet. Please wait a moment and retry.");
      return;
    }

    setLoading(true);
    try {
      // Optional: validate PaymentElement fields before confirming
      const submitRes = await elements.submit();
      if (submitRes?.error) {
        throw new Error(submitRes.error.message || "Please check your payment details.");
      }

      const result = await stripe.confirmPayment({
        elements,
        clientSecret,
        confirmParams: {
          // No redirect needed for standard cards; Stripe may still redirect for some methods
          return_url: `${window.location.origin}/report?paid=1&rid=${encodeURIComponent(reportId)}`,
        },
        redirect: "if_required",
      });

      if (result.error) {
        throw new Error(result.error.message || "Payment failed. Please try again.");
      }

      // If no error, payment is confirmed (or requires action already handled)
      onSuccess(result.paymentIntent?.id);
    } catch (e: any) {
      setError(e?.message || "Payment failed.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={onSubmit} className="max-w-xl w-full space-y-4">
      <div className="rounded-xl border border-gray-200 p-4 bg-white">
        <div className="flex items-baseline justify-between gap-4">
          <div>
            <div className="text-sm text-gray-600">Your contribution</div>
            <div className="text-2xl font-bold">${amountSafe.toFixed(2)}</div>
            {tierLabel ? <div className="text-sm text-gray-600 mt-1">{tierLabel}</div> : null}
          </div>
        </div>
      </div>

      <div className="rounded-xl border border-gray-200 p-4 bg-white">
        {loadingIntent ? (
          <div className="text-sm text-gray-600">Initializing secure payment…</div>
        ) : clientSecret ? (
          <PaymentElement />
        ) : (
          <div className="text-sm text-gray-600">
            Unable to initialize payment. Please refresh the page.
          </div>
        )}
      </div>

      {error ? (
        <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-800">
          {error}
        </div>
      ) : null}

      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={onBack}
          className="px-4 py-2 rounded-md border border-gray-300 text-gray-800 hover:bg-gray-50"
          disabled={loading || loadingIntent}
        >
          ← Back
        </button>

        <button
          type="submit"
          disabled={!stripe || !elements || !clientSecret || loading || loadingIntent}
          className="px-5 py-2.5 rounded-md bg-green-700 text-white hover:bg-green-800 font-semibold disabled:opacity-60"
        >
          {loading ? "Processing…" : "Confirm contribution"}
        </button>
      </div>

      <div className="text-xs text-gray-500">
        Secured by Stripe — PCI DSS compliant. We do not store your card details.
      </div>
    </form>
  );
}
