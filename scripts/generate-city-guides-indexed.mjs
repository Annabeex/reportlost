// scripts/generate-city-guides-indexed.mjs
// Génère un guide UNIQUEMENT pour les villes que Google indexe déjà mais qui
// n'ont pas encore de guide publié. Ce sont les pages les plus rentables du
// parc : Google les a déjà retenues, il ne leur manque que du contenu.
//
// La liste ci-dessous est l'export « Pages indexées » de la Search Console du
// 14 septembre 2026 (397 pages villes). C'est un instantané : réexporte et
// remplace INDEXED si tu veux la rafraîchir.
//
// Usage :
//   node scripts/generate-city-guides-indexed.mjs        → les 5 prochaines
//   node scripts/generate-city-guides-indexed.mjs 20     → les 20 prochaines
//   node scripts/generate-city-guides-indexed.mjs 20 --dry → liste sans générer
//
// Identifiants lus dans .env.local / .env (ADMIN_USER / ADMIN_PASS).

import fs from "fs";

const BASE = process.env.SITE_URL || "https://reportlost.org";
const COUNT = Math.max(1, Number(process.argv[2] || 5));
const DRY = process.argv.includes("--dry");
const DELAY_MS = 3000;

// STATE|city-slug, tel qu'il apparaît dans l'URL
const INDEXED = new Set([
  "AK|mosquito-lake",
  "AL|gulf-shores",
  "AL|selma",
  "AR|mountain-home",
  "AZ|bullhead-city",
  "AZ|phoenix",
  "CA|anaheim",
  "CA|artesia",
  "CA|bell",
  "CA|bolinas",
  "CA|bostonia",
  "CA|brawley",
  "CA|california-hot-springs",
  "CA|carmel-valley-village",
  "CA|carpinteria",
  "CA|claremont",
  "CA|coarsegold",
  "CA|commerce",
  "CA|danville",
  "CA|diamond-springs",
  "CA|discovery-bay",
  "CA|emeryville",
  "CA|galt",
  "CA|hercules",
  "CA|joshua-tree",
  "CA|loma-linda",
  "CA|los-angeles",
  "CA|lucerne-valley",
  "CA|mammoth-lakes",
  "CA|manhattan-beach",
  "CA|mill-valley",
  "CA|monterey",
  "CA|oroville",
  "CA|piedmont",
  "CA|rancho-mission-viejo",
  "CA|san-diego",
  "CA|shasta",
  "CA|shaver-lake",
  "CA|silverado-resort",
  "CA|solvang",
  "CA|truckee",
  "CA|twentynine-palms",
  "CA|view-park-windsor-hills",
  "CA|vincent",
  "CA|westmont",
  "CO|amherst",
  "CO|ken-caryl",
  "CO|montrose",
  "CO|mountain-village",
  "CO|silverthorne",
  "CO|sterling-ranch",
  "CT|bridgeport",
  "CT|derby",
  "CT|naugatuck",
  "FL|anna-maria",
  "FL|captiva",
  "FL|citrus-park",
  "FL|clermont",
  "FL|dunedin",
  "FL|ellenton",
  "FL|fort-myers-beach",
  "FL|fruit-cove",
  "FL|gibsonton",
  "FL|gulf-stream",
  "FL|hallandale-beach",
  "FL|holly-hill",
  "FL|jensen-beach",
  "FL|key-west",
  "FL|lake-harbor",
  "FL|lake-mary",
  "FL|lantana",
  "FL|longwood",
  "FL|loxahatchee-groves",
  "FL|madeira-beach",
  "FL|melbourne-beach",
  "FL|miami-shores",
  "FL|miami-springs",
  "FL|naranja",
  "FL|new-port-richey",
  "FL|new-smyrna-beach",
  "FL|ormond-beach",
  "FL|rainbow-springs",
  "FL|safety-harbor",
  "FL|san-antonio",
  "FL|south-palm-beach",
  "FL|stacey-street",
  "FL|stuart",
  "FL|tropical-park",
  "FL|venice",
  "FL|west-melbourne",
  "FL|winter-springs",
  "FL|wright",
  "GA|buckhead",
  "GA|dublin",
  "GA|duluth",
  "GA|evans",
  "GA|grovetown",
  "GA|st-marys",
  "GA|waycross",
  "HI|wailea",
  "IA|altoona",
  "ID|boise",
  "IL|antioch",
  "IL|blue-island",
  "IL|chicago",
  "IL|crystal-lake",
  "IL|east-peoria",
  "IL|lake-catherine",
  "IL|lake-forest",
  "IL|lebanon",
  "IL|milan",
  "IL|prospect-heights",
  "IL|shorewood",
  "IL|waukegan",
  "IL|winnetka",
  "IL|wood-river",
  "IN|frankfort",
  "IN|macy",
  "IN|miami",
  "IN|plainfield",
  "KS|derby",
  "KS|lansing",
  "KS|louisville",
  "KY|ashland",
  "KY|glasgow",
  "LA|monticello",
  "LA|parks",
  "LA|pineville",
  "LA|youngsville",
  "MA|harwich-port",
  "MD|arnold",
  "MD|bel-air-north",
  "MD|elkton",
  "MD|fairland",
  "MD|glassmanor",
  "MD|la-vale",
  "MD|laurel",
  "MD|savage",
  "MD|white-marsh",
  "MI|baldwin",
  "MI|boyne-city",
  "MI|brooklyn",
  "MI|davison",
  "MI|eastwood",
  "MI|ferndale",
  "MI|frankenmuth",
  "MI|gibraltar",
  "MI|grand-haven",
  "MI|mcbain",
  "MI|northville",
  "MI|okemos",
  "MI|plymouth",
  "MI|schoolcraft",
  "MN|brainerd",
  "MN|brooklyn-center",
  "MN|ham-lake",
  "MN|minneapolis",
  "MN|new-brighton",
  "MN|oakdale",
  "MN|owatonna",
  "MN|red-lake",
  "MN|st.-cloud",
  "MN|stillwater",
  "MO|bowling-green",
  "MO|clayton",
  "MO|galena",
  "MO|kirkwood",
  "MO|manchester",
  "MO|maryville",
  "MO|webster-groves",
  "MO|wentzville",
  "MS|glendora",
  "MS|ocean-springs",
  "MS|pearl",
  "MS|starkville",
  "MT|helena",
  "MT|lima",
  "MT|polson",
  "NC|alamance",
  "NC|anderson-creek",
  "NC|asheboro",
  "NC|beech-mountain",
  "NC|boone",
  "NC|east-laurinburg",
  "NC|forest-city",
  "NC|harrisburg",
  "NC|hendersonville",
  "NC|indian-trail",
  "NC|leland",
  "NC|murraysville",
  "NC|ogden",
  "NE|south-sioux-city",
  "NH|claremont",
  "NJ|atlantic-highlands",
  "NJ|belmar",
  "NJ|bradley-beach",
  "NJ|brigantine",
  "NJ|cherry-hill-mall",
  "NJ|elmwood-park",
  "NJ|englewood",
  "NJ|kean-university",
  "NJ|kearny",
  "NJ|laurence-harbor",
  "NJ|lavallette",
  "NJ|lindenwold",
  "NJ|new-milford",
  "NJ|pompton-lakes",
  "NJ|princeton",
  "NJ|westwood",
  "NM|south-valley",
  "NM|spencerville",
  "NM|totah-vista",
  "NV|fernley",
  "NV|summerlin-south",
  "NY|amityville",
  "NY|beacon",
  "NY|crown-heights",
  "NY|freeport",
  "NY|lake-grove",
  "NY|latham",
  "NY|massapequa",
  "NY|mount-kisco",
  "NY|new-york",
  "NY|oswego",
  "NY|south-glens-falls",
  "NY|woodbury",
  "OH|aurora",
  "OH|barberton",
  "OH|blue-ash",
  "OH|forest-park",
  "OH|gahanna",
  "OH|kenwood",
  "OH|lakeline",
  "OH|marietta",
  "OH|norwalk",
  "OH|reynoldsburg",
  "OH|scott",
  "OH|shawnee",
  "OH|sidney",
  "OH|toronto",
  "OH|trotwood",
  "OH|worthington",
  "OK|duncan",
  "OK|harrah",
  "OK|sand-springs",
  "OK|yukon",
  "OR|government-camp",
  "OR|independence",
  "OR|philomath",
  "PA|ambler",
  "PA|carlisle",
  "PA|crafton",
  "PA|duquesne",
  "PA|gibraltar",
  "PA|hazleton",
  "PA|media",
  "PA|philadelphia",
  "PA|schenley",
  "PA|stonybrook",
  "PA|telford",
  "PA|temple",
  "PA|washington",
  "PA|west-chester",
  "PA|wilkes-barre",
  "PA|wilkinsburg",
  "PR|aguada",
  "PR|anasco",
  "PR|animas",
  "PR|anon-raices",
  "PR|bairoa-la-veinticinco",
  "PR|bajandas",
  "PR|barceloneta",
  "PR|brisas-del-campanero",
  "PR|buena-vista",
  "PR|caban",
  "PR|cabo-rojo",
  "PR|campanillas",
  "PR|candelero-abajo",
  "PR|candelero-arriba",
  "PR|coamo",
  "PR|corozal",
  "PR|coto-laurel",
  "PR|daguao",
  "PR|el-combate",
  "PR|el-ojo",
  "PR|el-tumbao",
  "PR|emajagua",
  "PR|garrochales",
  "PR|gurabo",
  "PR|hato-arriba",
  "PR|hato-candal",
  "PR|hormigueros",
  "PR|humacao",
  "PR|imbery",
  "PR|ingenio",
  "PR|isabela",
  "PR|jauca",
  "PR|juncos",
  "PR|la-parguera",
  "PR|la-plena",
  "PR|lares",
  "PR|las-croabas",
  "PR|las-gaviotas",
  "PR|las-ochenta",
  "PR|las-piedras",
  "PR|lomas-verdes-comunidad",
  "PR|los-llanos",
  "PR|luis-llorens-torres",
  "PR|manati",
  "PR|mansion-del-sol",
  "PR|miranda",
  "PR|moca",
  "PR|morovis",
  "PR|naguabo",
  "PR|naranjito",
  "PR|pabellones",
  "PR|pajonal",
  "PR|palmas-del-mar",
  "PR|parcelas-viejas-borinquen",
  "PR|pastos",
  "PR|patillas",
  "PR|piedra-aguza",
  "PR|playita-cortada",
  "PR|pueblito-del-rio",
  "PR|quebrada-del-agua",
  "PR|quebrada-prieta",
  "PR|quebradillas",
  "PR|ramos",
  "PR|rio-canas-abajo",
  "PR|rio-grande",
  "PR|sabana-grande",
  "PR|san-antonio",
  "PR|san-sebastian",
  "PR|santa-barbara",
  "PR|santa-isabel",
  "PR|tallaboa",
  "PR|tallaboa-alta",
  "PR|tibes",
  "PR|tierras-nuevas-poniente",
  "PR|vayas",
  "PR|vazquez",
  "PR|vega-alta",
  "PR|vega-baja",
  "PR|villa-calma",
  "PR|villa-de-sabana",
  "PR|villa-esperanza",
  "PR|yabucoa",
  "PR|yauco",
  "PR|yaurel",
  "SC|fort-mill",
  "SC|north-myrtle-beach",
  "SC|taylors",
  "SD|mina",
  "TN|collegedale",
  "TX|carlsbad",
  "TX|fort-bliss",
  "TX|fort-hood",
  "TX|harding-gill-tract",
  "TX|horizon-city",
  "TX|houston",
  "TX|mount-pleasant",
  "TX|north-richland-hills",
  "TX|olmos-park",
  "TX|palmview",
  "TX|san-antonio",
  "TX|timberwood-park",
  "UT|american-fork",
  "UT|midway",
  "VA|buena-vista",
  "VA|damascus",
  "VA|idylwood",
  "VA|mcnair",
  "VA|mount-vernon",
  "VA|potomac-mills",
  "VA|triangle",
  "VA|wakefield",
  "VA|woodbridge",
  "VA|yorktown",
  "VT|manchester-center",
  "WA|alder",
  "WA|east-wenatchee",
  "WA|grandview",
  "WA|kenmore",
  "WA|mercer-island",
  "WA|tukwila",
  "WA|yelm",
  "WI|belgium",
  "WI|glendale",
  "WI|howard",
  "WI|montreal",
  "WI|pardeeville",
  "WI|shiocton",
  "WI|stockholm",
  "WI|superior",
  "WI|weston",
  "WY|green-river",
  "WY|huntley"
]);

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

// Même normalisation que les URL du site : minuscules, espaces en tirets.
const toSlug = (s) => String(s || "").trim().toLowerCase().replace(/\s+/g, "-");

// Verrou partagé avec l'autre batch : deux générations parallèles brûlent
// de l'argent sur les mêmes villes.
const LOCK = "/tmp/reportlost-batch.lock";
if (!DRY && fs.existsSync(LOCK)) {
  const age = (Date.now() - fs.statSync(LOCK).mtimeMs) / 60000;
  if (age < 360) {
    console.error(`⛔ Un batch semble déjà en cours (verrou posé il y a ${age.toFixed(0)} min).`);
    console.error(`   Si aucun processus ne tourne : rm ${LOCK}`);
    process.exit(1);
  }
}
if (!DRY) {
  fs.writeFileSync(LOCK, String(process.pid));
  const release = () => { try { fs.unlinkSync(LOCK); } catch {} };
  process.on("exit", release);
  process.on("SIGINT", () => { release(); process.exit(130); });
  process.on("SIGTERM", () => { release(); process.exit(143); });
}

// 1) Toutes les villes connues, avec leur statut de guide.
const listRes = await fetch(`${BASE}/api/admin/city-guide?cities=1&limit=50000`, {
  headers: { Authorization: AUTH },
});
if (!listRes.ok) {
  console.error("Impossible de récupérer la liste des villes:", listRes.status, await listRes.text());
  process.exit(1);
}
const { cities } = await listRes.json();

// 2) On ne garde que les villes indexées par Google et sans guide.
const todo = (cities || [])
  .filter((c) => !c.guide_status)
  .filter((c) => INDEXED.has(`${String(c.state).toUpperCase()}|${toSlug(c.city)}`))
  .sort((a, b) => (b.population || 0) - (a.population || 0));

console.log(`📊 ${INDEXED.size} pages villes indexées, ${todo.length} sans guide.`);

if (!todo.length) {
  console.log("🎉 Toutes les villes indexées ont désormais un guide.");
  process.exit(0);
}

const batch = todo.slice(0, COUNT);

if (DRY) {
  console.log(`\n🔎 Aperçu, aucune génération :\n`);
  todo.forEach((c, i) =>
    console.log(`  ${String(i + 1).padStart(3)}. ${c.city} (${c.state}) — pop. ${c.population?.toLocaleString?.() || "?"}`)
  );
  process.exit(0);
}

console.log(`\n🏙️  ${batch.length} ville(s) à générer, les plus peuplées d'abord :\n`);

let ok = 0;
let ko = 0;
for (const [i, c] of batch.entries()) {
  process.stdout.write(`  ${i + 1}/${batch.length} ${c.city} (${c.state}), pop. ${c.population?.toLocaleString?.() || "?"} … `);
  try {
    const chk = await fetch(
      `${BASE}/api/admin/city-guide?state=${encodeURIComponent(c.state)}&city=${encodeURIComponent(String(c.city).toLowerCase())}`,
      { headers: { Authorization: AUTH } }
    );
    const cj = await chk.json().catch(() => ({}));
    if (cj?.row?.status) {
      console.log(`⏭️ déjà ${cj.row.status}, ignoré`);
      continue;
    }
  } catch {
    /* en cas de doute on laisse générer */
  }

  let done = false;
  const MAX_ATTEMPTS = 4;
  for (let attempt = 1; attempt <= MAX_ATTEMPTS && !done; attempt++) {
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
        done = true;
      } else {
        const msg = String(j.error || r.status);
        const transient = /529|429|503|overloaded|rate limit/i.test(msg);
        if (transient && attempt < MAX_ATTEMPTS) {
          const wait = 30_000 * attempt;
          process.stdout.write(`API saturée, retry dans ${wait / 1000} s… `);
          await sleep(wait);
        } else {
          ko++;
          console.log(`⚠️ ${msg}${attempt > 1 ? ` (${attempt} tentatives)` : ""}`);
          done = true;
        }
      }
    } catch (e) {
      if (attempt < MAX_ATTEMPTS) {
        process.stdout.write(`réseau (${e.message}), retry dans 10 s… `);
        await sleep(10_000);
      } else {
        ko++;
        console.log(`⚠️ ${e.message} (${MAX_ATTEMPTS} tentatives)`);
      }
    }
  }
  if (i < batch.length - 1) await sleep(DELAY_MS);
}

console.log(`\n✅ ${ok} guide(s) publié(s)${ko ? `, ⚠️ ${ko} échec(s)` : ""}. Restant : ${todo.length - ok}.`);
console.log("👉 Relis-les dans https://reportlost.org/admin/city-guides (badge orange « à vérifier »).");
