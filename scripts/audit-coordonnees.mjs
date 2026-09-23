// scripts/audit-coordonnees.mjs
//
// Repère les guides qui donnent les coordonnées d'un AUTRE endroit.
//
// Le cas qui a déclenché ce script : /lost-and-found/fl/laurel renvoyait vers
// townoflaurel.net (la mairie de Laurel, DELAWARE) et vers le 352-334-2600
// (les bus de Gainesville, à 250 km). Une page qui promet une information
// locale et donne celle d'un autre État est jugée sans valeur par Google — et
// elle dessert réellement la personne qui la lit.
//
// Méthode : aucune base externe. On se sert de la cohérence interne du parc.
//   • un indicatif téléphonique qui, partout ailleurs sur le site, désigne un
//     autre comté ou un autre État, est suspect ici ;
//   • un domaine qui apparaît dans plusieurs États ne peut pas être le service
//     local des deux.
//
//   node scripts/audit-coordonnees.mjs             → l'ampleur
//   node scripts/audit-coordonnees.mjs --detail    → page par page
//   node scripts/audit-coordonnees.mjs --etat=FL

import fs from "fs";
import { createClient } from "@supabase/supabase-js";

const args = process.argv.slice(2);
const has = (n) => args.includes(`--${n}`);
const opt = (n, d) => (args.find((a) => a.startsWith(`--${n}=`)) || `--${n}=${d}`).split("=")[1];
const DETAIL = has("detail");
const ETAT = opt("etat", "").toUpperCase();

const env =
  (fs.existsSync(".env.local") ? fs.readFileSync(".env.local", "utf8") : "") + "\n" +
  (fs.existsSync(".env") ? fs.readFileSync(".env", "utf8") : "");
const url =
  env.match(/^SUPABASE_URL=([^\s]+)/m)?.[1] ||
  env.match(/^NEXT_PUBLIC_SUPABASE_URL=([^\s]+)/m)?.[1];
const key = env.match(/^SUPABASE_SERVICE_ROLE_KEY=([^\s]+)/m)?.[1];
const sb = createClient(url, key, { auth: { persistSession: false } });

// ------------------------------------------------- villes → comté
const comte = new Map();   // "FL|laurel" -> "Sarasota"
for (let from = 0; ; from += 1000) {
  const { data, error } = await sb.from("us_cities")
    .select("state_id, city_ascii, county_name").range(from, from + 999);
  if (error) { console.error(error.message); process.exit(1); }
  if (!data?.length) break;
  for (const c of data) {
    comte.set(`${String(c.state_id).toUpperCase()}|${String(c.city_ascii).trim().toLowerCase()}`,
      c.county_name || "?");
  }
  process.stderr.write(`\r  villes… ${comte.size}`);
  if (data.length < 1000) break;
}

// ------------------------------------------------- guides
const guides = [];
for (let from = 0; ; from += 500) {
  let q = sb.from("city_guides").select("*").range(from, from + 499);
  if (ETAT) q = q.eq("state_id", ETAT);
  const { data, error } = await q;
  if (error) { console.error(error.message); process.exit(1); }
  if (!data?.length) break;
  guides.push(...data);
  process.stderr.write(`\r  guides… ${guides.length}   `);
  if (data.length < 500) break;
}
process.stderr.write("\r                                  \r");

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
const IGNORE_DOM = /(reportlost|google|facebook|twitter|x\.com|instagram|youtube|linkedin|apple|bit\.ly)/i;

// passe 1 : où chaque indicatif et chaque domaine apparaissent
const indicatif = new Map();  // "352" -> Map("FL|Alachua" -> n)
const domaine = new Map();    // "townoflaurel.net" -> Map("DE" -> n)
const fiches = [];

for (const g of guides) {
  const st = String(g.state_id || "??").toUpperCase();
  const slug = String(g.city_slug || "").trim().toLowerCase();
  const cty = comte.get(`${st}|${slug}`) || "?";
  const texte = plat(g);

  const tels = new Set([...texte.matchAll(RE_TEL)].map((m) => m[1]));
  const doms = new Set([...texte.matchAll(RE_DOM)].map((m) => m[1].toLowerCase().replace(/^www\./, ""))
    .filter((d) => !IGNORE_DOM.test(d)));

  for (const a of tels) {
    if (TOLL_FREE.has(a)) continue;   // 800, 888… ne désignent aucune région
    if (!indicatif.has(a)) indicatif.set(a, new Map());
    const m = indicatif.get(a); const k = `${st}|${cty}`;
    m.set(k, (m.get(k) || 0) + 1);
  }
  for (const d of doms) {
    if (!domaine.has(d)) domaine.set(d, new Map());
    const m = domaine.get(d);
    m.set(st, (m.get(st) || 0) + 1);
  }
  fiches.push({ st, slug, cty, tels: [...tels], doms: [...doms], tone: g.tone_version ?? null });
}

const dominant = (m) => [...m.entries()].sort((a, b) => b[1] - a[1])[0];

// passe 2 : les anomalies
const suspects = [];
for (const f of fiches) {
  const motifs = [];

  for (const a of f.tels) {
    const rep = indicatif.get(a);
    const [kDom, nDom] = dominant(rep);
    const total = [...rep.values()].reduce((s, n) => s + n, 0);
    const ici = rep.get(`${f.st}|${f.cty}`) || 0;
    // l'indicatif appartient massivement ailleurs, et presque jamais ici
    if (total >= 5 && nDom / total >= 0.6 && kDom !== `${f.st}|${f.cty}` && ici <= 1) {
      const [etatDom] = kDom.split("|");
      motifs.push({
        type: etatDom !== f.st ? "tel-autre-etat" : "tel-autre-comte",
        detail: `indicatif ${a} → ${kDom} (${nDom}/${total} des pages où il figure)`,
      });
    }
  }

  for (const d of f.doms) {
    const rep = domaine.get(d);
    if (rep.size <= 1) continue;
    const [etatDom, nDom] = dominant(rep);
    const total = [...rep.values()].reduce((s, n) => s + n, 0);
    if (etatDom !== f.st && nDom / total >= 0.6 && (rep.get(f.st) || 0) <= 2) {
      motifs.push({ type: "domaine-autre-etat",
        detail: `${d} → surtout ${etatDom} (${nDom}/${total})` });
    }
  }

  if (motifs.length) suspects.push({ ...f, motifs });
}

// ------------------------------------------------- sortie
const parType = new Map();
for (const s of suspects) for (const m of s.motifs)
  parType.set(m.type, (parType.get(m.type) || 0) + 1);

console.log(`\n  ${guides.length} guides examinés${ETAT ? ` (${ETAT})` : ""}.`);
console.log(`  ${suspects.length} avec des coordonnées douteuses — ` +
  `${((100 * suspects.length) / guides.length).toFixed(1)} %.\n`);
for (const [t, n] of [...parType.entries()].sort((a, b) => b[1] - a[1])) {
  console.log(`  ${String(n).padStart(5)}  ${t}`);
}

const parEtat = new Map();
for (const s of suspects) parEtat.set(s.st, (parEtat.get(s.st) || 0) + 1);
console.log(`\n  Par État (15 premiers)\n  ${"─".repeat(40)}`);
for (const [e, n] of [...parEtat.entries()].sort((a, b) => b[1] - a[1]).slice(0, 15)) {
  console.log(`  ${e}  ${String(n).padStart(5)}`);
}

if (DETAIL) {
  console.log(`\n  Détail\n  ${"─".repeat(76)}`);
  for (const s of suspects.slice(0, 300)) {
    console.log(`\n  ${s.st}/${s.slug}  (${s.cty} County)  [v${s.tone ?? "1"}]`);
    for (const m of s.motifs) console.log(`     ⚑ ${m.type} — ${m.detail}`);
  }
  if (suspects.length > 300) console.log(`\n  … et ${suspects.length - 300} autres.`);
}
console.log("");
