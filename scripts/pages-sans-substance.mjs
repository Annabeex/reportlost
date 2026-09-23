// scripts/pages-sans-substance.mjs
//
// Combien de pages ville ne disent rien que la page comté ne dise déjà ?
//
// La question de départ : Laurel (FL) n'a ni mairie, ni police, ni transport.
// Le générateur, sommé d'écrire une page locale sur un endroit sans institution,
// est allé chercher une mairie du Delaware. Le problème n'est donc pas le ton ni
// le prompt : c'est qu'il n'y avait rien à écrire.
//
// Critère retenu, mesurable sans donnée externe : une page a de la substance si
// elle cite au moins un contact (domaine ou téléphone) que les AUTRES pages de
// son comté ne citent pas. Si tous ses contacts sont ceux du shérif et des
// services partagés, elle est un doublon de la page comté, et elle restera
// « explorée, non indexée » quoi qu'on y écrive.
//
//   node scripts/pages-sans-substance.mjs
//   node scripts/pages-sans-substance.mjs --etat=FL --detail
//   node scripts/pages-sans-substance.mjs --liste-redirections > redirections.csv

import fs from "fs";
import { createClient } from "@supabase/supabase-js";

const args = process.argv.slice(2);
const has = (n) => args.includes(`--${n}`);
const opt = (n, d) => (args.find((a) => a.startsWith(`--${n}=`)) || `--${n}=${d}`).split("=")[1];
const DETAIL = has("detail");
const CSV = has("liste-redirections");
const ETAT = opt("etat", "").toUpperCase();
const SEUIL_POP = Number(opt("pop", 15000)); // au-dessus, on garde quoi qu'il arrive

const env =
  (fs.existsSync(".env.local") ? fs.readFileSync(".env.local", "utf8") : "") + "\n" +
  (fs.existsSync(".env") ? fs.readFileSync(".env", "utf8") : "");
const url =
  env.match(/^SUPABASE_URL=([^\s]+)/m)?.[1] ||
  env.match(/^NEXT_PUBLIC_SUPABASE_URL=([^\s]+)/m)?.[1];
const key = env.match(/^SUPABASE_SERVICE_ROLE_KEY=([^\s]+)/m)?.[1];
const sb = createClient(url, key, { auth: { persistSession: false } });
const log = (...a) => { if (!CSV) console.log(...a); };

// ---------------------------------------------------------------- villes
const ville = new Map(); // "FL|laurel" -> { comte, pop }
for (let from = 0; ; from += 1000) {
  const { data, error } = await sb.from("us_cities")
    .select("state_id, city_ascii, county_name, population").range(from, from + 999);
  if (error) { console.error(error.message); process.exit(1); }
  if (!data?.length) break;
  for (const c of data) {
    ville.set(`${String(c.state_id).toUpperCase()}|${String(c.city_ascii).trim().toLowerCase()}`,
      { comte: c.county_name || "?", pop: Number(c.population || 0) });
  }
  if (data.length < 1000) break;
}

// ---------------------------------------------------------------- guides
const guides = [];
for (let from = 0; ; from += 500) {
  let q = sb.from("city_guides").select("*").range(from, from + 499);
  if (ETAT) q = q.eq("state_id", ETAT);
  const { data, error } = await q;
  if (error) { console.error(error.message); process.exit(1); }
  if (!data?.length) break;
  guides.push(...data);
  if (data.length < 500) break;
}

const plat = (row) => {
  const out = [];
  const v = (x) => {
    if (x == null) return;
    if (typeof x === "string") { out.push(x); return; }
    if (Array.isArray(x)) { x.forEach(v); return; }
    if (typeof x === "object") { for (const k in x) v(x[k]); }
  };
  v(row); return out.join(" \n ");
};

const TOLL_FREE = new Set(["800","833","844","855","866","877","888"]);
const RE_TEL = /\b(?:\+?1[-. ]?)?\(?([2-9]\d{2})\)?[-. ]?([2-9]\d{2})[-. ]?(\d{4})\b/g;
const RE_DOM = /https?:\/\/([a-z0-9.-]+\.[a-z]{2,})/gi;
const IGNORE = /(reportlost|google|facebook|twitter|x\.com|instagram|youtube|linkedin|apple|bit\.ly|wikipedia)/i;

const fiches = guides.map((g) => {
  const st = String(g.state_id || "??").toUpperCase();
  const slug = String(g.city_slug || "").trim().toLowerCase();
  const v = ville.get(`${st}|${slug}`) || { comte: "?", pop: 0 };
  const texte = plat(g);
  const contacts = new Set();
  for (const m of texte.matchAll(RE_TEL)) {
    if (!TOLL_FREE.has(m[1])) contacts.add(`tel:${m[1]}${m[2]}${m[3]}`);
  }
  for (const m of texte.matchAll(RE_DOM)) {
    const d = m[1].toLowerCase().replace(/^www\./, "");
    if (!IGNORE.test(d)) contacts.add(`dom:${d}`);
  }
  return { st, slug, comte: v.comte, pop: v.pop, tone: g.tone_version ?? 1,
    statut: g.status || "?", contacts: [...contacts] };
});

// ------------------------------------------- fréquence des contacts par comté
const parComte = new Map();  // "FL|Sarasota" -> Map(contact -> n)
for (const f of fiches) {
  const k = `${f.st}|${f.comte}`;
  if (!parComte.has(k)) parComte.set(k, new Map());
  const m = parComte.get(k);
  for (const c of f.contacts) m.set(c, (m.get(c) || 0) + 1);
}

for (const f of fiches) {
  const m = parComte.get(`${f.st}|${f.comte}`);
  f.propres = f.contacts.filter((c) => (m.get(c) || 0) <= 2).length;
  f.partages = f.contacts.length - f.propres;
  f.videDeSubstance = f.propres === 0;
  f.redirigeable = f.videDeSubstance && f.pop < SEUIL_POP;
}

// ---------------------------------------------------------------- sortie
if (CSV) {
  console.log("state,city_slug,county,population,contacts,contacts_propres");
  for (const f of fiches.filter((x) => x.redirigeable).sort((a, b) => a.st.localeCompare(b.st) || a.slug.localeCompare(b.slug))) {
    console.log(`${f.st},${f.slug},"${f.comte}",${f.pop},${f.contacts.length},${f.propres}`);
  }
  process.exit(0);
}

const n = fiches.length;
const vides = fiches.filter((f) => f.videDeSubstance);
const redir = fiches.filter((f) => f.redirigeable);
const sansContact = fiches.filter((f) => f.contacts.length === 0);
const pct = (x) => ((100 * x) / n).toFixed(1);

log(`\n  ${n} guides examinés${ETAT ? ` (${ETAT})` : ""}.\n`);
log(`  ${String(sansContact.length).padStart(5)}  sans AUCUN contact         ${pct(sansContact.length)} %`);
log(`  ${String(vides.length).padStart(5)}  aucun contact qui leur soit propre   ${pct(vides.length)} %`);
log(`  ${String(redir.length).padStart(5)}  …et moins de ${SEUIL_POP.toLocaleString("fr-FR")} habitants  → candidates à la redirection comté   ${pct(redir.length)} %`);
log(`  ${String(n - vides.length).padStart(5)}  ont une substance locale réelle      ${pct(n - vides.length)} %\n`);

log("  Contacts propres par page");
log("  " + "─".repeat(46));
const tranches = [[0,"aucun"],[1,"1"],[2,"2"],[3,"3 à 4"],[5,"5 et plus"]];
for (const [seuil, lab] of tranches) {
  const c = fiches.filter((f) => seuil === 0 ? f.propres === 0
    : seuil === 5 ? f.propres >= 5
    : seuil === 3 ? f.propres >= 3 && f.propres <= 4
    : f.propres === seuil).length;
  log(`  ${lab.padEnd(12)} ${String(c).padStart(5)}  ${"▉".repeat(Math.round(40 * c / n))}`);
}

log("\n  Par tranche de population");
log("  " + "─".repeat(58));
const bornes = [[0,1000],[1000,5000],[5000,15000],[15000,50000],[50000,1e9]];
for (const [a, b] of bornes) {
  const g = fiches.filter((f) => f.pop >= a && f.pop < b);
  if (!g.length) continue;
  const v = g.filter((f) => f.videDeSubstance).length;
  log(`  ${(a.toLocaleString("fr-FR") + "–" + (b > 1e8 ? "+" : b.toLocaleString("fr-FR"))).padEnd(18)}` +
    ` ${String(g.length).padStart(5)} pages — ${String(v).padStart(5)} sans substance (${((100*v)/g.length).toFixed(0)} %)`);
}

const parEtat = new Map();
for (const f of redir) parEtat.set(f.st, (parEtat.get(f.st) || 0) + 1);
log("\n  Candidates à la redirection, par État (15 premiers)");
log("  " + "─".repeat(46));
for (const [e, c] of [...parEtat.entries()].sort((a, b) => b[1] - a[1]).slice(0, 15)) {
  log(`  ${e}  ${String(c).padStart(5)}`);
}

if (DETAIL) {
  log("\n  Détail des candidates\n  " + "─".repeat(70));
  for (const f of redir.slice(0, 200)) {
    log(`  ${f.st}/${f.slug.padEnd(24)} ${String(f.pop).padStart(7)} hab.  ${f.comte} County` +
      `  — ${f.contacts.length} contact(s), tous partagés`);
  }
  if (redir.length > 200) log(`  … et ${redir.length - 200} autres.`);
}
log("");
