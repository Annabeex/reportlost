// lib/orgDisposition.ts
//
// Ce que devient un objet quand il quitte le bureau.
//
// À ne pas confondre avec legal_deadline, qui est une ÉLIGIBILITÉ : elle dit à
// partir de quand le bureau A LE DROIT de s'en séparer, pas ce qu'il a fait.
// Un objet peut rester des mois sur l'étagère après sa date. Les horloges de
// suppression partent donc d'ici, jamais de l'échéance.

export type Disposition =
  | "transferred_police"
  | "donated"
  | "discarded"
  | "returned_owner";

export const DISPOSITIONS: { v: Disposition; label: string; hint: string }[] = [
  { v: "transferred_police", label: "Transferred to police", hint: "Department and report number" },
  { v: "donated", label: "Donated", hint: "Which charity or organization" },
  { v: "discarded", label: "Discarded", hint: "Reason, if useful" },
  { v: "returned_owner", label: "Returned to the owner", hint: "Who collected it" },
];

export function isDisposition(v: unknown): v is Disposition {
  return DISPOSITIONS.some((d) => d.v === v);
}

export function dispositionLabel(v?: string | null): string {
  return DISPOSITIONS.find((d) => d.v === v)?.label || "";
}

/** Statuts qui font sortir l'objet du bureau : c'est là qu'on demande où il va. */
export const LEAVING_STATUSES = new Set(["returned", "disposed"]);

/** Jours après le départ réel avant suppression de la photo. */
export const PHOTO_PURGE_DAYS = 30;
/** Jours après le départ réel avant suppression de la fiche. */
export const RECORD_PURGE_DAYS = 365;
