// lib/pricing.ts
// Prix par marché. SOURCE UNIQUE des montants facturés et affichés.
//
// Principe : en interne, la formule reste exprimée en « palier » de référence
// américain (0 = gratuit, 12 = Automatic search, 25 = Team-assisted search).
// C'est ce palier qui est stocké dans lost_items.contribution, et que lisent
// les ~50 fichiers qui testent `contribution >= 12` / `>= 25`. Seuls le montant
// facturé par Stripe et les prix affichés changent selon le marché.
// Le montant et la devise réellement payés sont gardés à part
// (lost_items.paid_amount / paid_currency), renseignés par le webhook.
//
// ⚠️ Toute modification d'un prix doit être reportée à l'identique dans
// app/terms/page.tsx (CLAUDE.md : les CGV font foi).

import { isCaProvince } from "@/lib/canada/canadaData";

export type Market = "US" | "CA";

type MarketPricing = {
  currency: "usd" | "cad";
  symbol: string;
  /** Automatic search */
  auto: number;
  /** Team-assisted search (et Pet Priority) */
  team: number;
};

export const PRICING: Record<Market, MarketPricing> = {
  US: { currency: "usd", symbol: "$", auto: 12, team: 25 },
  CA: { currency: "cad", symbol: "CA$", auto: 17, team: 35 },
};

/** Paliers internes (référence US). */
export const TIER_AUTO = 12;
export const TIER_TEAM = 25;

/** Marché déduit du code de région (state_id) : province canadienne → CA. */
export const marketFromRegion = (stateId?: string | null): Market =>
  isCaProvince(stateId) ? "CA" : "US";

/** Montant à facturer pour un palier interne, dans la devise du marché. */
export const chargeFor = (tier: number, market: Market): number => {
  const t = Number(tier) || 0;
  // États-Unis : montant inchangé, à l'identique du comportement historique.
  if (market === "US") return t;
  if (t >= TIER_TEAM) return PRICING[market].team;
  if (t > 0) return PRICING[market].auto;
  return 0;
};

/** Montant formaté : "$12", "CA$17", ou avec décimales "CA$17.00". */
export const money = (amount: number, market: Market, decimals = false): string =>
  `${PRICING[market].symbol}${decimals ? Number(amount).toFixed(2) : Number(amount)}`;

/** Prix affiché d'un palier : priceLabel(12, "CA") → "CA$17". */
export const priceLabel = (tier: number, market: Market, decimals = false): string =>
  money(chargeFor(tier, market), market, decimals);

/**
 * Palier interne correspondant à un paiement Stripe.
 * USD : inchangé, on garde le montant payé (comportement historique).
 * CAD : 35 → 25, 17 → 12 ; tout autre montant est ramené au palier inférieur.
 */
export function tierFromPaid(amount: number, currency?: string | null): number {
  const a = Number(amount) || 0;
  if ((currency || "usd").toLowerCase() !== "cad") return a;
  if (a >= PRICING.CA.team) return TIER_TEAM;
  if (a >= PRICING.CA.auto) return TIER_AUTO;
  return 0;
}

/** Montants acceptés par l'API de paiement pour une devise donnée (hors USD). */
export const ALLOWED_AMOUNTS: Record<string, number[]> = {
  cad: [PRICING.CA.auto, PRICING.CA.team],
};
