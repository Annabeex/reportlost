// app/sitemap-static.xml/route.ts
// Sitemap des pages stables : pages fixes, catégories, états.
// Remplace l'ancien public/sitemap-1.xml (statique, périmé, URLs fausses).
import { NextResponse } from "next/server";
import categoryList from "@/lib/popularCategories";
import states from "@/lib/states";

export const revalidate = 86400;

const BASE = "https://reportlost.org";

// Même slugification que la home (liens catégorie cohérents)
function categoryToSlug(name: string) {
  return String(name)
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/&/g, "and")
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

const STATIC_PATHS = [
  "/",
  "/report",
  "/report-lost-pet",
  "/lost-pet-poster",
  "/lost-item-recovery-assistance-usa",
  "/lost-and-found",
  "/how-it-works",
  "/about",
  "/contact",
  "/helpcenter",
  "/universities",
  "/terms",
  "/privacy",
  "/legal",
  "/cookies",
];

export async function GET() {
  const entries: string[] = [];

  for (const p of STATIC_PATHS) {
    entries.push(`<url><loc>${BASE}${p}</loc><changefreq>monthly</changefreq></url>`);
  }

  for (const c of categoryList) {
    entries.push(
      `<url><loc>${BASE}/lost-and-found/category/${categoryToSlug(c.name)}</loc><changefreq>daily</changefreq></url>`
    );
  }

  for (const s of states as { code: string }[]) {
    entries.push(
      `<url><loc>${BASE}/lost-and-found/${s.code.toLowerCase()}</loc><changefreq>weekly</changefreq></url>`
    );
  }

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${entries.join("\n")}
</urlset>`;

  return new NextResponse(xml, {
    headers: { "Content-Type": "application/xml", "Cache-Control": "public, max-age=86400" },
  });
}
