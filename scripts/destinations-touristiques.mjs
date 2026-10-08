// scripts/destinations-touristiques.mjs
//
// Les guides de destinations touristiques : état des lieux, puis génération.
//
// POURQUOI CE SCRIPT EXISTE
// generate-city-guides-batch.mjs trie les villes par POPULATION. Or on ne perd
// pas un objet là où les gens habitent, on le perd là où ils vont. Provincetown
// compte 3 000 habitants et des millions de visiteurs ; elle est donc au-delà du
// rang 20 000 dans un tri par population, et le batch national ne la verra
// jamais. D'où 7 651 guides et pas une ligne sur Cape Cod.
//
// Ces pages-là valent plusieurs dizaines de pages de villages : même coût de
// génération, beaucoup plus de recherches derrière.
//
//   node scripts/destinations-touristiques.mjs                  → état des lieux
//   node scripts/destinations-touristiques.mjs --go             → génère tout ce qui manque
//   node scripts/destinations-touristiques.mjs --go --max=10    → les 10 premières seulement

import fs from "node:fs";

const BASE = process.env.SITE_URL || "https://reportlost.org";
const GO = process.argv.includes("--go");
const MAX = Number((process.argv.find((a) => a.startsWith("--max=")) || "").split("=")[1] || 999);
const DELAY_MS = 3000;

const env =
  (fs.existsSync(".env.local") ? fs.readFileSync(".env.local", "utf8") : "") + "\n" +
  (fs.existsSync(".env") ? fs.readFileSync(".env", "utf8") : "");
const user = env.match(/ADMIN_USER=([^\s]+)/)?.[1];
const pass = env.match(/ADMIN_PASS=([^\s]+)/)?.[1];
if (!user || !pass) { console.error("❌ ADMIN_USER / ADMIN_PASS introuvables"); process.exit(1); }
const AUTH = "Basic " + Buffer.from(`${user}:${pass}`).toString("base64");
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// Classées par volume de visiteurs, pas par population.
const DESTINATIONS = [
  // --- Côte Est, littoral très fréquenté
  ["Provincetown","MA"],["Chatham","MA"],["Hyannis","MA"],["Falmouth","MA"],
  ["Nantucket","MA"],["Edgartown","MA"],["Oak Bluffs","MA"],["Vineyard Haven","MA"],
  ["Bar Harbor","ME"],["Kennebunkport","ME"],["Ogunquit","ME"],["Old Orchard Beach","ME"],
  ["Nags Head","NC"],["Duck","NC"],["Corolla","NC"],["Kill Devil Hills","NC"],["Kitty Hawk","NC"],
  ["Rehoboth Beach","DE"],["Bethany Beach","DE"],["Cape May","NJ"],["Wildwood","NJ"],["Ocean City","NJ"],
  ["Montauk","NY"],["East Hampton","NY"],["Southampton","NY"],
  ["Tybee Island","GA"],["Folly Beach","SC"],["Hilton Head Island","SC"],
  ["Sanibel","FL"],["Marco Island","FL"],["Santa Rosa Beach","FL"],["Destin","FL"],
  ["Lake Buena Vista","FL"],["St. Augustine","FL"],["Key West","FL"],
  // --- Ouest et montagne
  ["Aspen","CO"],["Breckenridge","CO"],["Estes Park","CO"],["Vail","CO"],
  ["Park City","UT"],["Moab","UT"],["Jackson","WY"],["Sedona","AZ"],["Flagstaff","AZ"],
  ["South Lake Tahoe","CA"],["Big Bear Lake","CA"],["Avalon","CA"],["Laguna Beach","CA"],
  ["Half Moon Bay","CA"],["Coronado","CA"],["Isla Vista","CA"],["Napa","CA"],
  ["Cannon Beach","OR"],["Seaside","OR"],
  // --- Intérieur, tourisme de masse
  ["Traverse City","MI"],["Branson","MO"],["Pigeon Forge","TN"],["Gatlinburg","TN"],
  ["Laughlin","NV"],["Santa Fe","NM"],["Williamsburg","VA"],["Hershey","PA"],
  ["Ithaca","NY"],["State College","PA"],["Oxford","MS"],["Daytona Beach","FL"],
  ["South Padre Island","TX"],["Sturgeon Bay","WI"],["Fish Creek","WI"],
];

console.log(`\n🔎 ${DESTINATIONS.length} destinations à vérifier…\n`);

const manquantes = [], presentes = [], introuvables = [];
for (const [city, state] of DESTINATIONS) {
  try {
    const r = await fetch(
      `${BASE}/api/admin/city-guide?state=${encodeURIComponent(state)}&city=${encodeURIComponent(city.toLowerCase())}`,
      { headers: { Authorization: AUTH } }
    );
    const j = await r.json().catch(() => ({}));
    if (j?.row?.status) presentes.push([city, state, j.row.status]);
    else manquantes.push([city, state]);
  } catch {
    introuvables.push([city, state]);
  }
}

console.log(`✅ guide déjà publié : ${presentes.length}`);
console.log(`➕ à créer           : ${manquantes.length}`);
if (introuvables.length) console.log(`⚠️  non vérifiables   : ${introuvables.length}`);

if (manquantes.length) {
  console.log(`\nCelles qui manquent :`);
  for (const [c, s] of manquantes) console.log(`   ${c} (${s})`);
}

if (!GO) {
  console.log(`\n(état des lieux seulement — relance avec --go pour générer les manquantes)`);
  process.exit(0);
}
if (!manquantes.length) { console.log(`\n🎉 Rien à faire.`); process.exit(0); }

const todo = manquantes.slice(0, MAX);
console.log(`\n🏙️  Génération de ${todo.length} guide(s)…\n`);
let ok = 0, ko = 0;
for (const [i, [city, state]] of todo.entries()) {
  process.stdout.write(`  ${i + 1}/${todo.length} ${city} (${state}) … `);
  let fait = false;
  for (let essai = 1; essai <= 4 && !fait; essai++) {
    try {
      const r = await fetch(`${BASE}/api/admin/city-guide-generate`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: AUTH },
        body: JSON.stringify({ city, state, autoPublish: true }),
      });
      const j = await r.json().catch(() => ({}));
      if (r.ok) { ok++; console.log("✅ publié (non vérifié)"); fait = true; }
      else if (/429|529|overload/i.test(String(j.error || r.status)) && essai < 4) {
        process.stdout.write(`⏳ (essai ${essai}) `); await sleep(15000 * essai);
      } else { ko++; console.log(`❌ ${String(j.error || r.status).slice(0, 90)}`); fait = true; }
    } catch (e) {
      if (essai === 4) { ko++; console.log(`❌ ${String(e?.message || e).slice(0, 90)}`); fait = true; }
      else await sleep(10000 * essai);
    }
  }
  await sleep(DELAY_MS);
}
console.log(`\n✅ ${ok} publié(s), ❌ ${ko} échec(s).`);
console.log(`👉 À relire dans ${BASE}/admin/city-guides (badge orange « à vérifier »).`);
