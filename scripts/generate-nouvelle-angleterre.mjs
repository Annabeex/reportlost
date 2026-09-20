// scripts/generate-nouvelle-angleterre.mjs
//
// Génère les guides des villes de Nouvelle-Angleterre qui n'en ont pas encore.
// Ces villes viennent d'être ajoutées depuis le Gazetteer du Census : elles
// étaient absentes de us_cities, donc le script batch national ne les voyait pas.
//
// Ordre : population décroissante, mais les destinations touristiques listées
// dans DESTINATIONS passent en tête, quelle que soit leur population — une
// station balnéaire de 2 000 habitants reçoit plus de visiteurs (et perd plus
// d'objets) qu'une ville-dortoir de 20 000.
//
// Usage :
//   node scripts/generate-nouvelle-angleterre.mjs --count        → état des lieux
//   node scripts/generate-nouvelle-angleterre.mjs 10 --dry       → les 10 prochaines, sans générer
//   node scripts/generate-nouvelle-angleterre.mjs 10             → on y va
//   node scripts/generate-nouvelle-angleterre.mjs 10 --min=2000  → seuil de population
//   node scripts/generate-nouvelle-angleterre.mjs 10 --states=MA,ME
//
// Identifiants lus dans .env.local / .env (ADMIN_USER / ADMIN_PASS).

import fs from "fs";

const BASE = process.env.SITE_URL || "https://reportlost.org";
const args = process.argv.slice(2);
const DRY = args.includes("--dry");
const COUNT_ONLY = args.includes("--count");
const COUNT = Math.max(1, Number(args.find((a) => /^\d+$/.test(a)) || 5));
const MIN_POP = Number((args.find((a) => a.startsWith("--min=")) || "--min=5000").split("=")[1]);
const STATES = new Set(
  ((args.find((a) => a.startsWith("--states=")) || "--states=CT,ME,MA,NH,RI,VT").split("=")[1])
    .split(",").map((s) => s.trim().toUpperCase()).filter(Boolean)
);
const DELAY_MS = 3000;

// Destinations toujours prioritaires, même sous le seuil de population :
// plages, îles, stations de ski, ports touristiques.
const DESTINATIONS = new Set([
  // Cape Cod, îles
  "MA|provincetown", "MA|chatham", "MA|truro", "MA|wellfleet", "MA|eastham", "MA|orleans",
  "MA|dennis", "MA|brewster", "MA|harwich", "MA|barnstable", "MA|falmouth", "MA|bourne",
  "MA|sandwich", "MA|yarmouth", "MA|mashpee", "MA|nantucket", "MA|edgartown", "MA|tisbury",
  "MA|oak bluffs", "MA|chilmark", "MA|west tisbury", "MA|aquinnah", "MA|gosnold",
  "MA|rockport", "MA|gloucester", "MA|salem", "MA|plymouth", "MA|nahant",
  // Maine côtier
  "ME|bar harbor", "ME|ogunquit", "ME|kennebunkport", "ME|kennebunk", "ME|wells", "ME|york",
  "ME|old orchard beach", "ME|boothbay harbor", "ME|camden", "ME|rockport", "ME|rockland",
  "ME|bath", "ME|freeport", "ME|vinalhaven", "ME|deer isle", "ME|stonington", "ME|castine",
  // New Hampshire
  "NH|north conway", "NH|conway", "NH|jackson", "NH|lincoln", "NH|bartlett", "NH|hampton",
  "NH|wolfeboro", "NH|meredith", "NH|portsmouth", "NH|rye",
  // Vermont
  "VT|stowe", "VT|killington", "VT|woodstock", "VT|manchester", "VT|dover", "VT|ludlow",
  "VT|warren", "VT|waitsfield", "VT|wilmington", "VT|stratton",
  // Rhode Island / Connecticut
  "RI|new shoreham", "RI|narragansett", "RI|newport", "RI|jamestown", "RI|westerly",
  "CT|mystic", "CT|stonington", "CT|old lyme", "CT|madison", "CT|westbrook",
]);

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

const LOCK = "/tmp/reportlost-ne.lock";
if (!COUNT_ONLY && !DRY) {
  if (fs.existsSync(LOCK)) {
    const age = (Date.now() - fs.statSync(LOCK).mtimeMs) / 60000;
    if (age < 120) {
      console.error(`❌ Une génération tourne déjà (verrou vieux de ${age.toFixed(0)} min).`);
      console.error(`   Si c'est un reste d'un plantage : rm ${LOCK}`);
      process.exit(1);
    }
  }
  fs.writeFileSync(LOCK, String(process.pid));
  const clean = () => { try { fs.unlinkSync(LOCK); } catch {} };
  process.on("exit", clean);
  process.on("SIGINT", () => { clean(); process.exit(130); });
}

const listRes = await fetch(`${BASE}/api/admin/city-guide?cities=1&limit=50000`, {
  headers: { Authorization: AUTH },
});
if (!listRes.ok) {
  console.error("❌ Liste des villes indisponible :", listRes.status);
  process.exit(1);
}
const { cities } = await listRes.json();

const key = (c) => `${c.state}|${String(c.city).toLowerCase()}`;
const estDestination = (c) => DESTINATIONS.has(key(c));

const zone = (cities || []).filter((c) => STATES.has(String(c.state).toUpperCase()));
const avecGuide = zone.filter((c) => c.guide_status);
const sansGuide = zone.filter((c) => !c.guide_status);
const eligibles = sansGuide.filter((c) => (c.population || 0) >= MIN_POP || estDestination(c));

// destinations d'abord, puis population décroissante
eligibles.sort((a, b) => {
  const da = estDestination(a) ? 1 : 0, db = estDestination(b) ? 1 : 0;
  if (da !== db) return db - da;
  return (b.population || 0) - (a.population || 0);
});

console.log(`\n📍 États : ${[...STATES].join(", ")}   seuil : ${MIN_POP} hab.`);
console.log(`   villes en base      : ${zone.length}`);
console.log(`   déjà un guide       : ${avecGuide.length}`);
console.log(`   sans guide          : ${sansGuide.length}`);
console.log(`   ⏳ à générer        : ${eligibles.length}` +
  `  (dont ${eligibles.filter(estDestination).length} destinations touristiques)\n`);

if (COUNT_ONLY) process.exit(0);
if (!eligibles.length) { console.log("🎉 Rien à générer avec ces critères."); process.exit(0); }

const todo = eligibles.slice(0, COUNT);
console.log(`Prochaines ${todo.length} :`);
for (const c of todo) {
  console.log(`   ${estDestination(c) ? "★" : " "} ${c.state}/${c.city}` +
    `  (${(c.population || 0).toLocaleString("fr-FR")} hab.)`);
}
if (DRY) { console.log("\n(--dry : rien n'a été généré)"); process.exit(0); }

console.log("");
let ok = 0, ko = 0;
for (const [i, c] of todo.entries()) {
  process.stdout.write(`[${i + 1}/${todo.length}] ${c.state}/${c.city} … `);
  try {
    const r = await fetch(`${BASE}/api/admin/city-guide-generate`, {
      method: "POST",
      headers: { Authorization: AUTH, "Content-Type": "application/json" },
      body: JSON.stringify({ city: c.city, state: c.state, autoPublish: true }),
    });
    const j = await r.json().catch(() => ({}));
    if (r.ok && j?.ok !== false) { ok++; console.log("✅"); }
    else { ko++; console.log(`❌ ${String(j?.error || r.status).slice(0, 120)}`); }
  } catch (e) {
    ko++; console.log(`❌ ${String(e?.message || e).slice(0, 120)}`);
  }
  if (i < todo.length - 1) await sleep(DELAY_MS);
}

console.log(`\n✅ ${ok} générées, ❌ ${ko} en échec. Reste ${eligibles.length - ok}.`);
console.log("👉 Relecture : https://reportlost.org/admin/city-guides");
