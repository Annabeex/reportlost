// lib/ca/caCityRow.ts
// 🇨🇦 Retrouve la ligne ca_cities d'un guide (photo, coordonnées).
// Le slug du guide ("toronto", "greater-sudbury") ne correspond pas toujours
// exactement à ca_cities.city_ascii : on essaie le slug, puis le slug avec des
// espaces, puis le nom affiché. Comparaisons insensibles à la casse.
import type { SupabaseClient } from "@supabase/supabase-js";
import type { CaCityRow } from "@/lib/ca/cityGuide";

const COLS = "id, province_id, province_name, city, city_ascii, lat, lng, image_url, image_alt";

export async function loadCaCityRow(
  sb: SupabaseClient,
  province: string,
  citySlug: string,
  cityName?: string
): Promise<CaCityRow | null> {
  const prov = String(province || "").toUpperCase();
  const slug = String(citySlug || "").trim().toLowerCase();
  const tries: Array<[string, string]> = [
    ["city_ascii", slug],
    ["city_ascii", slug.replace(/-/g, " ")],
  ];
  if (cityName) tries.push(["city", cityName]);

  for (const [col, val] of tries) {
    if (!val) continue;
    try {
      const { data } = await sb
        .from("ca_cities")
        .select(COLS)
        .eq("province_id", prov)
        .ilike(col, val)
        .limit(1)
        .maybeSingle();
      if (data) return data as CaCityRow;
    } catch {
      /* essai suivant */
    }
  }
  return null;
}
