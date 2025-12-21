// app/api/create-payment-intent/route.ts
import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const stripeKey = process.env.STRIPE_SECRET_KEY!;
if (!stripeKey) {
  throw new Error("Missing STRIPE_SECRET_KEY");
}

const stripe = new Stripe(stripeKey, { apiVersion: "2024-06-20" as any });

// 🔐 Protection
const PAYMENT_API_KEY = (process.env.PAYMENT_API_KEY || "").trim();
const PAYMENT_ALLOWED_ORIGINS = (process.env.PAYMENT_ALLOWED_ORIGINS || "").trim();
// Exemple: PAYMENT_ALLOWED_ORIGINS="https://reportlost.org,https://www.reportlost.org"

function getAllowedOrigins(): string[] {
  if (PAYMENT_ALLOWED_ORIGINS) {
    return PAYMENT_ALLOWED_ORIGINS
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
  }
  const site = (process.env.NEXT_PUBLIC_SITE_URL || "").trim();
  return site ? [site] : ["https://reportlost.org"];
}

function getCorsOrigin(req: NextRequest): string | null {
  const origin = req.headers.get("origin");
  if (!origin) return null;

  const allowed = getAllowedOrigins();
  return allowed.includes(origin) ? origin : "null";
}

function hasValidPaymentKey(req: NextRequest): boolean {
  // Si PAYMENT_API_KEY n'est pas défini, la route reste ouverte (pas recommandé).
  if (!PAYMENT_API_KEY) return true;

  const auth = req.headers.get("authorization") || "";
  if (!auth.startsWith("Bearer ")) return false;

  const token = auth.slice("Bearer ".length).trim();
  return token === PAYMENT_API_KEY;
}

// Limites de sécurité côté serveur
const MIN_AMOUNT_USD = 100; // $1.00
const MAX_AMOUNT_USD = 50000; // $500.00
const ALLOWED_CURRENCY = new Set(["usd"]);

function json(data: any, init?: ResponseInit, origin?: string | null) {
  const res = NextResponse.json(data, init);
  res.headers.set("Cache-Control", "no-store");

  // CORS (si origin non fourni, on n'ajoute rien)
  if (origin) {
    res.headers.set("Access-Control-Allow-Origin", origin);
    res.headers.set("Vary", "Origin");
  }

  return res;
}

export async function OPTIONS(req: NextRequest) {
  const origin = getCorsOrigin(req);

  return new Response(null, {
    status: 204,
    headers: {
      ...(origin ? { "Access-Control-Allow-Origin": origin, Vary: "Origin" } : {}),
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Idempotency-Key, Authorization",
      "Cache-Control": "no-store",
    },
  });
}

export async function POST(req: NextRequest) {
  const origin = getCorsOrigin(req);

  // 🔐 Auth
  if (!hasValidPaymentKey(req)) {
    return json({ ok: false, error: "Unauthorized" }, { status: 401 }, origin);
  }

  try {
    const ct = req.headers.get("content-type") || "";
    if (!ct.includes("application/json")) {
      return json(
        { ok: false, error: "Content-Type must be application/json" },
        { status: 415 },
        origin
      );
    }

    const body = (await req.json().catch(() => null)) as {
      amount?: number | string;
      currency?: string;
      reportId?: string | number;
      reportPublicId?: string;
      description?: string;
    } | null;

    if (!body) {
      return json({ ok: false, error: "Invalid JSON body" }, { status: 400 }, origin);
    }

    // --- Validation montant ---
    const numericAmount = Number(body.amount);
    if (!Number.isFinite(numericAmount) || numericAmount <= 0) {
      return json({ ok: false, error: "Invalid amount" }, { status: 400 }, origin);
    }

    const amountInCents = Math.round(numericAmount * 100);
    if (amountInCents < MIN_AMOUNT_USD || amountInCents > MAX_AMOUNT_USD) {
      return json(
        {
          ok: false,
          error: `Amount must be between ${(MIN_AMOUNT_USD / 100).toFixed(2)} and ${(MAX_AMOUNT_USD / 100).toFixed(
            2
          )} USD`,
        },
        { status: 400 },
        origin
      );
    }

    // --- Devise ---
    const currency = (body.currency ?? "usd").toLowerCase();
    if (!ALLOWED_CURRENCY.has(currency)) {
      return json({ ok: false, error: "Unsupported currency" }, { status: 400 }, origin);
    }

    // --- Idempotency ---
    // Stripe attend "idempotencyKey" via l'option de requête.
    // On récupère le header de façon robuste (minuscule + forme canonique).
    const clientIdem =
      req.headers.get("idempotency-key") || req.headers.get("Idempotency-Key") || undefined;

    const fallbackIdem =
      body.reportId != null ? `report-${String(body.reportId)}-${amountInCents}-${currency}` : undefined;

    const idempotencyKey = clientIdem ?? fallbackIdem;

    // --- Description & metadata ---
    const description =
      body.description?.slice(0, 255) ||
      (body.reportId ? `ReportLost contribution for report #${body.reportId}` : "ReportLost contribution");

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

    return json(
      {
        ok: true,
        id: paymentIntent.id,
        clientSecret: paymentIntent.client_secret, // nécessaire côté client
      },
      { status: 200 },
      origin
    );
  } catch (err: any) {
    // Normalisation des erreurs Stripe
    if (err && typeof err === "object" && String(err.type || "").startsWith("Stripe")) {
      console.error("Stripe error:", err);
      return json({ ok: false, error: err.message ?? "Stripe error" }, { status: 400 }, origin);
    }

    console.error("Unexpected error (create-payment-intent):", err);
    return json({ ok: false, error: "Unexpected server error" }, { status: 500 }, origin);
  }
}
