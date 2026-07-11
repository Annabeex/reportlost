// app/sitemap-reports.xml/route.ts
// Sitemap des signalements publics (/lost/slug), avec lastmod réel — cache 1h.
import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";

export const revalidate = 3600;

const BASE = "https://reportlost.org";

export async function GET() {
  const sb = getSupabaseAdmin({ fresh: false });
  if (!sb) return new NextResponse("Service unavailable", { status: 503 });

  const rows: { slug: string; created_at: string | null }[] = [];
  const PAGE = 1000;
  for (let from = 0; ; from += PAGE) {
    const { data, error } = await sb
      .from("lost_items")
      .select("slug, created_at")
      .not("slug", "is", null)
      .order("created_at", { ascending: false })
      .range(from, from + PAGE - 1);
    if (error || !data?.length) break;
    rows.push(...(data as any[]));
    if (data.length < PAGE) break;
  }

  const urls = rows
    .filter((r) => r.slug)
    .map((r) => {
      const lastmod = r.created_at ? `<lastmod>${new Date(r.created_at).toISOString()}</lastmod>` : "";
      return `<url><loc>${BASE}/lost/${encodeURIComponent(r.slug)}</loc>${lastmod}<changefreq>weekly</changefreq></url>`;
    })
    .join("");

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls}
</urlset>`;

  return new NextResponse(xml, {
    headers: { "Content-Type": "application/xml", "Cache-Control": "public, max-age=3600" },
  });
}
