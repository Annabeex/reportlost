// scripts/refresh-city-seo.mjs
// Régénère title + meta description SEO des villes ENRICHIES (guide publié)
// depuis le contenu du guide. Les pages enrichies avaient gardé les anciens
// titres génériques et des descriptions tronquées, mauvais pour le CTR.
//
// Simulation par défaut :
//   node scripts/refresh-city-seo.mjs           → compte + aperçu
//   node scripts/refresh-city-seo.mjs --apply   → met à jour us_cities
//
// Les pages se rafraîchissent au fil de la journée (ISR 24h).

import fs from "fs";
import { createClient } from "@supabase/supabase-js";

const APPLY = process.argv.includes("--apply");

const env =
  (fs.existsSync(".env.local") ? fs.readFileSync(".env.local", "utf8") : "") +
  "\n" +
  (fs.existsSync(".env") ? fs.readFileSync(".env", "utf8") : "");
const url =
  env.match(/^SUPABASE_URL=([^\s]+)/m)?.[1] ||
  env.match(/^NEXT_PUBLIC_SUPABASE_URL=([^\s]+)/m)?.[1];
const key = env.match(/^SUPABASE_SERVICE_ROLE_KEY=([^\s]+)/m)?.[1];
if (!url || !key) {
  console.error("SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY introuvables dans .env.local");
  process.exit(1);
}
const sb = createClient(url, key, { auth: { persistSession: false } });

const stripHtml = (s) => String(s || "").replace(/<[^>]+>/g, "").replace(/\s+/g, " ").trim();
const titleCase = (s) =>
  String(s)
    .split(/\s+/)
    .map((w) => (w ? w.charAt(0).toUpperCase() + w.slice(1) : w))
    .join(" ");

// 1) Tous les guides publiés
const guides = [];
const PAGE = 500;
for (let from = 0; ; from += PAGE) {
  const { data, error } = await sb
    .from("city_guides")
    .select("state_id, city_slug, guide")
    .eq("status", "published")
    .order("id", { ascending: true })
    .range(from, from + PAGE - 1);
  if (error) {
    console.error("Erreur city_guides:", error.message);
    process.exit(1);
  }
  if (!data?.length) break;
  guides.push(...data);
  if (data.length < PAGE) break;
}
console.log(`📊 ${guides.length} guides publiés à traiter\n`);

let ok = 0;
let ko = 0;
const preview = [];
for (const [i, g] of guides.entries()) {
  const cityName = titleCase(g.city_slug);
  const title = `Lost & Found in ${cityName}, ${g.state_id}: Report a Lost Item`;
  const desc = stripHtml(
    g.guide?.heroSubtitle || (Array.isArray(g.guide?.intro) ? g.guide.intro[0] : "") || ""
  ).slice(0, 300);
  if (!desc) {
    ko++;
    continue;
  }
  if (preview.length < 3) preview.push(`  ${g.state_id}/${g.city_slug}\n    title: ${title}\n    desc : ${desc.slice(0, 120)}…`);

  if (APPLY) {
    const { data: rows, error } = await sb
      .from("us_cities")
      .update({ static_title: title, static_content: desc })
      .eq("state_id", g.state_id)
      .ilike("city_ascii", g.city_slug)
      .select("id");
    if (error || !rows?.length) {
      ko++;
      console.log(`  ⚠️ ${g.state_id}/${g.city_slug}: ${error?.message || "ville introuvable"}`);
    } else {
      ok++;
      if (ok % 100 === 0) process.stdout.write(`  … ${ok}/${guides.length}\r`);
    }
  }
}

console.log("Aperçu :\n" + preview.join("\n"));
if (!APPLY) {
  console.log(`\n🔍 SIMULATION. 👉 Pour appliquer : node scripts/refresh-city-seo.mjs --apply`);
} else {
  console.log(`\n✅ ${ok} ville(s) mise(s) à jour${ko ? `, ⚠️ ${ko} ignorée(s)/échec(s)` : ""}.`);
  console.log("Les pages se rafraîchissent au fil de la journée (ISR 24h), et le sitemap signale les changements à Google.");
}
