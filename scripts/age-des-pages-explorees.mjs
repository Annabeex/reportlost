// scripts/age-des-pages-explorees.mjs
//
// Les pages que Google explore sont-elles les anciennes ou les récentes ?
// On croise l'export Search Console (URL + dernière exploration) avec la date
// de création du guide en base.
//
// Si les vagues récentes sont sous-représentées, l'indexation suit simplement
// l'âge et il faut attendre. Si la vague de juillet est elle aussi peu
// explorée après dix semaines, c'est un problème de fond.
//
//   node scripts/age-des-pages-explorees.mjs ~/Downloads/Tableau.csv
import fs from "node:fs";
import path from "node:path";

const env = Object.fromEntries(
  fs.readFileSync(fs.existsSync(".env.local") ? ".env.local" : ".env", "utf8")
    .split("\n").filter((l) => l.includes("=") && !l.trim().startsWith("#"))
    .map((l) => { const i = l.indexOf("="); return [l.slice(0, i).trim(), l.slice(i + 1).trim().replace(/^["']|["']$/g, "")]; })
);
const URL_ = env.SUPABASE_URL || env.NEXT_PUBLIC_SUPABASE_URL;
const KEY = env.SUPABASE_SERVICE_ROLE_KEY;
const H = { apikey: KEY, Authorization: `Bearer ${KEY}`, Accept: "application/json" };

const csvPath = (process.argv[2] || "").replace(/^~/, process.env.HOME || "~");
if (!csvPath || !fs.existsSync(csvPath)) {
  console.error("Usage : node scripts/age-des-pages-explorees.mjs <chemin du CSV Search Console>");
  process.exit(1);
}

// 1) Les URL de pages villes présentes dans l'export.
const lines = fs.readFileSync(csvPath, "utf8").split("\n").slice(1);
const crawled = new Map(); // "tx/cameron" -> date d'exploration
for (const line of lines) {
  const url = (line.split(",")[0] || "").trim();
  const when = (line.split(",")[1] || "").trim();
  const m = url.match(/\/lost-and-found\/([a-z]{2})\/([^/?#]+)/i);
  if (m) crawled.set(`${m[1].toLowerCase()}/${m[2].toLowerCase()}`, when);
}
console.log(`Export : ${lines.length} lignes, dont ${crawled.size} pages villes.\n`);

// 2) Tous les guides, avec leur date de création.
const guides = [];
for (let off = 0; ; off += 1000) {
  const r = await fetch(
    `${URL_}/rest/v1/city_guides?select=state_id,city_slug,created_at,status,verified&order=id.asc&limit=1000&offset=${off}`,
    { headers: H }
  );
  if (!r.ok) { console.error(`❌ ${r.status} ${await r.text()}`); process.exit(1); }
  const page = await r.json();
  guides.push(...page);
  if (page.length < 1000) break;
}

// 3) Taux d'exploration par mois de publication.
const byMonth = new Map();
for (const g of guides) {
  if (g.status !== "published") continue;
  const m = String(g.created_at).slice(0, 7);
  const key = `${String(g.state_id).toLowerCase()}/${String(g.city_slug).toLowerCase()}`;
  if (!byMonth.has(m)) byMonth.set(m, { total: 0, seen: 0 });
  const b = byMonth.get(m);
  b.total++;
  if (crawled.has(key)) b.seen++;
}

console.log("mois de publication   guides   explorés   part");
console.log("-".repeat(52));
let tot = 0, seen = 0;
for (const m of [...byMonth.keys()].sort()) {
  const b = byMonth.get(m);
  tot += b.total; seen += b.seen;
  const pct = b.total ? ((b.seen / b.total) * 100).toFixed(1) + " %" : "—";
  console.log(`${m.padEnd(21)} ${String(b.total).padStart(6)}   ${String(b.seen).padStart(8)}   ${pct.padStart(6)}`);
}
console.log("-".repeat(52));
console.log(`${"TOTAL".padEnd(21)} ${String(tot).padStart(6)}   ${String(seen).padStart(8)}   ${((seen/tot)*100).toFixed(1)} %`);

console.log(
  `\n⚠️ L'export Search Console est plafonné à 1 000 lignes : ces parts sont donc\n` +
  `   des MINIMUMS, et elles sont comparables entre elles, pas en valeur absolue.\n` +
  `   Ce qui compte est l'écart entre les mois, pas le niveau.`
);
