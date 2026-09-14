// lib/legalHolding.ts
// Règle de garde légale des objets trouvés, par État.
//
// Source : les entrées ÉCRITES À LA MAIN de lib/stateGuides.ts, seules vérifiées
// avec leurs références. Les 41 États de stateGuidesGenerated.json sont produits
// par recherche automatique et marqués « à relire » : leurs chiffres ne sont pas
// promus ici tant qu'ils n'ont pas été contrôlés, parce qu'une durée légale
// fausse affichée sur des milliers de pages est pire que pas de durée du tout.
//
// Trois situations existent réellement, et la troisième est souvent la plus
// utile au visiteur : savoir qu'aucun délai ne le protège change ce qu'il fait.
export type HoldingRule = {
  kind: "fixed" | "scaled" | "local";
  /** Uniquement pour kind === "fixed". */
  days?: number;
  /** Libellé court si « N days » serait imprécis (ex. PR : 3 mois depuis l'avis). */
  shortLabel?: string;
  citation?: string;
  /** Phrase affichable telle quelle après « In {State}, ». */
  note: string;
};

const HOLDING: Record<string, HoldingRule> = {
  CA: {
    kind: "fixed",
    days: 90,
    citation: "California Civil Code §2080.2",
    note: "found property must be held by law enforcement for at least 90 days before it can pass to the finder, be auctioned or disposed of.",
  },
  FL: {
    kind: "fixed",
    days: 90,
    citation: "Florida Statutes ch. 705",
    note: "the legal window is 90 days once the item is in law enforcement custody. Hotels, airports and theme parks set their own, often much shorter, retention policies.",
  },
  WA: {
    kind: "fixed",
    days: 60,
    citation: "RCW 63.21",
    note: "the owner's claim window is 60 days, shorter than in most states, and a finder must report the find within 7 days.",
  },
  AZ: {
    kind: "fixed",
    days: 30,
    citation: "Arizona Revised Statutes §12-941",
    note: "found property held by a public agency can change hands after just 30 days, the shortest official window of any large state.",
  },
  NY: {
    kind: "scaled",
    citation: "New York Personal Property Law §§252-253",
    note: "the holding period scales with the item's value: the more it is worth, the longer the police must keep it. A finder must deposit an item worth $20 or more at a police station within 10 days.",
  },
  IL: {
    kind: "scaled",
    citation: "765 ILCS 1020",
    note: "the holding period depends on value: six months for items under $100, one year above.",
  },
  TX: {
    kind: "local",
    note: "there is no statewide holding period. Each police department, transit agency and venue sets its own retention policy, commonly around 90 days but different in every city, which is why reaching the right desk early is what actually protects you.",
  },
  PA: {
    kind: "local",
    note: "there is no single statewide holding period. Each department, transit agency and venue defines its own retention and claim procedure, often a few months, never guaranteed.",
  },
  OH: {
    kind: "local",
    citation: "Ohio Revised Code §2933.41",
    note: "police must make reasonable efforts to identify the owner, but retention periods are set locally rather than statewide.",
  },
  // Porto Rico n'est pas une juridiction de common law : la règle vient du Code
  // civil de 2020 (loi 55-2020, en vigueur depuis le 28 novembre 2020), art. 749
  // et 31 L.P.R.A. §7965-7966. Vérifié en septembre 2026 sur Justia.
  PR: {
    kind: "fixed",
    days: 90,
    shortLabel: "3 months",
    citation: "Civil Code of Puerto Rico, art. 749 (31 L.P.R.A. §7965)",
    note: "a finder must hand the item to the municipal authority immediately, not to a police station, and the municipality publishes a public notice. Three months after that notice, an unclaimed item, or its value, is awarded to the finder, and an owner who gets the item back owes the finder one tenth of its value (31 L.P.R.A. §7966).",
  },
  GA: {
    kind: "local",
    citation: "OCGA §16-8-6",
    note: "there is no statewide clock. Retention is decided by local policy, and Atlanta's airport runs its own separate circuit.",
  },
};

export const DEFAULT_HOLDING_DAYS = 90;

/** Règle vérifiée pour cet État, ou null si nous ne l'avons pas contrôlée. */
export function holdingRule(stateId?: string | null): HoldingRule | null {
  return HOLDING[String(stateId || "").toUpperCase()] ?? null;
}

/** Durée en jours pour les usages internes (veille, relances). Repli prudent. */
export function holdingDays(stateId?: string | null): number {
  const r = HOLDING[String(stateId || "").toUpperCase()];
  return r?.kind === "fixed" && r.days ? r.days : DEFAULT_HOLDING_DAYS;
}

export function legalDeadline(foundAt: string | Date, stateId?: string | null): string {
  const d = new Date(foundAt);
  d.setDate(d.getDate() + holdingDays(stateId));
  return d.toISOString().slice(0, 10);
}
