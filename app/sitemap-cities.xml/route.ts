// app/sitemap-cities.xml/route.ts
// Sitemap des pages ville, généré depuis us_cities (mis en cache 24h).
import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";
import { buildCityPath } from "@/lib/slugify";

export const revalidate = 86400;

const BASE = "https://reportlost.org";

export async function GET() {
  const sb = getSupabaseAdmin({ fresh: false });
  if (!sb) return new NextResponse("Service unavailable", { status: 503 });

  // Pagination : Supabase limite chaque requête (~1000 lignes)
  const rows: { state_id: string; city_ascii: string }[] = [];
  const PAGE = 1000;
  for (let from = 0; ; from += PAGE) {
    const { data, error } = await sb
      .from("us_cities")
      .select("state_id, city_ascii")
      .order("id", { ascending: true })
      .range(from, from + PAGE - 1);
    if (error || !data?.length) break;
    rows.push(...(data as any[]));
    if (data.length < PAGE) break;
  }

  const urls = rows
    .filter((r) => r.state_id && r.city_ascii)
    .map((r) => `<url><loc>${BASE}${buildCityPath(r.state_id, r.city_ascii)}</loc><changefreq>weekly</changefreq></url>`)
    .join("");

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
<url><loc>${BASE}/</loc></url>
<url><loc>${BASE}/report</loc></url>
<url><loc>${BASE}/lost-item-recovery-assistance-usa</loc></url>
<url><loc>${BASE}/lost-pet-poster</loc></url>
<url><loc>${BASE}/lost-and-found</loc></url>
${urls}
</urlset>`;

  return new NextResponse(xml, {
    headers: { "Content-Type": "application/xml", "Cache-Control": "public, max-age=86400" },
  });
}
