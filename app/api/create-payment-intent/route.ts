// app/api/create-payment-intent/route.ts
import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";

export const runtime = "nodejs";          // Stripe nécessite Node runtime
export const dynamic = "force-dynamic";   // pas de mise en cache de route

const stripeKey = process.env.STRIPE_SECRET_KEY!;
const stripe = new Stripe(stripeKey, { apiVersion: "2024-06-20" as any });

// Limites de sécurité côté serveur (à ajuster selon ton produit)
const MIN_AMOUNT_USD = 100;   // en cents -> $1.00
const MAX_AMOUNT_USD = 50000; // en cents -> $500.00
const ALLOWED_CURRENCY = new Set(["usd"]);

function json(data: any, init?: ResponseInit) {
  const res = NextResponse.json(data, init);
  // Jamais de cache sur la création d’intent
  res.headers.set("Cache-Control", "no-store");
  return res;
}

export async function POST(req: NextRequest) {
  try {
    // Vérifie le Content-Type
    const ct = req.headers.get("content-type") || "";
    if (!ct.includes("application/json")) {
      return json({ error: "Content-Type must be application/json" }, { status: 415 });
    }

    const body = await req.json().catch(() => null) as {
      amount?: number | string;
      currency?: string;
      reportId?: string | number;
      reportPublicId?: string;
      description?: string;
    } | null;

    if (!body) return json({ error: "Invalid JSON body" }, { status: 400 });

    // --- Validation du montant ---
    const numericAmount = Number(body.amount);
    if (!Number.isFinite(numericAmount) || numericAmount <= 0) {
      return json({ error: "Invalid amount" }, { status: 400 });
    }
    const amountInCents = Math.round(numericAmount * 100);
    if (amountInCents < MIN_AMOUNT_USD || amountInCents > MAX_AMOUNT_USD) {
      return json(
        { error: `Amount must be between ${(MIN_AMOUNT_USD/100).toFixed(2)} and ${(MAX_AMOUNT_USD/100).toFixed(2)} USD` },
        { status: 400 }
      );
    }

    // --- Devise ---
    const currency = (body.currency ?? "usd").toLowerCase();
    if (!ALLOWED_CURRENCY.has(currency)) {
      return json({ error: "Unsupported currency" }, { status: 400 });
    }

    // --- Idempotency ---
    // Si le client fournit un header Idempotency-Key, on le réutilise.
    // Sinon, on en dérive un de façon déterministe si reportId est présent.
    const clientIdem = req.headers.get("Idempotency-Key") || undefined;
    const fallbackIdem =
      body.reportId != null ? `report-${String(body.reportId)}-${amountInCents}-${currency}` : undefined;
    const idempotencyKey = clientIdem ?? fallbackIdem;

    // --- Description & metadata ---
    const description =
      (body.description?.slice(0, 255)) ||
      (body.reportId ? `ReportLost contribution for report #${body.reportId}` : "ReportLost contribution");

    // metadata defensif : inclure report_id et report_public_id si fournis
    const metadata: Record<string, string> = {};
    if (body.reportId != null) metadata.report_id = String(body.reportId);
    if (body.reportPublicId) metadata.report_public_id = String(body.reportPublicId);

    const paymentIntent = await stripe.paymentIntents.create(
      {
        amount: amountInCents,
        currency,
        automatic_payment_methods: { enabled: true },
        description,
        metadata: Object.keys(metadata).length ? metadata : undefined,
      },
      idempotencyKey ? { idempotencyKey } : undefined
    );

    return json({
      id: paymentIntent.id,
      clientSecret: paymentIntent.client_secret, // nécessaire côté client pour confirmer
    });
  } catch (err: any) {
    // Normalisation des erreurs Stripe
    if (err && typeof err === "object" && String(err.type || "").startsWith("Stripe")) {
      console.error("Stripe error:", err);
      return json({ error: err.message ?? "Stripe error" }, { status: 400 });
    }
    console.error("Unexpected error (create-payment-intent):", err);
    return json({ error: "Unexpected server error" }, { status: 500 });
  }
}

// (optionnel) Répondre aux préflight si tu appelles cette route depuis un autre domaine
export async function OPTIONS() {
  return new Response(null, {
    status: 204,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Idempotency-Key",
      "Cache-Control": "no-store",
    },
  });
}
