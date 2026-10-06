// scripts/rafraichir-lastmod-guides.mjs
//
// Réaligne city_guides.updated_at sur la date RÉELLE de la correction.
//
// Pourquoi : sitemap-cities.xml publie updated_at comme <lastmod>. C'est le
// signal qui dit à Google « cette page a changé, repasse ». Or le script
// retirer-promesses.mjs écarte updated_at de ce qu'il écrit (liste HORS), et
// la table n'a pas de trigger : les 7 367 pages réécrites le 23 septembre sont
// toujours annoncées avec leur ancienne date (21 septembre au plus tard).
// Google n'a donc aucune raison de revenir les voir.
//
// On repose la VRAIE date de la correction, pas la date du jour : un lastmod
// inventé n'aide pas, Google recoupe avec ce qu'il trouve sur la page.
//
//   node scripts/rafraichir-lastmod-guides.mjs                 → simulation
//   node scripts/rafraichir-lastmod-guides.mjs --go            → écrit
//   node scripts/rafraichir-lastmod-guides.mjs --go --date=2026-09-23T19:44:28Z

import fs from "node:fs";

const env = Object.fromEntries(
  fs.readFileSync(fs.existsSync(".env.local") ? ".env.local" : ".env", "utf8")
    .split("\n").filter((l) => l.includes("=") && !l.trim().startsWith("#"))
    .map((l) => { const i = l.indexOf("="); return [l.slice(0, i).trim(), l.slice(i + 1).trim().replace(/^["']|["']$/g, "")]; })
);
const URL_ = env.SUPABASE_URL || env.NEXT_PUBLIC_SUPABASE_URL;
const KEY = env.SUPABASE_SERVICE_ROLE_KEY;
if (!URL_ || !KEY) { console.error("❌ identifiants Supabase introuvables"); process.exit(1); }

const arg = (n, d) => (process.argv.find((a) => a.startsWith(`--${n}=`)) || "").split("=")[1] || d;
const GO = process.argv.includes("--go");
const FICHIER = arg("fichier", "_travail/sauvegarde-promesses-2026-09-23-19-44-28.json");
const DATE = arg("date", "2026-09-23T19:44:28Z");

if (!fs.existsSync(FICHIER)) { console.error(`❌ sauvegarde introuvable : ${FICHIER}`); process.exit(1); }
const ids = [...new Set(JSON.parse(fs.readFileSync(FICHIER, "utf8")).map((l) => l.id).filter((v) => v != null))];

console.log(`Pages corrigées le 23/09 : ${ids.length}`);
console.log(`Nouvelle date de lastmod : ${DATE}`);
if (!GO) {
  console.log(`\n(simulation — rien n'est écrit. Relance avec --go pour appliquer.)`);
  process.exit(0);
}

const LOT = 200;
let faits = 0;
for (let i = 0; i < ids.length; i += LOT) {
  const lot = ids.slice(i, i + LOT);
  const qs = new URLSearchParams({ id: `in.(${lot.join(",")})` });
  const r = await fetch(`${URL_}/rest/v1/city_guides?${qs}`, {
    method: "PATCH",
    headers: {
      apikey: KEY,
      Authorization: `Bearer ${KEY}`,
      "Content-Type": "application/json",
      Prefer: "return=minimal",
    },
    body: JSON.stringify({ updated_at: DATE }),
  });
  if (!r.ok) { console.error(`❌ lot ${i}: ${r.status} ${await r.text()}`); process.exit(1); }
  faits += lot.length;
  process.stdout.write(`\r${faits}/${ids.length}`);
}
console.log(`\n✅ ${faits} pages réalignées. Resoumets le sitemap dans Search Console.`);
