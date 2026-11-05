// app/sitemap-ca.xml/route.ts
// 🇨🇦 Sitemap du Canada : UNIQUEMENT les guides de ville publiés
// (ca_city_guides.status = 'published'). Un brouillon n'y figure jamais.
// Quand une ville a ses deux langues, chaque entrée porte ses paires hreflang.
// C'est le sitemap à lire dans la Search Console pour la porte de la phase 4.
import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";

export const revalidate = 86400;

const BASE = "https://reportlost.org";

type Row = { province_id: string; city_ascii: string; lang: "en" | "fr"; updated_at: string | null };

const pathFor = (r: { province_id: string; city_ascii: string; lang: string }) =>
  `${r.lang === "fr" ? "/ca/fr" : "/ca"}/${r.province_id.toLowerCase()}/${r.city_ascii}`;

export async function GET() {
  const sb = getSupabaseAdmin({ fresh: false });
  let rows: Row[] = [];
  if (sb) {
    const { data } = await sb
      .from("ca_city_guides")
      .select("province_id, city_ascii, lang, updated_at")
      .eq("status", "published")
      .order("province_id")
      .order("city_ascii");
    rows = (data || []) as Row[];
  }

  const key = (r: Row) => `${r.province_id}|${r.city_ascii}`;
  const byCity = new Map<string, Row[]>();
  for (const r of rows) byCity.set(key(r), [...(byCity.get(key(r)) || []), r]);

  const entries = rows.map((r) => {
    const twins = byCity.get(key(r)) || [];
    const alt =
      twins.length > 1
        ? twins
            .map((t) => `<xhtml:link rel="alternate" hreflang="${t.lang}-CA" href="${BASE}${pathFor(t)}"/>`)
            .join("") +
          `<xhtml:link rel="alternate" hreflang="x-default" href="${BASE}${pathFor({ ...r, lang: "en" })}"/>`
        : "";
    const lm = r.updated_at ? `<lastmod>${new Date(r.updated_at).toISOString()}</lastmod>` : "";
    return `<url><loc>${BASE}${pathFor(r)}</loc>${lm}${alt}</url>`;
  });

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">
${entries.join("\n")}
</urlset>`;

  return new NextResponse(xml, {
    headers: { "Content-Type": "application/xml", "Cache-Control": "public, max-age=86400" },
  });
}
