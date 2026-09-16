// lib/orgRetention.ts
//
// Combien de temps un établissement garde un objet trouvé — et surtout D'OÙ
// vient ce chiffre.
//
// lib/legalHolding.ts encadre la garde PAR LES FORCES DE L'ORDRE : c'est la
// bonne règle pour un commissariat ou un service municipal, et elle n'a aucune
// valeur juridique pour une université, un hôtel ou un aéroport, qui appliquent
// leur propre politique. Afficher « 90 days » à NYU au motif que la loi de New
// York le dit, c'est écrire une contre-vérité sur leur écran de dépôt.
//
// D'où trois cas, et un seul endroit pour les trancher :
//   1. retention_days renseigné  → la politique de l'établissement fait foi
//   2. police / mairie           → la loi de l'État
//   3. tout le reste, non réglé  → 30 jours par défaut, MARQUÉS À CONFIRMER
//
// Le cas 3 n'est pas un chiffre juste, c'est un chiffre provisoire : l'écran
// doit le dire, sinon on reproduit exactement l'erreur qu'on corrige.

import { holdingDays } from "@/lib/legalHolding";

/** Types réellement couverts par les statutes de garde des États. */
const STATUTE_TYPES = new Set(["police", "city"]);

/** Repli des établissements privés et universitaires. La durée la plus
 *  répandue sur les campus américains, NYU comprise. */
export const DEFAULT_POLICY_DAYS = 30;

export const MIN_RETENTION_DAYS = 1;
export const MAX_RETENTION_DAYS = 3650;

export type RetentionSource = "policy" | "state" | "unconfirmed";

export type Retention = {
  days: number;
  source: RetentionSource;
  /** false ⇒ chiffre provisoire, l'écran doit demander confirmation. */
  confirmed: boolean;
  /** Libellé prêt à afficher, la source incluse. */
  label: string;
};

type OrgLike = {
  type?: string | null;
  state_id?: string | null;
  retention_days?: number | null;
};

export function normalizeRetentionDays(v: unknown): number | null {
  const n = Math.round(Number(v));
  if (!Number.isFinite(n)) return null;
  if (n < MIN_RETENTION_DAYS || n > MAX_RETENTION_DAYS) return null;
  return n;
}

export function orgRetention(org: OrgLike): Retention {
  const own = normalizeRetentionDays(org?.retention_days);
  if (own) {
    return { days: own, source: "policy", confirmed: true, label: `Your policy · ${own} days` };
  }

  const type = String(org?.type || "").toLowerCase();
  if (STATUTE_TYPES.has(type)) {
    const days = holdingDays(org?.state_id);
    const st = String(org?.state_id || "").toUpperCase();
    return {
      days,
      source: "state",
      confirmed: true,
      label: st ? `State law (${st}) · ${days} days` : `State law · ${days} days`,
    };
  }

  return {
    days: DEFAULT_POLICY_DAYS,
    source: "unconfirmed",
    confirmed: false,
    label: `${DEFAULT_POLICY_DAYS} days · confirm your policy`,
  };
}

/** Date limite de garde, au format YYYY-MM-DD. */
export function retentionDeadline(org: OrgLike, foundAt: string | Date): string {
  const d = new Date(foundAt);
  d.setDate(d.getDate() + orgRetention(org).days);
  return d.toISOString().slice(0, 10);
}
