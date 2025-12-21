// scripts/generate-sitemap.ts
import "dotenv/config";
import fs from "fs";
import path from "path";
import { createClient } from "@supabase/supabase-js";

// ⚠️ Variables d'env requises (.env en local / variables du déploiement)
const SUPABASE_URL = process.env.SUPABASE_URL!;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!SUPABASE_URL || !SUPABASE_KEY) {
  throw new Error("Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY env vars");
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

const BATCH_SIZE = 50_000; // 50k URLs max par sitemap
const PUBLIC_URL = "https://reportlost.org";
const PUBLIC_DIR = path.join(process.cwd(), "public");

// ----------------------------- Utils -----------------------------
function slugify(str: string) {
  return (str || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .replace(/&/g, "and")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)+/g, "");
}

function toStateIdSlug(s: string) {
  return (s || "").toLowerCase();
}

function wrapUrlsInXml(urls: string[]) {
  const now = new Date().toISOString();
  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls
  .map(
    (url) =>
      `<url><loc>${url}</loc><lastmod>${now}</lastmod><changefreq>monthly</changefreq><priority>0.8</priority></url>`
  )
  .join("\n")}
</urlset>`;
}

function buildSitemapIndex(files: string[]) {
  const now = new Date().toISOString();
  return `<?xml version="1.0" encoding="UTF-8"?>
<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${files
  .map(
    (file) =>
      `<sitemap><loc>${PUBLIC_URL}/${file}</loc><lastmod>${now}</lastmod></sitemap>`
  )
  .join("\n")}
</sitemapindex>`;
}

// Empêche d'ajouter au sitemap des routes non publiques / techniques.
// (On garde bien sûr tes pages publiques : /report, /help, /privacy, etc.)
function isAllowedPublicPath(pathname: string) {
  // normalise
  const p = (pathname || "").trim();
  if (!p.startsWith("/")) return false;

  // ❌ Exclusions non publiques / techniques
  if (p.startsWith("/admin")) return false;
  if (p.startsWith("/api/")) return false;
  if (p.startsWith("/poster-preview")) return false;
  if (p.startsWith("/case/")) return false; // <-- important : pas indexé / pas listé
  if (p === "/case") return false;

  return true;
}

// ----------------------------- Main -----------------------------
async function main() {
  console.log("🔄 Generating sitemap from Supabase...");

  // 0) Assure le dossier public/
  if (!fs.existsSync(PUBLIC_DIR)) fs.mkdirSync(PUBLIC_DIR);

  // 0bis) Nettoie les anciens sitemaps pour éviter les entrées périmées
  for (const f of fs.readdirSync(PUBLIC_DIR)) {
    if (/^sitemap-\d+\.xml$/.test(f)) {
      fs.unlinkSync(path.join(PUBLIC_DIR, f));
    }
  }

  // 1) Villes — pagination Supabase (limite ~1000 par page)
  type CityRow = { city_ascii: string; state_id: string | null };
  const PAGE = 1000;
  let from = 0;
  let to = PAGE - 1;
  let cities: CityRow[] = [];

  for (;;) {
    const { data, error } = await supabase
      .from("us_cities")
      .select("city_ascii, state_id")
      .order("id", { ascending: true })
      .range(from, to);

    if (error) throw new Error("Supabase error (cities): " + error.message);
    if (!data || data.length === 0) break;

    cities = cities.concat(data as CityRow[]);
    if (data.length < PAGE) break;

    from += PAGE;
    to += PAGE;
  }

  console.log(`📦 Chargé ${cities.length} villes depuis Supabase`);

  // Filtre sécurité : on garde seulement les villes avec state_id non vide (2 lettres)
  const validCities = (cities || []).filter(
    (c) => typeof c.state_id === "string" && c.state_id.trim().length === 2
  );

  // 2) Catégories (peu nombreuses : pas besoin de paginer)
  // Si la table n'existe pas ou si tu ne l'utilises pas, tu peux commenter ce bloc.
  const { data: categories, error: catError } = await supabase
    .from("categories")
    .select("name");

  if (catError) {
    console.warn("⚠️ Supabase warning (categories): " + catError.message);
  }

  // 3) Pages statiques PUBLIQUES
  const staticPaths = [
    "/",
    "/report",
    "/help",
    "/about",
    "/contact",
    "/privacy",
    "/terms",
    "/cookies",
    "/legal",
    "/lost-and-found",
    "/login",
  ];

  const staticPages = staticPaths
    .filter(isAllowedPublicPath)
    .map((p) => `${PUBLIC_URL}${p === "/" ? "" : p}`);

  // 4) Catégories
  const categoryUrls =
    (categories || [])
      .map(({ name }: any) => `/category/${slugify(String(name || ""))}`)
      .filter(isAllowedPublicPath)
      .map((p) => `${PUBLIC_URL}${p}`) || [];

  // 5) États (unicité + normalisation)
  const uniqueStates = [
    ...new Set(validCities.map(({ state_id }) => (state_id || "").toUpperCase())),
  ].filter(Boolean);

  const stateUrls = uniqueStates
    .map((abbr) => `/lost-and-found/${toStateIdSlug(abbr)}`)
    .filter(isAllowedPublicPath)
    .map((p) => `${PUBLIC_URL}${p}`);

  // 6) Villes
  const cityUrls = validCities
    .map(({ city_ascii, state_id }) => {
      const p = `/lost-and-found/${toStateIdSlug(state_id!)}/${slugify(city_ascii)}`;
      return p;
    })
    .filter(isAllowedPublicPath)
    .map((p) => `${PUBLIC_URL}${p}`);

  // 7) Regrouper + dédupe
  const allUrls = Array.from(
    new Set([...staticPages, ...categoryUrls, ...stateUrls, ...cityUrls])
  );

  console.log(`🔗 Total URLs à écrire: ${allUrls.length}`);

  // 8) Découpe en lots et écriture sitemap-*.xml (≤ 50k URLs / fichier)
  const sitemaps: string[] = [];
  for (let i = 0; i < allUrls.length; i += BATCH_SIZE) {
    const batch = allUrls.slice(i, i + BATCH_SIZE);
    const xml = wrapUrlsInXml(batch);
    const filename = `sitemap-${sitemaps.length + 1}.xml`;
    fs.writeFileSync(path.join(PUBLIC_DIR, filename), xml, "utf8");
    sitemaps.push(filename);
    console.log(`✅ Created ${filename} with ${batch.length} URLs`);
  }

  // 9) Index
  const indexXml = buildSitemapIndex(sitemaps);
  fs.writeFileSync(path.join(PUBLIC_DIR, "sitemap.xml"), indexXml, "utf8");
  console.log("✅ sitemap.xml (index) created.");

  // 10) robots.txt : s’assure que le sitemap est déclaré
  const robotsPath = path.join(PUBLIC_DIR, "robots.txt");
  const sitemapLine = `Sitemap: ${PUBLIC_URL}/sitemap.xml`;

  if (!fs.existsSync(robotsPath)) {
    fs.writeFileSync(
      robotsPath,
      `User-agent: *\nAllow: /\n${sitemapLine}\n`,
      "utf8"
    );
    console.log("ℹ️ Created robots.txt with Sitemap directive.");
  } else {
    const content = fs.readFileSync(robotsPath, "utf8");
    if (!content.includes(sitemapLine)) {
      fs.writeFileSync(robotsPath, content.trim() + `\n${sitemapLine}\n`, "utf8");
      console.log("ℹ️ Updated robots.txt to include Sitemap directive.");
    }
  }

  console.log("🎉 Done.");
}

main().catch((e) => {
  console.error("❌ Error generating sitemap:", e);
  process.exit(1);
});
