// app/sitemap-counties.xml/route.ts
// Sitemap des pages comte. Seuls les comtes qui ont REELLEMENT une page y
// figurent : la meme regle que la page elle-meme (etat active + au moins
// MIN_COUNTY_CITIES villes a guide publie). Aucune URL en 404 n'est poussee.
import { NextResponse } from "next/server";
import { COUNTY_STATES, getEligibleCountySlugs } from "@/lib/county";

export const revalidate = 86400;

const BASE = "https://reportlost.org";

export async function GET() {
  const urls: string[] = [];

  for (const stateAbbr of COUNTY_STATES) {
    try {
      const slugs = await getEligibleCountySlugs(stateAbbr);
      for (const slug of slugs) {
        urls.push(
          `<url><loc>${BASE}/lost-and-found/${stateAbbr.toLowerCase()}/county/${slug}</loc>` +
            `<changefreq>weekly</changefreq></url>`
        );
      }
    } catch {
      /* un etat en echec ne doit pas vider tout le sitemap */
    }
  }

  const xml =
    `<?xml version="1.0" encoding="UTF-8"?>\n` +
    `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n` +
    urls.join("\n") +
    `\n</urlset>`;

  return new NextResponse(xml, {
    headers: {
      "Content-Type": "application/xml; charset=utf-8",
      "Cache-Control": "public, max-age=0, s-maxage=86400, stale-while-revalidate=86400",
    },
  });
}
