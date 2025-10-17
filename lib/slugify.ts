// /lib/slugify.ts

export default function slugify(str: string): string {
  return str
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)+/g, "");
}

export const toCitySlug = (s: string) => slugify(s);
export const fromCitySlug = (s: string) =>
  s.replace(/-/g, " ").replace(/\s+/g, " ").trim();
export const toStateIdSlug = (s: string) => (s || "").toLowerCase();
export const buildCityPath = (state_id: string, city_ascii: string) =>
  `/lost-and-found/${toStateIdSlug(state_id)}/${toCitySlug(city_ascii)}`;

// === Slug principal des objets perdus ===
export function buildReportSlug(payload: {
  title?: string | null;
  city?: string | null;
  state_id?: string | null;
  transport_type?: string | null;
  transport_type_other?: string | null;
  place_type?: string | null;
  place_type_other?: string | null;
}) {
  const detail =
    payload.transport_type_other?.trim() ||
    payload.transport_type?.trim() ||
    payload.place_type_other?.trim() ||
    payload.place_type?.trim() ||
    "";

  // 1️⃣ Nettoyer la ville : enlever "(PA)" ou équivalent
  const rawCity = (payload.city || "").trim();
  const cityNoParen = rawCity.replace(/\s*\([A-Z]{2}\)\s*$/i, ""); // ex: "Frackville (PA)" → "Frackville"

  // 2️⃣ Slugifier les morceaux principaux
  let citySlug = slugify(cityNoParen);
  const titleSlug = slugify(payload.title || "");
  const detailSlug = slugify(detail);

  // 3️⃣ Identifier le code État
  const st = slugify(payload.state_id || ""); // "pa", "il", etc.

  // Si la ville slugifiée se termine déjà par "-pa" et que st === "pa", on retire ce suffixe
  if (st && citySlug && citySlug.endsWith(`-${st}`)) {
    citySlug = citySlug.slice(0, -(`-${st}`.length));
  }

  // 4️⃣ Construire la base sans doublon
  const parts = [titleSlug, citySlug, detailSlug].filter(Boolean);

  // Ajouter le state_id seulement s'il n'est pas déjà à la fin
  if (st && st.length === 2 && parts[parts.length - 1] !== st) {
    parts.push(st);
  }

  // 5️⃣ Dédoublonnage consécutif
  const dedup: string[] = [];
  for (const tok of parts) {
    if (tok && dedup[dedup.length - 1] !== tok) dedup.push(tok);
  }

  // 6️⃣ Troncature de sécurité
  let base = dedup.join("-");
  if (base.length > 120) base = base.slice(0, 120).replace(/-+$/, "");

  // 7️⃣ Fallback
  return base || `lost-${Date.now()}`;
}
