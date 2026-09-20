// scripts/regenerate-v2.mjs
//
// Régénère les guides ville existants avec le NOUVEAU ton (v2, informatif).
// Les guides déjà en v2 sont ignorés : le script reprend donc toujours là où
// il s'est arrêté, sans que tu aies à noter où tu en étais.
//
// Ordre : population décroissante (les villes les plus recherchées d'abord).
//
// Usage :
//   node scripts/regenerate-v2.mjs            → les 5 prochaines
//   node scripts/regenerate-v2.mjs 25         → les 25 prochaines
//   node scripts/regenerate-v2.mjs 25 --dry   → montre la liste, ne génère rien
//   node scripts/regenerate-v2.mjs --count    → juste l'état d'avancement
//
// Prérequis : la colonne city_guides.tone_version doit exister (voir le SQL).
// Identifiants lus dans .env.local / .env (ADMIN_USER / ADMIN_PASS).

import fs from "fs";

const BASE = process.env.SITE_URL || "https://reportlost.org";
const DRY = process.argv.includes("--dry");
const COUNT_ONLY = process.argv.includes("--count");
const COUNT = Math.max(1, Number(process.argv.find((a) => /^\d+$/.test(a)) || 5));
const POOL = 50000;
const DELAY_MS = 3000; // pause entre deux villes (Serper + Anthropic)

const env =
  (fs.existsSync(".env.local") ? fs.readFileSync(".env.local", "utf8") : "") + "\n" +
  (fs.existsSync(".env") ? fs.readFileSync(".env", "utf8") : "");
const user = env.match(/ADMIN_USER=([^\s]+)/)?.[1];
const pass = env.match(/ADMIN_PASS=([^\s]+)/)?.[1];
if (!user || !pass) {
  console.error("❌ ADMIN_USER / ADMIN_PASS introuvables dans .env.local");
  process.exit(1);
}
const AUTH = "Basic " + Buffer.from(`${user}:${pass}`).toString("base64");
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// 🔒 Verrou : deux régénérations en parallèle referaient les mêmes villes.
const LOCK = "/tmp/reportlost-regen-v2.lock";
if (!COUNT_ONLY && !DRY) {
  if (fs.existsSync(LOCK)) {
    const age = (Date.now() - fs.statSync(LOCK).mtimeMs) / 60000;
    if (age < 120) {
      console.error(`❌ Une régénération tourne déjà (verrou vieux de ${age.toFixed(0)} min).`);
      console.error("   Vérifie avec : ps aux | grep regenerate-v2 | grep -v grep");
      console.error(`   Si c'est un reste d'un plantage : rm ${LOCK}`);
      process.exit(1);
    }
    console.warn("⚠️ Verrou périmé, on continue.");
  }
  fs.writeFileSync(LOCK, String(process.pid));
  const clean = () => { try { fs.unlinkSync(LOCK); } catch {} };
  process.on("exit", clean);
  process.on("SIGINT", () => { clean(); process.exit(130); });
}

// ---------------------------------------------------------------- inventaire
const listRes = await fetch(`${BASE}/api/admin/city-guide?cities=1&limit=${POOL}`, {
  headers: { Authorization: AUTH },
});
if (!listRes.ok) {
  console.error("❌ Liste des villes indisponible :", listRes.status, (await listRes.text()).slice(0, 200));
  process.exit(1);
}
const { cities } = await listRes.json();

// On ne touche QU'AUX guides generes automatiquement :
//  - "legacy" = les 5 villes a page dediee ecrite a la main (NY, LA, Chicago,
//    Houston, Phoenix), a ne jamais regenerer ;
//  - verified = guide relu et corrige dans /admin/city-guides, la regeneration
//    ecraserait ce travail.
const aGuide = (c) => c.guide_status === "published";
const publies = (cities || []).filter(aGuide);
const protegees = publies.filter((c) => c.verified === true);
const regenerables = publies.filter((c) => c.verified !== true);
const faits = regenerables.filter((c) => Number(c.tone_version) === 2);
const restants = regenerables
  .filter((c) => Number(c.tone_version) !== 2)
  .sort((a, b) => (b.population || 0) - (a.population || 0));

if (restants.length && restants.every((c) => c.tone_version === null)) {
  console.warn("⚠️ Aucune ville ne porte de tone_version : la colonne existe-t-elle bien en base ?");
  console.warn("   (le script traiterait alors tout le parc comme 'à refaire')\n");
}

const pct = regenerables.length ? (100 * faits.length / regenerables.length).toFixed(1) : "0";
console.log(`\n📊 Guides publiés : ${publies.length}`);
console.log(`   🔒 intouchables : ${protegees.length} relus à la main` +
  ` (+ les 5 pages écrites à la main, déjà hors liste)`);
console.log(`   ✅ déjà en v2 : ${faits.length} / ${regenerables.length} (${pct} %)`);
console.log(`   ⏳ à refaire  : ${restants.length}\n`);

if (COUNT_ONLY) process.exit(0);
if (!restants.length) {
  console.log("🎉 Tout le parc est en v2.");
  process.exit(0);
}

const todo = restants.slice(0, COUNT);
console.log(`Prochaines ${todo.length} villes (population décroissante) :`);
for (const c of todo) {
  console.log(`   ${c.state}/${c.city}  (${(c.population || 0).toLocaleString("fr-FR")} hab.)`);
}
if (DRY) {
  console.log("\n(--dry : rien n'a été généré)");
  process.exit(0);
}

// ---------------------------------------------------------------- génération
console.log("");
let ok = 0, ko = 0;
for (const [i, c] of todo.entries()) {
  const label = `${c.state}/${c.city}`;
  process.stdout.write(`[${i + 1}/${todo.length}] ${label} … `);
  try {
    const r = await fetch(`${BASE}/api/admin/city-guide-generate`, {
      method: "POST",
      headers: { Authorization: AUTH, "Content-Type": "application/json" },
      body: JSON.stringify({ city: c.city, state: c.state, autoPublish: true }),
    });
    const j = await r.json().catch(() => ({}));
    if (r.ok && j?.ok !== false) {
      ok++;
      console.log("✅");
    } else {
      ko++;
      console.log(`❌ ${String(j?.error || r.status).slice(0, 120)}`);
    }
  } catch (e) {
    ko++;
    console.log(`❌ ${String(e?.message || e).slice(0, 120)}`);
  }
  if (i < todo.length - 1) await sleep(DELAY_MS);
}

console.log(`\n✅ ${ok} régénérées, ❌ ${ko} en échec.`);
console.log(`Reste ${restants.length - ok} villes en v1.`);
console.log("👉 Relecture : https://reportlost.org/admin/city-guides (badge orange « à vérifier »)");
