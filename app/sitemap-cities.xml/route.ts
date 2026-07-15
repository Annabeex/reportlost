// app/sitemap-cities.xml/route.ts
// Sitemap des pages ville — UNIQUEMENT les villes enrichies (guide publié)
// plus les 5 pages historiques codées en dur. Les ~29k villes sans guide
// restent servies mais ne sont plus poussées à Google : on concentre le
// crawl sur les pages de qualité. Dès qu'un guide est publié, sa ville
// réapparaît ici automatiquement (cache 24h).
import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";
import { buildCityPath } from "@/lib/slugify";

export const revalidate = 86400;

const BASE = "https://reportlost.org";

// Pages ville historiques (contenu dédié codé en dur, hors city_guides)
const LEGACY: { state: string; city: string }[] = [
  { state: "NY", city: "new york" },
  { state: "CA", city: "los angeles" },
  { state: "IL", city: "chicago" },
  { state: "TX", city: "houston" },
  { state: "AZ", city: "phoenix" },
];

export async function GET() {
  const sb = getSupabaseAdmin({ fresh: false });
  if (!sb) return new NextResponse("Service unavailable", { status: 503 });

  // Guides publiés (pagination : Supabase plafonne ~1000 lignes par requête)
  const rows: { state_id: string; city_slug: string; updated_at: string | null }[] = [];
  const PAGE = 1000;
  for (let from = 0; ; from += PAGE) {
    const { data, error } = await sb
      .from("city_guides")
      .select("state_id, city_slug, updated_at")
      .eq("status", "published")
      .order("id", { ascending: true })
      .range(from, from + PAGE - 1);
    if (error || !data?.length) break;
    rows.push(...(data as any[]));
    if (data.length < PAGE) break;
  }

  const seen = new Set<string>();
  const entries: string[] = [];

  for (const { state, city } of LEGACY) {
    const path = buildCityPath(state, city);
    seen.add(path);
    entries.push(`<url><loc>${BASE}${path}</loc><changefreq>weekly</changefreq></url>`);
  }

  for (const r of rows) {
    if (!r.state_id || !r.city_slug) continue;
    const path = buildCityPath(r.state_id, r.city_slug);
    if (seen.has(path)) continue;
    seen.add(path);
    const lm = r.updated_at ? `<lastmod>${new Date(r.updated_at).toISOString()}</lastmod>` : "";
    entries.push(`<url><loc>${BASE}${path}</loc>${lm}<changefreq>weekly</changefreq></url>`);
  }

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${entries.join("\n")}
</urlset>`;

  return new NextResponse(xml, {
    headers: { "Content-Type": "application/xml", "Cache-Control": "public, max-age=86400" },
  });
}
