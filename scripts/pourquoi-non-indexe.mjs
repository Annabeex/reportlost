// scripts/pourquoi-non-indexe.mjs
//
// Compare les pages que Google REFUSE d'indexer à celles qu'il indexe, sur des
// attributs mesurables. Depuis le début on raisonne sur trois ou quatre exemples,
// et chaque hypothèse tirée d'un exemple s'est fait démentir par le suivant :
// Laurel avait de fausses coordonnées, Kernersville les a justes et est refusée
// tout autant. Un exemple ne prouve rien ; une différence de distribution, si.
//
// Entrées (exports Search Console, en CSV) :
//   --rejets=  Indexation > Pages non indexées > "Explorée, actuellement non
//              indexée" > Exporter. Une colonne d'URL suffit.
//   --perf=    Performances > Pages > Exporter (les pages qui reçoivent des
//              impressions sont, de fait, indexées). Facultatif : sans lui, la
//              comparaison se fait contre tout le reste du parc.
//
//   node scripts/pourquoi-non-indexe.mjs --rejets=~/Downloads/rejets.csv
//   node scripts/pourquoi-non-indexe.mjs --rejets=r.csv --perf=p.csv

import fs from "fs";
import { createClient } from "@supabase/supabase-js";

const args = process.argv.slice(2);
const opt = (n, d = "") => (args.find((a) => a.startsWith(`--${n}=`)) || `--${n}=${d}`).split("=").slice(1).join("=");
const F_REJ = opt("rejets");
const F_PERF = opt("perf");
if (!F_REJ) { console.error("Il faut au moins --rejets=fichier.csv"); process.exit(1); }

const lis = (p) => fs.readFileSync(p.replace(/^~/, process.env.HOME), "utf8");
const RE_URL = /reportlost\.org\/lost-and-found\/([a-z]{2})\/([a-z0-9-]+)/gi;
const clefs = (txt) => {
  const s = new Set();
  for (const m of txt.matchAll(RE_URL)) {
    const st = m[1].toUpperCase(), slug = m[2].toLowerCase();
    if (slug === "county") continue;
    s.add(`${st}|${slug}`);
  }
  return s;
};

const rejets = clefs(lis(F_REJ));
const perf = F_PERF ? clefs(lis(F_PERF)) : null;
console.log(`\n  ${rejets.size} pages ville refusées.` + (perf ? `  ${perf.size} pages avec des impressions.` : ""));

// ------------------------------------------------------------------ base
const env =
  (fs.existsSync(".env.local") ? fs.readFileSync(".env.local", "utf8") : "") + "\n" +
  (fs.existsSync(".env") ? fs.readFileSync(".env", "utf8") : "");
const url =
  env.match(/^SUPABASE_URL=([^\s]+)/m)?.[1] ||
  env.match(/^NEXT_PUBLIC_SUPABASE_URL=([^\s]+)/m)?.[1];
const key = env.match(/^SUPABASE_SERVICE_ROLE_KEY=([^\s]+)/m)?.[1];
const sb = createClient(url, key, { auth: { persistSession: false } });

const ville = new Map();
for (let from = 0; ; from += 1000) {
  const { data } = await sb.from("us_cities")
    .select("state_id, city_ascii, county_name, population").range(from, from + 999);
  if (!data?.length) break;
  for (const c of data) ville.set(
    `${String(c.state_id).toUpperCase()}|${String(c.city_ascii).trim().toLowerCase()}`,
    { comte: c.county_name || "?", pop: Number(c.population || 0) });
  if (data.length < 1000) break;
}

const guides = [];
for (let from = 0; ; from += 500) {
  const { data } = await sb.from("city_guides").select("*").range(from, from + 499);
  if (!data?.length) break;
  guides.push(...data);
  if (data.length < 500) break;
}

const plat = (row) => { const o = []; const v = (x) => {
  if (x == null) return;
  if (typeof x === "string") { o.push(x); return; }
  if (Array.isArray(x)) { x.forEach(v); return; }
  if (typeof x === "object") { for (const k in x) v(x[k]); } }; v(row); return o.join(" "); };

const PROMESSE = /\b(get (it|them|your \w+) back|bring (it|them) back|recover your|we(’|')?ll find|guarantee|reunite)/i;
const DUREE_KO = /6 (or|to) 12 months/i;
const TOLL = new Set(["800","833","844","855","866","877","888"]);
const RE_TEL = /\b(?:\+?1[-. ]?)?\(?([2-9]\d{2})\)?[-. ]?([2-9]\d{2})[-. ]?(\d{4})\b/g;
const RE_DOM = /https?:\/\/([a-z0-9.-]+\.[a-z]{2,})/gi;
const IGN = /(reportlost|google|facebook|twitter|x\.com|instagram|youtube|linkedin|apple|bit\.ly|wikipedia)/i;

const parComte = new Map();
const fiches = guides.map((g) => {
  const st = String(g.state_id || "??").toUpperCase();
  const slug = String(g.city_slug || "").trim().toLowerCase();
  const v = ville.get(`${st}|${slug}`) || { comte: "?", pop: 0 };
  const texte = plat(g);
  const contacts = new Set();
  for (const m of texte.matchAll(RE_TEL)) if (!TOLL.has(m[1])) contacts.add(`t:${m[1]}${m[2]}${m[3]}`);
  for (const m of texte.matchAll(RE_DOM)) { const d = m[1].toLowerCase().replace(/^www\./,""); if (!IGN.test(d)) contacts.add(`d:${d}`); }
  const f = { cle: `${st}|${slug}`, st, slug, comte: v.comte, pop: v.pop,
    tone: Number(g.tone_version || 1), statut: String(g.status || "?"),
    mots: texte.split(/\s+/).length, contacts: [...contacts],
    promesse: PROMESSE.test(texte), duree: DUREE_KO.test(texte) };
  const k = `${st}|${v.comte}`;
  if (!parComte.has(k)) parComte.set(k, new Map());
  for (const c of f.contacts) parComte.get(k).set(c, (parComte.get(k).get(c) || 0) + 1);
  return f;
});
for (const f of fiches) {
  const m = parComte.get(`${f.st}|${f.comte}`);
  f.propres = f.contacts.filter((c) => (m.get(c) || 0) <= 2).length;
}
const parCle = new Map(fiches.map((f) => [f.cle, f]));

// ------------------------------------------------------------- groupes
const A = [...rejets].map((k) => parCle.get(k)).filter(Boolean);
const B = perf
  ? [...perf].map((k) => parCle.get(k)).filter(Boolean)
  : fiches.filter((f) => !rejets.has(f.cle));

const sansGuide = rejets.size - A.length;
console.log(`  ${A.length} refusées ont un guide en base, ${sansGuide} n'en ont pas.\n`);

const med = (xs) => { if (!xs.length) return 0; const s = [...xs].sort((a,b)=>a-b); return s[Math.floor(s.length/2)]; };
const moy = (xs) => xs.length ? xs.reduce((a,b)=>a+b,0)/xs.length : 0;
const part = (g, f) => g.length ? (100 * g.filter(f).length) / g.length : 0;

const lignes = [
  ["pages",                 (g) => g.length,                                  (v) => String(v)],
  ["population médiane",    (g) => med(g.map(x => x.pop)),                    (v) => v.toLocaleString("fr-FR")],
  ["mots (médiane)",        (g) => med(g.map(x => x.mots)),                   (v) => v.toLocaleString("fr-FR")],
  ["contacts (moyenne)",    (g) => moy(g.map(x => x.contacts.length)),        (v) => v.toFixed(1)],
  ["dont propres (moy.)",   (g) => moy(g.map(x => x.propres)),                (v) => v.toFixed(1)],
  ["% sans contact propre", (g) => part(g, x => x.propres === 0),             (v) => v.toFixed(1) + " %"],
  ["% avec une promesse",   (g) => part(g, x => x.promesse),                  (v) => v.toFixed(1) + " %"],
  ["% « 6 or 12 months »",  (g) => part(g, x => x.duree),                     (v) => v.toFixed(1) + " %"],
  ["% ton v2",              (g) => part(g, x => x.tone === 2),                (v) => v.toFixed(1) + " %"],
  ["% statut legacy",       (g) => part(g, x => x.statut === "legacy"),       (v) => v.toFixed(1) + " %"],
];

console.log(`  ${"".padEnd(24)}  refusées    ${perf ? "indexées" : "le reste"}    écart`);
console.log("  " + "─".repeat(64));
for (const [nom, calc, fmt] of lignes) {
  const a = calc(A), b = calc(B);
  let ecart = "—";
  if (typeof a === "number" && typeof b === "number" && b !== 0) {
    const d = (100 * (a - b)) / b;
    if (Math.abs(d) >= 1) ecart = `${d > 0 ? "+" : ""}${d.toFixed(0)} %`;
  }
  console.log(`  ${nom.padEnd(24)}  ${fmt(a).padStart(9)}  ${fmt(b).padStart(10)}  ${ecart.padStart(8)}`);
}

const parEtat = new Map();
for (const f of A) parEtat.set(f.st, (parEtat.get(f.st) || 0) + 1);
console.log(`\n  Refusées par État (12 premiers)\n  ${"─".repeat(40)}`);
for (const [e, n] of [...parEtat.entries()].sort((a,b)=>b[1]-a[1]).slice(0, 12)) {
  const tot = fiches.filter((f) => f.st === e).length;
  console.log(`  ${e}  ${String(n).padStart(5)} / ${String(tot).padStart(5)} guides  (${((100*n)/tot).toFixed(0)} %)`);
}
console.log("");
