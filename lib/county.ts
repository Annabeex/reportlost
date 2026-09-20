// lib/county.ts
// Helpers partages par la page comte et par les pages qui pointent vers elle.
// Next.js interdit d'exporter autre chose que ses propres champs depuis un
// fichier de page : ces utilitaires doivent donc vivre ici.

/** Etats ou les pages comte sont actives. Elargir apres mesure. */
export const COUNTY_STATES = new Set(["FL"]);

/** En dessous, le comte n'a pas assez de substance pour meriter une page. */
export const MIN_COUNTY_CITIES = 3;

export function countyToSlug(name: string): string {
  return String(name)
    .toLowerCase()
    .normalize("NFD").replace(/[̀-ͯ]/g, "")
    .replace(/&/g, "and")
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

export function isCountyState(stateAbbr?: string | null): boolean {
  return COUNTY_STATES.has(String(stateAbbr || "").toUpperCase());
}

export function countyPath(stateAbbr: string, countyName: string): string {
  return `/lost-and-found/${String(stateAbbr).toLowerCase()}/county/${countyToSlug(countyName)}`;
}
