// lib/legalHolding.ts
// Durée de garde légale des objets trouvés par État (en jours), dérivée des
// guides États vérifiés (lib/stateGuides.ts). 90 jours par défaut : pratique
// la plus répandue quand l'État n'a pas de délai codifié.
const HOLDING_DAYS: Record<string, number> = {
  CA: 90, // Civil Code §2080.2
  FL: 90, // Fla. Stat. ch. 705
  AZ: 30, // ARS §12-941
  WA: 60, // RCW 63.21
  NY: 90, // PPL §253 : 3 mois à 3 ans selon valeur ; 90 j = plancher prudent
  IL: 180, // 765 ILCS 1020 : 6 mois (≤100 $) à 1 an
};

export const DEFAULT_HOLDING_DAYS = 90;

export function holdingDays(stateId?: string | null): number {
  return HOLDING_DAYS[String(stateId || "").toUpperCase()] ?? DEFAULT_HOLDING_DAYS;
}

export function legalDeadline(foundAt: string | Date, stateId?: string | null): string {
  const d = new Date(foundAt);
  d.setDate(d.getDate() + holdingDays(stateId));
  return d.toISOString().slice(0, 10);
}
