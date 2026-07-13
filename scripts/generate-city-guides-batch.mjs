// scripts/generate-city-guides-batch.mjs
// Génère et PUBLIE des guides ville par lot (ordre de population), marqués
// "non vérifié" : la relecture se fait a posteriori dans /admin/city-guides
// (badge orange "à vérifier" + bouton "Marquer vérifié" / édition du contenu).
//
// Usage :
//   node scripts/generate-city-guides-batch.mjs 10        → les 10 prochaines villes sans guide
//   node scripts/generate-city-guides-batch.mjs 25        → les 25 prochaines, etc.
//
// Identifiants lus dans .env.local / .env (ADMIN_USER / ADMIN_PASS).

import fs from "fs";

const BASE = process.env.SITE_URL || "https://reportlost.org";
const COUNT = Math.max(1, Number(process.argv[2] || 5));
const DELAY_MS = 3000; // pause entre deux villes (Serper + Anthropic)

const env =
  (fs.existsSync(".env.local") ? fs.readFileSync(".env.local", "utf8") : "") +
  "\n" +
  (fs.existsSync(".env") ? fs.readFileSync(".env", "utf8") : "");
const user = env.match(/ADMIN_USER=([^\s]+)/)?.[1];
const pass = env.match(/ADMIN_PASS=([^\s]+)/)?.[1];
if (!user || !pass) {
  console.error("ADMIN_USER / ADMIN_PASS introuvables dans .env.local");
  process.exit(1);
}
const AUTH = "Basic " + Buffer.from(`${user}:${pass}`).toString("base64");

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// 1) Liste de travail : villes par population, sans guide existant
const listRes = await fetch(`${BASE}/api/admin/city-guide?cities=1&limit=1000`, {
  headers: { Authorization: AUTH },
});
if (!listRes.ok) {
  console.error("Impossible de récupérer la liste des villes:", listRes.status, await listRes.text());
  process.exit(1);
}
const { cities } = await listRes.json();
const todo = (cities || []).filter((c) => !c.guide_status).slice(0, COUNT);

if (!todo.length) {
  console.log("🎉 Aucune ville sans guide dans le top 1000 — tout est déjà généré.");
  process.exit(0);
}

console.log(`🏙️  ${todo.length} ville(s) à générer et publier (non vérifiées) :\n`);

let ok = 0;
let ko = 0;
for (const [i, c] of todo.entries()) {
  process.stdout.write(`  ${i + 1}/${todo.length} ${c.city} (${c.state}), pop. ${c.population?.toLocaleString?.() || "?"} … `);
  try {
    const r = await fetch(`${BASE}/api/admin/city-guide-generate`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: AUTH },
      body: JSON.stringify({ city: c.city, state: c.state, autoPublish: true }),
    });
    const j = await r.json().catch(() => ({}));
    if (r.ok) {
      ok++;
      console.log("✅ publié (non vérifié)");
    } else {
      ko++;
      console.log(`⚠️ ${j.error || r.status}`);
    }
  } catch (e) {
    ko++;
    console.log(`⚠️ ${e.message}`);
  }
  if (i < todo.length - 1) await sleep(DELAY_MS);
}

console.log(`\n✅ ${ok} guide(s) publié(s) (non vérifiés)${ko ? `, ⚠️ ${ko} échec(s)` : ""}.`);
console.log("👉 Relis-les quand tu peux dans https://reportlost.org/admin/city-guides (badge orange « à vérifier »).");
