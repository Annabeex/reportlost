import { getSupabaseAdmin } from "@/lib/supabaseAdmin";

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


type CountyCityRow = { city_ascii: string; county_name: string | null; population: number | null };

/** Villes de l'État qui ont un guide publié, indexées par slug de comté. */
export async function getCountyIndex(stateAbbr: string) {
  const sb = getSupabaseAdmin({ fresh: false });
  if (!sb) return null;

  // 1) villes de l'État avec leur comté
  const cities: CountyCityRow[] = [];
  for (let from = 0; ; from += 1000) {
    const { data, error } = await sb
      .from("us_cities")
      .select("city_ascii, county_name, population")
      .eq("state_id", stateAbbr)
      .order("population", { ascending: false })
      .range(from, from + 999);
    if (error || !data?.length) break;
    cities.push(...(data as CountyCityRow[]));
    if (data.length < 1000) break;
  }
  if (!cities.length) return null;

  // 2) celles qui ont un guide publié
  const published = new Set<string>();
  for (let from = 0; ; from += 1000) {
    const { data, error } = await sb
      .from("city_guides")
      .select("city_slug")
      .eq("state_id", stateAbbr)
      .eq("status", "published")
      .range(from, from + 999);
    if (error || !data?.length) break;
    for (const g of data) if (g.city_slug) published.add(String(g.city_slug));
    if (data.length < 1000) break;
  }

  // 3) regroupement par comté, villes à guide publié uniquement
  const byCounty = new Map<string, { name: string; cities: CountyCityRow[] }>();
  for (const c of cities) {
    if (!c.county_name) continue;
    if (!published.has(String(c.city_ascii || "").trim().toLowerCase())) continue;
    const slug = countyToSlug(c.county_name);
    if (!byCounty.has(slug)) byCounty.set(slug, { name: c.county_name, cities: [] });
    byCounty.get(slug)!.cities.push(c);
  }
  return byCounty;
}

/** Slugs de comtes qui ont reellement une page (assez de villes couvertes). */
export async function getEligibleCountySlugs(stateAbbr: string): Promise<Set<string>> {
  if (!isCountyState(stateAbbr)) return new Set();
  const idx = await getCountyIndex(stateAbbr);
  if (!idx) return new Set();
  const out = new Set<string>();
  for (const [slug, v] of idx.entries()) {
    if (v.cities.length >= MIN_COUNTY_CITIES) out.add(slug);
  }
  return out;
}
