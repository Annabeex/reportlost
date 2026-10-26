// app/sitemap-ca.xml/route.ts
// Sitemap du Canada — VIDE en phase 1, volontairement.
// Phase 2+ : n'y déclarer QUE les villes dont le guide est publié dans
// ca_city_guides (status = 'published'), avec leurs paires hreflang.
// C'est le seul sitemap à lire dans la Search Console pour la porte de la phase 4.
import { NextResponse } from "next/server";

export const revalidate = 86400;

export async function GET() {
  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">
</urlset>`;
  return new NextResponse(xml, {
    headers: { "Content-Type": "application/xml", "Cache-Control": "public, max-age=86400" },
  });
}
