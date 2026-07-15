// app/sitemap-reports.xml/route.ts
// Sitemap des signalements publics (/lost/slug) — cache 1h.
// Filtres qualité : signalements des 12 derniers mois uniquement, avec une
// description substantielle (les fiches quasi vides diluent le crawl et
// tirent l'évaluation du domaine vers le bas). Les pages restent en ligne,
// elles ne sont juste plus poussées à Google passé ce délai.
import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";

export const revalidate = 3600;

const BASE = "https://reportlost.org";
const MAX_AGE_DAYS = 365;
const MIN_DESCRIPTION_CHARS = 80;

export async function GET() {
  const sb = getSupabaseAdmin({ fresh: false });
  if (!sb) return new NextResponse("Service unavailable", { status: 503 });

  const cutoff = new Date(Date.now() - MAX_AGE_DAYS * 86400000).toISOString();

  const rows: { slug: string; created_at: string | null; description: string | null }[] = [];
  const PAGE = 1000;
  for (let from = 0; ; from += PAGE) {
    const { data, error } = await sb
      .from("lost_items")
      .select("slug, created_at, description")
      .not("slug", "is", null)
      .gte("created_at", cutoff)
      .order("created_at", { ascending: false })
      .range(from, from + PAGE - 1);
    if (error || !data?.length) break;
    rows.push(...(data as any[]));
    if (data.length < PAGE) break;
  }

  const urls = rows
    .filter((r) => r.slug && String(r.description || "").trim().length >= MIN_DESCRIPTION_CHARS)
    .map((r) => {
      const lastmod = r.created_at ? `<lastmod>${new Date(r.created_at).toISOString()}</lastmod>` : "";
      return `<url><loc>${BASE}/lost/${encodeURIComponent(r.slug)}</loc>${lastmod}<changefreq>weekly</changefreq></url>`;
    })
    .join("\n");

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls}
</urlset>`;

  return new NextResponse(xml, {
    headers: { "Content-Type": "application/xml", "Cache-Control": "public, max-age=3600" },
  });
}
