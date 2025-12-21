import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";

export const runtime = "nodejs";          // Stripe nécessite Node runtime
export const dynamic = "force-dynamic";   // pas de mise en cache de route

const stripeKey = process.env.STRIPE_SECRET_KEY!;
const stripe = new Stripe(stripeKey, { apiVersion: "2024-06-20" as any });

// Limites de sécurité côté serveur
const MIN_AMOUNT_USD = 100;    // $1.00
const MAX_AMOUNT_USD = 50000;  // $500.00
const ALLOWED_CURRENCY = new Set(["usd"]);

// ---------- CORS helpers ----------
function getAllowedOrigins(): string[] {
  const env = (process.env.PAYMENT_ALLOWED_ORIGINS || "").trim();
  if (env) {
    return env.split(",").map(s => s.trim()).filter(Boolean);
  }
  const site = (process.env.NEXT_PUBLIC_SITE_URL || "").trim();
  return site ? [site] : [];
}

function getCorsOrigin(req: NextRequest): string | null {
  const origin = req.headers.get("origin");
  if (!origin) return null;
  const allowed = getAllowedOrigins();
  if (!allowed.length) return origin;
  return allowed.includes(origin) ? origin : "null";
}

// ---------- JSON helper ----------
function json(data: any, init?: ResponseInit, origin?: string | null) {
  const res = NextResponse.json(data, init);
  res.headers.set("Cache-Control", "no-store");
  if (origin) {
    res.headers.set("Access-Control-Allow-Origin", origin);
  }
  res.headers.set("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.headers.set(
    "Access-Control-Allow-Headers",
    "Content-Type, Idempotency-Key"
  );
  return res;
}

// ---------- OPTIONS (preflight) ----------
export async function OPTIONS(req: NextRequest) {
  const origin = getCorsOrigin(req);
  return new Response(null, {
    status: 204,
    headers: {
      ...(origin ? { "Access-Control-Allow-Origin": origin } : {}),
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Idempotency-Key",
      "Cache-Control": "no-store",
    },
  });
}

// ---------- POST ----------
export async function POST(req: NextRequest) {
  const origin = getCorsOrigin(req);

  try {
    // Vérifie le Content-Type
    const ct = req.headers.get("content-type") || "";
    if (!ct.includes("application/json")) {
      return json(
        { error: "Content-Type must be application/json" },
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
      return json({ error: "Invalid JSON body" }, { status: 400 }, origin);
    }

    // --- Validation du montant ---
    const numericAmount = Number(body.amount);
    if (!Number.isFinite(numericAmount) || numericAmount <= 0) {
      return json({ error: "Invalid amount" }, { status: 400 }, origin);
    }

    const amountInCents = Math.round(numericAmount * 100);
    if (amountInCents < MIN_AMOUNT_USD || amountInCents > MAX_AMOUNT_USD) {
      return json(
        {
          error: `Amount must be between ${(MIN_AMOUNT_USD / 100).toFixed(
            2
          )} and ${(MAX_AMOUNT_USD / 100).toFixed(2)} USD`,
        },
        { status: 400 },
        origin
      );
    }

    // --- Devise ---
    const currency = (body.currency ?? "usd").toLowerCase();
    if (!ALLOWED_CURRENCY.has(currency)) {
      return json({ error: "Unsupported currency" }, { status: 400 }, origin);
    }

    // --- Idempotency ---
    const clientIdem = req.headers.get("Idempotency-Key") || undefined;
    const fallbackIdem =
      body.reportId != null
        ? `report-${String(body.reportId)}-${amountInCents}-${currency}`
        : undefined;

    const idempotencyKey = clientIdem ?? fallbackIdem;

    // --- Description & metadata ---
    const description =
      body.description?.slice(0, 255) ||
      (body.reportId
        ? `ReportLost contribution for report #${body.reportId}`
        : "ReportLost contribution");

    const metadata: Record<string, string> = {};
    if (body.reportId != null) metadata.report_id = String(body.reportId);
    if (body.reportPublicId)
      metadata.report_public_id = String(body.reportPublicId);

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
        id: paymentIntent.id,
        clientSecret: paymentIntent.client_secret,
      },
      { status: 200 },
      origin
    );
  } catch (err: any) {
    if (err?.type?.startsWith("Stripe")) {
      console.error("Stripe error:", err);
      return json(
        { error: err.message ?? "Stripe error" },
        { status: 400 },
        origin
      );
    }

    console.error("Unexpected error (create-payment-intent):", err);
    return json(
      { error: "Unexpected server error" },
      { status: 500 },
      origin
    );
  }
}
