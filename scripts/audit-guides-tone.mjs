// scripts/audit-guides-tone.mjs
// Lecture seule. Scanne tous les guides ville (city_guides.guide, JSON) et
// classe les formulations problématiques par famille :
//   1. urgence fabriquée      2. empilement d'arguments de vente
//   3. promesses de résultat  4. chiffres non sourcés
//   5. incohérences CGV       6. "call" (tout contact se fait par mail)
//   7. points d'exclamation
// N'écrit rien. Usage : node scripts/audit-guides-tone.mjs [--full]

import fs from "fs";
import { createClient } from "@supabase/supabase-js";

const FULL = process.argv.includes("--full");

const env =
  (fs.existsSync(".env.local") ? fs.readFileSync(".env.local", "utf8") : "") + "\n" +
  (fs.existsSync(".env") ? fs.readFileSync(".env", "utf8") : "");
const url =
  env.match(/^SUPABASE_URL=([^\s]+)/m)?.[1] ||
  env.match(/^NEXT_PUBLIC_SUPABASE_URL=([^\s]+)/m)?.[1];
const key = env.match(/^SUPABASE_SERVICE_ROLE_KEY=([^\s]+)/m)?.[1];
if (!url || !key) { console.error("Clés Supabase introuvables dans .env.local"); process.exit(1); }
const sb = createClient(url, key, { auth: { persistSession: false } });

const FAMILIES = [
  ["1 · urgence fabriquée", [
    /the clock is ticking/gi, /time is (running out|of the essence)/gi, /act (fast|now|quickly)/gi,
    /don'?t (wait|delay)/gi, /every (minute|second|hour) counts/gi, /the sooner .{0,30}the better/gi,
    /as soon as possible/gi, /right away/gi, /today\b[^.]{0,20}!/gi, /hurry/gi,
  ]],
  ["2 · empilement d'arguments de vente", [
    /get more eyes on it/gi, /take the legwork off your hands/gi, /every channel that matters/gi,
    /you'?re among the first to know/gi, /exhaust yourself/gi, /heavy lifting/gi,
    /let us handle/gi, /we do the (hard|difficult) (work|part)/gi, /maximi[sz]e your chances/gi,
    /boost your chances/gi, /dramatically (increase|improve)/gi, /takes (just |only )?\d+ minutes?/gi,
    /it'?s free/gi, /no account (needed|required)/gi, /peace of mind/gi, /hassle[- ]free/gi,
    /stress[- ]free/gi, /in just a few clicks/gi,
  ]],
  ["3 · promesses de résultat", [
    /we'?ll (find|recover|get) (it|your)/gi, /we will (find|recover) /gi, /guarantee/gi,
    /you'?ll (have it back|get it back)/gi, /get it back\b/gi, /chances are (high|good)/gi,
    /most items are (returned|recovered|found)/gi, /odds are/gi, /highly likely/gi,
    /(will|can) be reunited/gi,
  ]],
  ["4 · chiffres non sourcés", [
    /\b\d{1,3}\s?% of (items|people|reports|losses)/gi, /studies show/gi, /research shows/gi,
    /statistics show/gi, /most people (who|that)/gi, /\bthousands of\b/gi, /\bmillions of\b/gi,
  ]],
  ["5 · incohérence CGV", [
    /official (lost|report|service|channel)/gi, /on behalf of the police/gi,
    /(partner|partnered|partnership) with (the )?(police|authorities|transit)/gi,
    /we contact the police for you/gi, /file(d)? a police report for you/gi,
    /\bsubscription\b/gi, /monthly/gi, /renew(al|s|ed)?\b/gi,
    /\b(free|no) (trial|refund)/gi, /money[- ]back/gi,
    /unlimited/gi, /24\/7/gi, /around the clock/gi,
  ]],
  ["6 · « call » (tout contact se fait par mail)", [
    /\bcall (us|our|the team)/gi, /give us a call/gi, /\bphone us\b/gi, /call our (support|team|office)/gi,
  ]],
  ["7 · points d'exclamation", [ /!/g ]],
];

const rows = [];
const PAGE = 500;
for (let from = 0; ; from += PAGE) {
  const { data, error } = await sb
    .from("city_guides")
    .select("id, state_id, city_slug, status, guide")
    .order("id", { ascending: true })
    .range(from, from + PAGE - 1);
  if (error) { console.error("Erreur lecture:", error.message); process.exit(1); }
  if (!data?.length) break;
  rows.push(...data);
  if (data.length < PAGE) break;
}

const published = rows.filter((r) => r.status === "published").length;
console.log(`\n📊 ${rows.length} guides (${published} publiés, ${rows.length - published} brouillons)\n`);

const report = new Map();   // famille -> Map(motif -> {n, guides:Set, ex:[]})
for (const r of rows) {
  if (!r.guide) continue;
  const text = JSON.stringify(r.guide);
  for (const [fam, patterns] of FAMILIES) {
    for (const re of patterns) {
      const m = text.match(re);
      if (!m) continue;
      if (!report.has(fam)) report.set(fam, new Map());
      const byFam = report.get(fam);
      const label = re.source.replace(/\\/g, "");
      if (!byFam.has(label)) byFam.set(label, { n: 0, guides: new Set(), ex: [] });
      const e = byFam.get(label);
      e.n += m.length;
      e.guides.add(`${r.state_id}/${r.city_slug}`);
      if (e.ex.length < 2) {
        const i = text.search(re);
        e.ex.push(text.slice(Math.max(0, i - 70), i + 90).replace(/\\n/g, " "));
      }
    }
  }
}

for (const [fam, patterns] of FAMILIES) {
  const byFam = report.get(fam);
  if (!byFam) { console.log(`✅ ${fam} — rien`); continue; }
  const total = [...byFam.values()].reduce((a, e) => a + e.n, 0);
  const guides = new Set([...byFam.values()].flatMap((e) => [...e.guides]));
  console.log(`\n⚠️  ${fam} — ${total} occurrence(s) dans ${guides.size} guide(s)`);
  const sorted = [...byFam.entries()].sort((a, b) => b[1].n - a[1].n);
  for (const [label, e] of sorted.slice(0, FULL ? 99 : 8)) {
    console.log(`   • ${label.padEnd(42)} ${String(e.n).padStart(6)} occ. / ${e.guides.size} guides`);
    if (FULL) for (const x of e.ex) console.log(`        …${x}…`);
  }
}
console.log("\n🔍 Lecture seule, rien n'a été modifié.\n");
