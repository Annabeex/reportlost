// scripts/provenance-visites.mjs
//
// D'où vient le trafic, mois par mois, d'après la table `events`.
//
// Search Console ne mesure que Google. Si l'essentiel des dépôts vient des
// réseaux, des liens entrants ou du direct, alors les pages villes ne sont pas
// le moteur qu'on croit — et l'effort d'indexation n'est pas la priorité.
//
//   node scripts/provenance-visites.mjs --span=180
import fs from "node:fs";

const env = Object.fromEntries(
  fs.readFileSync(fs.existsSync(".env.local") ? ".env.local" : ".env", "utf8")
    .split("\n").filter((l) => l.includes("=") && !l.trim().startsWith("#"))
    .map((l) => { const i = l.indexOf("="); return [l.slice(0, i).trim(), l.slice(i + 1).trim().replace(/^["']|["']$/g, "")]; })
);
const URL_ = env.SUPABASE_URL || env.NEXT_PUBLIC_SUPABASE_URL;
const KEY = env.SUPABASE_SERVICE_ROLE_KEY;
if (!URL_ || !KEY) { console.error("❌ identifiants Supabase introuvables"); process.exit(1); }

const SPAN = Number((process.argv.find((a) => a.startsWith("--span=")) || "").split("=")[1] || 180);
const from = new Date(Date.now() - SPAN * 86400000).toISOString();

async function fetchAll(table, select, extra = "") {
  const out = [];
  for (let off = 0; ; off += 1000) {
    const qs = `${select}&created_at=gte.${from}${extra}&order=created_at.asc&limit=1000&offset=${off}`;
    const r = await fetch(`${URL_}/rest/v1/${table}?${qs}`, {
      headers: { apikey: KEY, Authorization: `Bearer ${KEY}`, Accept: "application/json" },
    });
    if (!r.ok) {
      const t = await r.text();
      if (off === 0 && /does not exist|42P01/.test(t)) return null;
      console.error(`❌ ${table} ${r.status} ${t}`); process.exit(1);
    }
    const page = await r.json();
    out.push(...page);
    if (page.length < 1000) break;
  }
  return out;
}

const events = await fetchAll("events", "select=event,created_at");
if (!events) { console.error("❌ table `events` introuvable."); process.exit(1); }
const deposits = await fetchAll("lost_items", "select=created_at,paid");

const LABEL = {
  visit_organic: "Google et moteurs",
  visit_social: "Réseaux sociaux",
  visit_ai: "Assistants IA",
  visit_referral: "Autres sites",
  visit_direct: "Direct / sans referrer",
};
const FUNNEL = {
  form_view: "формulaire ouvert",
  form_step1_done: "étape 1 terminée",
  form_step2_done: "étape 2 terminée",
  form_contribution_view: "écran des formules vu",
  form_completed_free: "annonce gratuite validée",
};

const months = new Map();
for (const e of events) {
  const m = String(e.created_at).slice(0, 7);
  if (!months.has(m)) months.set(m, {});
  const bucket = months.get(m);
  bucket[e.event] = (bucket[e.event] || 0) + 1;
}
const depByMonth = new Map();
for (const d of deposits || []) {
  const m = String(d.created_at).slice(0, 7);
  depByMonth.set(m, (depByMonth.get(m) || 0) + 1);
}

const keys = Object.keys(LABEL);
console.log("PROVENANCE DES VISITES (une par session)\n");
console.log(
  "mois     " + keys.map((k) => LABEL[k].slice(0, 9).padStart(10)).join("") + "   total   dépôts"
);
console.log("-".repeat(78));
for (const m of [...months.keys()].sort()) {
  const b = months.get(m);
  const tot = keys.reduce((s, k) => s + (b[k] || 0), 0);
  console.log(
    m.padEnd(9) +
      keys.map((k) => String(b[k] || 0).padStart(10)).join("") +
      String(tot).padStart(8) +
      String(depByMonth.get(m) || 0).padStart(9)
  );
}

console.log("\nENTONNOIR DU FORMULAIRE\n");
const fkeys = Object.keys(FUNNEL);
const totals = {};
for (const b of months.values()) for (const k of fkeys) totals[k] = (totals[k] || 0) + (b[k] || 0);
const first = totals[fkeys[0]] || 0;
for (const k of fkeys) {
  const n = totals[k] || 0;
  console.log(`  ${FUNNEL[k].padEnd(28)} ${String(n).padStart(6)}   ${first ? ((n / first) * 100).toFixed(1) + " %" : ""}`);
}
console.log(
  "\n⚠️ Une visite = une session (sessionStorage), et la navigation interne n'est pas comptée.\n" +
  "   Les chiffres sont donc plus bas que ceux d'un outil d'analyse classique, mais\n" +
  "   la RÉPARTITION entre sources, elle, est fiable."
);
