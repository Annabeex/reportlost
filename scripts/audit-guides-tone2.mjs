// scripts/audit-guides-tone2.mjs
// Lecture seule. Deuxième passe : pour chaque motif, on remonte le CHAMP du
// guide (h1, heroSubtitle, intro, cards, faq…) et la PHRASE complète.
// C'est le champ qui tranche : "official" dans `cards` désigne un service tiers
// (légitime), dans `heroSubtitle` il parle de ReportLost (problème).
//
//   node scripts/audit-guides-tone2.mjs
//
// Écrit audit-tone-report.json à la racine. N'écrit rien en base.

import fs from "fs";
import { createClient } from "@supabase/supabase-js";

const env =
  (fs.existsSync(".env.local") ? fs.readFileSync(".env.local", "utf8") : "") + "\n" +
  (fs.existsSync(".env") ? fs.readFileSync(".env", "utf8") : "");
const url =
  env.match(/^SUPABASE_URL=([^\s]+)/m)?.[1] ||
  env.match(/^NEXT_PUBLIC_SUPABASE_URL=([^\s]+)/m)?.[1];
const key = env.match(/^SUPABASE_SERVICE_ROLE_KEY=([^\s]+)/m)?.[1];
if (!url || !key) { console.error("Clés Supabase introuvables"); process.exit(1); }
const sb = createClient(url, key, { auth: { persistSession: false } });

const PATTERNS = [
  ["urgence/right away",        /right away/gi],
  ["urgence/sooner the better", /the sooner\b[^.]{0,40}the better/gi],
  ["urgence/every minute",      /every (minute|second|hour) counts/gi],
  ["urgence/asap",              /as soon as possible/gi],
  ["urgence/act fast",          /act (fast|now|quickly)/gi],
  ["urgence/dont wait",         /don'?t (wait|delay)/gi],
  ["vente/let us handle",       /let us handle/gi],
  ["vente/peace of mind",       /peace of mind/gi],
  ["vente/heavy lifting",       /heavy lifting/gi],
  ["vente/maximize chances",    /maximi[sz]e your chances/gi],
  ["vente/dramatically",        /dramatically (increase|improve)/gi],
  ["vente/every channel",       /every channel that matters/gi],
  ["promesse/get it back",      /get it back/gi],
  ["promesse/guarantee",        /guarantee[ds]?/gi],
  ["promesse/well find it",     /we'?ll (find|recover|get) (it|your)/gi],
  ["promesse/most items",       /most items are (returned|recovered|found)/gi],
  ["promesse/reunited",         /(will|can) be reunited/gi],
  ["chiffres/thousands",        /\bthousands of\b/gi],
  ["cgv/official",              /official [a-z]+/gi],
  ["cgv/24-7",                  /24\/7/gi],
  ["cgv/around the clock",      /around the clock/gi],
  ["cgv/monthly",               /monthly/gi],
  ["cgv/subscription",          /\bsubscription\b/gi],
  ["cgv/renewal",               /renew(al|s|ed)?\b/gi],
  ["cgv/partner police",        /(partner|partnered|partnership) with (the )?(police|authorities|transit)/gi],
  ["cgv/file police for you",   /file(d)? a police report for you/gi],
  ["ton/exclamation",           /!/g],
];

const strip = (s) => String(s).replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();

// Toutes les chaînes du guide, avec leur chemin
function strings(node, path, out) {
  if (typeof node === "string") { out.push([path, node]); return; }
  if (Array.isArray(node)) { node.forEach((n, i) => strings(n, `${path}[${i}]`, out)); return; }
  if (node && typeof node === "object")
    for (const [k, v] of Object.entries(node)) strings(v, path ? `${path}.${k}` : k, out);
}

// Champ racine : h1, faq, cards… (c'est lui qui discrimine)
const rootField = (p) => p.split(/[.[]/)[0];

function sentenceAround(text, idx) {
  const t = strip(text);
  const i = Math.min(idx, t.length - 1);
  let a = t.lastIndexOf(". ", i); a = a < 0 ? 0 : a + 2;
  let b = t.indexOf(". ", i); b = b < 0 ? t.length : b + 1;
  return t.slice(a, b).slice(0, 240);
}

const rows = [];
const PAGE = 500;
for (let from = 0; ; from += PAGE) {
  const { data, error } = await sb.from("city_guides")
    .select("id, state_id, city_slug, status, guide")
    .order("id", { ascending: true }).range(from, from + PAGE - 1);
  if (error) { console.error("Erreur:", error.message); process.exit(1); }
  if (!data?.length) break;
  rows.push(...data);
  if (data.length < PAGE) break;
}
console.log(`\n📊 ${rows.length} guides analysés\n`);

const acc = new Map(); // motif -> { total, byField:Map, samples:[] }
for (const [name] of PATTERNS) acc.set(name, { total: 0, byField: new Map(), samples: [] });

for (const r of rows) {
  if (!r.guide) continue;
  const out = [];
  strings(r.guide, "", out);
  for (const [path, raw] of out) {
    const clean = strip(raw);
    if (!clean) continue;
    for (const [name, re] of PATTERNS) {
      re.lastIndex = 0;
      let m;
      while ((m = re.exec(clean)) !== null) {
        const e = acc.get(name);
        e.total++;
        const f = rootField(path);
        e.byField.set(f, (e.byField.get(f) || 0) + 1);
        if (e.samples.length < 25 && e.samples.length * 40 < e.total + 40)
          e.samples.push({ city: `${r.state_id}/${r.city_slug}`, field: path, s: sentenceAround(clean, m.index) });
        if (!re.global) break;
      }
    }
  }
}

for (const [name] of PATTERNS) {
  const e = acc.get(name);
  if (!e.total) continue;
  const fields = [...e.byField.entries()].sort((a, b) => b[1] - a[1])
    .map(([f, n]) => `${f}:${n}`).join("  ");
  console.log(`${name.padEnd(28)} ${String(e.total).padStart(6)}   ${fields}`);
}

const report = {};
for (const [name] of PATTERNS) {
  const e = acc.get(name);
  if (!e.total) continue;
  report[name] = { total: e.total, byField: Object.fromEntries(e.byField), samples: e.samples };
}
fs.writeFileSync("audit-tone-report.json", JSON.stringify(report, null, 1));
console.log(`\n✅ Détail écrit dans audit-tone-report.json (lecture seule, base intacte)\n`);
