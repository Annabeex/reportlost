// scripts/entonnoir-par-mois.mjs
//
// Le raccourcissement du formulaire et l'affichage des tarifs ont-ils fait
// FUIR des visiteurs, ou seulement filtré ceux qui n'auraient pas payé ?
//
// La question ne se tranche pas sur le nombre de dépôts : annoncer les prix
// partout fait forcément partir plus tôt ceux qui ne voulaient pas payer. Le
// bon indicateur n'est donc pas « combien de dépôts », mais :
//
//   formulaire ouvert → étape 1 → dépôt → paiement
//
// Si la chute se produit À L'OUVERTURE du formulaire (moins de gens l'ouvrent
// alors que le trafic monte), c'est la page ville qui perd des visiteurs.
// Si elle se produit APRÈS l'ouverture, c'est le formulaire.
// Si rien ne chute mais que le taux de paiement monte, le filtre fait son
// travail et il ne faut surtout rien changer.
//
//   node scripts/entonnoir-par-mois.mjs
//   node scripts/entonnoir-par-mois.mjs --span=120
//   node scripts/entonnoir-par-mois.mjs --path=/lost-and-found     (si colonne path remplie)

import fs from "node:fs";

const env = Object.fromEntries(
  fs.readFileSync(fs.existsSync(".env.local") ? ".env.local" : ".env", "utf8")
    .split("\n").filter((l) => l.includes("=") && !l.trim().startsWith("#"))
    .map((l) => { const i = l.indexOf("="); return [l.slice(0, i).trim(), l.slice(i + 1).trim().replace(/^["']|["']$/g, "")]; })
);
const URL_ = env.SUPABASE_URL || env.NEXT_PUBLIC_SUPABASE_URL;
const KEY = env.SUPABASE_SERVICE_ROLE_KEY;
if (!URL_ || !KEY) { console.error("❌ identifiants Supabase introuvables"); process.exit(1); }

const arg = (n, d) => (process.argv.find((a) => a.startsWith(`--${n}=`)) || "").split("=")[1] || d;
const SPAN = Number(arg("span", 120));
const PATH = arg("path", "");
const HEBDO = process.argv.includes("--hebdo");
const from = new Date(Date.now() - SPAN * 86400000).toISOString();

async function tout(table, select) {
  const out = [];
  for (let off = 0; ; off += 1000) {
    const r = await fetch(`${URL_}/rest/v1/${table}?${select}&created_at=gte.${from}&order=created_at.asc&limit=1000&offset=${off}`, {
      headers: { apikey: KEY, Authorization: `Bearer ${KEY}`, Accept: "application/json" },
    });
    if (!r.ok) { console.error(`❌ ${table} ${r.status} ${await r.text()}`); process.exit(1); }
    const p = await r.json(); out.push(...p);
    if (p.length < 1000) break;
  }
  return out;
}

// path n'existe peut-être pas encore : on tente, on retombe sans.
let events;
try {
  events = await tout("events", "select=event,created_at,path");
} catch {
  events = await tout("events", "select=event,created_at");
}
const depots = await tout("lost_items", "select=created_at,paid,contribution");

const jour = (iso) => new Date(iso).toLocaleDateString("fr-CA", { timeZone: "Europe/Paris" });
const mois = (iso) => jour(iso).slice(0, 7);
// Semaine ISO (lundi) : indispensable pour comparer AVANT / APRÈS le filtre
// anti-robots du 20 septembre, qui coupe l'historique mensuel en deux.
const semaine = (iso) => {
  const d = new Date(jour(iso) + "T12:00:00Z");
  d.setUTCDate(d.getUTCDate() - ((d.getUTCDay() + 6) % 7));
  return "sem. " + d.toISOString().slice(5, 10);
};
const periode = HEBDO ? semaine : mois;

const filtres = PATH ? events.filter((e) => String(e.path || "").startsWith(PATH)) : events;
if (PATH && !filtres.length) {
  console.log(`⚠️  Aucun événement avec path commençant par « ${PATH} ».`);
  console.log(`   La colonne path est peut-être vide (ajoutée récemment). On continue sans filtre.\n`);
}
const base = PATH && filtres.length ? filtres : events;

const ETAPES = [
  ["form_view", "formulaire ouvert"],
  ["form_step1_done", "étape 1 terminée"],
  ["form_step2_done", "étape 2 terminée"],
  // Renommé le 02/10 (commit « Clarify neutral search options ») : on accepte les deux,
  // sinon la série se coupe en deux au moment précis qu'on veut mesurer.
  ["form_contribution_view|form_plan_choice_view", "écran formules vu"],
];
const VISITES = ["visit_organic", "visit_social", "visit_ai", "visit_referral", "visit_direct"];

const parMois = new Map();
for (const e of base) {
  const m = periode(e.created_at);
  if (!parMois.has(m)) parMois.set(m, {});
  const b = parMois.get(m);
  b[e.event] = (b[e.event] || 0) + 1;
}
const depMois = new Map();
for (const d of depots) {
  const m = periode(d.created_at);
  if (!depMois.has(m)) depMois.set(m, { dep: 0, pay: 0, ca: 0 });
  const b = depMois.get(m);
  b.dep++;
  if (d.paid) { b.pay++; b.ca += Number(d.contribution || 0); }
}

const moisListe = [...new Set([...parMois.keys(), ...depMois.keys()])].sort();

console.log(`
⚠️  DEUX RUPTURES DE MESURE, à ne jamais oublier en lisant ce tableau :
   • 20/09 — filtre anti-robots posé sur /api/track. Avant cette date,
     « formulaire ouvert » comptait Googlebot, qui exécute le JavaScript.
     Les chiffres d'avant sont GONFLÉS ; ceux d'après sont les vrais.
   • 02/10 — l'écran des formules a changé de nom d'événement. Corrigé ici.
   → Seules les périodes POSTÉRIEURES au 20/09 sont comparables entre elles.
`);
console.log(`\nENTONNOIR MOIS PAR MOIS${PATH ? ` — pages « ${PATH} »` : ""}\n`);
console.log("mois      visites  form.ouv   étape1   étape2  formules   dépôts   payés       ca");
console.log("-".repeat(86));
for (const m of moisListe) {
  const b = parMois.get(m) || {};
  const d = depMois.get(m) || { dep: 0, pay: 0, ca: 0 };
  const vis = VISITES.reduce((s, k) => s + (b[k] || 0), 0);
  const somme = (cle) => cle.split("|").reduce((s2, k) => s2 + (b[k] || 0), 0);
  const l = [vis, b.form_view || 0, b.form_step1_done || 0, b.form_step2_done || 0, somme("form_contribution_view|form_plan_choice_view"), d.dep, d.pay];
  console.log(m.padEnd(9) + l.map((v) => String(v).padStart(8)).join("") + `${d.ca.toFixed(0).padStart(9)}$`);
}

console.log(`\nLES TROIS RATIOS QUI RÉPONDENT À LA QUESTION\n`);
console.log("mois      form.ouv/visite   étape1/form.ouv   dépôt/form.ouv   payé/dépôt");
console.log("-".repeat(76));
for (const m of moisListe) {
  const b = parMois.get(m) || {};
  const d = depMois.get(m) || { dep: 0, pay: 0 };
  const vis = VISITES.reduce((s, k) => s + (b[k] || 0), 0);
  const fv = b.form_view || 0;
  const pc = (a, t) => (t ? `${((100 * a) / t).toFixed(1)} %` : "—");
  console.log(
    m.padEnd(9) +
      pc(fv, vis).padStart(16) +
      pc(b.form_step1_done || 0, fv).padStart(18) +
      pc(d.dep, fv).padStart(17) +
      pc(d.pay, d.dep).padStart(13)
  );
}

console.log(`
COMMENT LIRE
  • « form.ouv/visite » baisse   → la page ville perd des gens AVANT le formulaire
  • « étape1/form.ouv » baisse   → c'est le formulaire lui-même qui perd
  • les deux tiennent, « payé/dépôt » monte → le filtre tarifaire fait son travail,
    tu gagnes en qualité ce que tu perds en volume, et il ne faut rien changer.
`);
