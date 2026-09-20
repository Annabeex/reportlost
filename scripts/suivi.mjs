// scripts/suivi.mjs
//
// Tableau de bord hebdomadaire : est-ce que ça grandit, et est-ce que ça paie ?
//
//   node scripts/suivi.mjs
//   node scripts/suivi.mjs --gsc=~/Downloads/export-gsc/Pages.csv
//
// Les deux indicateurs qui comptent (voir le bas du rapport) :
//   1. pages villes avec impressions  -> visibilité structurelle, insensible à
//      la saison et aux modifications du site. Le juge de "est-ce que ça grandit".
//   2. paiements par mois             -> le juge de "est-ce que ça paie".
// Les dépôts au milieu sont pollués depuis l'ajout des formulaires sur les
// pages objets (16/09/2026) : ils montent sans que le trafic monte.
import fs from "node:fs";
import os from "node:os";

const env = Object.fromEntries(
  fs.readFileSync(fs.existsSync(".env.local") ? ".env.local" : ".env", "utf8")
    .split("\n").filter((l) => l.includes("=") && !l.trim().startsWith("#"))
    .map((l) => { const i = l.indexOf("="); return [l.slice(0, i).trim(), l.slice(i + 1).trim().replace(/^["']|["']$/g, "")]; })
);
const URL_ = env.SUPABASE_URL || env.NEXT_PUBLIC_SUPABASE_URL;
const KEY = env.SUPABASE_SERVICE_ROLE_KEY;
if (!URL_ || !KEY) { console.error("❌ identifiants Supabase introuvables"); process.exit(1); }
const H = { apikey: KEY, Authorization: `Bearer ${KEY}`, Accept: "application/json" };

const GSC = (process.argv.find((a) => a.startsWith("--gsc=")) || "").split("=")[1];
const FORMULAIRE_PAGES_OBJETS = "2026-09-16"; // date d'ajout du formulaire sur /lost/*

// ---------------------------------------------------------------- utilitaires
async function toutes(table, select, extra = "") {
  const out = [];
  for (let off = 0; ; off += 1000) {
    const r = await fetch(`${URL_}/rest/v1/${table}?select=${select}${extra}&order=created_at.asc&limit=1000&offset=${off}`, { headers: H });
    if (!r.ok) { console.error(`❌ ${table} ${r.status} ${(await r.text()).slice(0, 200)}`); process.exit(1); }
    const page = await r.json();
    out.push(...page);
    if (page.length < 1000) break;
  }
  return out;
}
const mois = (iso) => String(iso || "").slice(0, 7);
const jour = (iso) => String(iso || "").slice(0, 10);
function semaineDe(iso) {              // lundi de la semaine, format AAAA-MM-JJ
  const d = new Date(iso);
  const j = (d.getUTCDay() + 6) % 7;   // lundi = 0
  d.setUTCDate(d.getUTCDate() - j);
  return d.toISOString().slice(0, 10);
}
const pct = (a, b) => (b ? (100 * a / b).toFixed(1) + " %" : "—");
const pad = (s, n) => String(s).padEnd(n);
const num = (s, n) => String(s).padStart(n);
const titre = (t) => console.log("\n" + t + "\n" + "─".repeat(t.length));

// ------------------------------------------------------------------- données
const lost = await toutes("lost_items", "id,created_at,paid,contribution,city,state_id");
const depuis90 = new Date(Date.now() - 95 * 86400000).toISOString();
const events = await toutes("events", "event,created_at", `&created_at=gte.${depuis90}&event=like.visit_*`);

const estPaye = (it) => it.paid === true || Number(it.contribution || 0) > 0;
const montant = (it) => Number(it.contribution || 0);

console.log(`\n═══ SUIVI reportlost.org — ${new Date().toISOString().slice(0, 10)} ═══`);
console.log(`${lost.length} dépôts en base, ${lost.filter(estPaye).length} payés, ` +
            `${lost.reduce((s, it) => s + montant(it), 0).toFixed(0)} $ encaissés au total`);

// --------------------------------------------------------------- 1. par mois
titre("1. PAR MOIS — dépôts, paiements, recette");
const parMois = {};
for (const it of lost) {
  const m = mois(it.created_at); if (!m) continue;
  parMois[m] ||= { dep: 0, pay: 0, ca: 0 };
  parMois[m].dep++;
  if (estPaye(it)) { parMois[m].pay++; parMois[m].ca += montant(it); }
}
const moisTries = Object.keys(parMois).sort().slice(-14);
console.log(`${pad("mois", 9)}${num("dépôts", 7)}${num("payés", 7)}${num("taux", 8)}${num("recette", 10)}${num("$/dépôt", 9)}`);
for (const m of moisTries) {
  const v = parMois[m];
  console.log(`${pad(m, 9)}${num(v.dep, 7)}${num(v.pay, 7)}${num(pct(v.pay, v.dep), 8)}${num(v.ca.toFixed(0) + " $", 10)}${num((v.ca / v.dep).toFixed(2), 9)}`);
}

// ----------------------------------------------------- 2. octobre vs octobre
titre("2. LE JUGE DE PAIX — octobre 2026 contre octobre 2025");
const oct25 = parMois["2025-10"]?.dep || 0;
const oct26 = parMois["2026-10"]?.dep || null;
const pay26 = parMois["2026-10"]?.pay || 0;
console.log(`octobre 2025 : ${oct25} dépôts   (seule comparaison qui neutralise la saison)`);
if (oct26 === null) {
  const enCours = parMois[mois(new Date().toISOString())];
  if (enCours) {
    const j = Number(jour(new Date().toISOString()).slice(8));
    console.log(`mois en cours : ${enCours.dep} dépôts en ${j} jours → projection ${Math.round(enCours.dep / j * 30)}`);
  }
  console.log("octobre 2026 : pas encore de données.");
} else {
  const ratio = oct25 ? oct26 / oct25 : 0;
  let verdict;
  if (oct26 < 90)       verdict = "❌ l'été était saisonnier — retour à la base (proj. 400–600 $/mois)";
  else if (oct26 < 150) verdict = "🟠 croissance réelle mais lente (proj. 600–1 000 $/mois)";
  else if (oct26 < 220) verdict = "🟢 croissance structurelle solide (proj. 1 000–1 800 $/mois)";
  else                  verdict = "🚀 la trajectoire tient malgré la saison (proj. 1 800–3 500 $/mois)";
  console.log(`octobre 2026 : ${oct26} dépôts  (×${ratio.toFixed(1)})`);
  console.log(verdict);
  console.log(pay26 >= 14
    ? `paiements : ${pay26} ✅ (seuil 14 — la conversion suit)`
    : `paiements : ${pay26} ⚠️  (seuil 14 — le volume monte mais ne se transforme pas)`);
  console.log("⚠️  rappel : les dépôts d'octobre sont gonflés par les formulaires ajoutés");
  console.log("   sur les pages objets le 16/09. Fier-toi surtout au bloc 5 (pages indexées).");
}

// ------------------------------------------------- 3. semaines + provenance
titre("3. LES 8 DERNIÈRES SEMAINES");
const parSem = {};
for (const it of lost) {
  const s = semaineDe(it.created_at);
  parSem[s] ||= { dep: 0, pay: 0, ca: 0, org: 0, soc: 0, aut: 0 };
  parSem[s].dep++;
  if (estPaye(it)) { parSem[s].pay++; parSem[s].ca += montant(it); }
}
for (const e of events) {
  const s = semaineDe(e.created_at);
  parSem[s] ||= { dep: 0, pay: 0, ca: 0, org: 0, soc: 0, aut: 0 };
  if (e.event === "visit_organic") parSem[s].org++;
  else if (e.event === "visit_social") parSem[s].soc++;
  else parSem[s].aut++;
}
const sem = Object.keys(parSem).sort().slice(-8);
console.log(`${pad("semaine du", 12)}${num("dépôts", 7)}${num("payés", 7)}${num("recette", 10)}${num("v.Google", 10)}${num("v.social", 9)}${num("v.autres", 9)}${num("dép/visite", 11)}`);
for (const s of sem) {
  const v = parSem[s];
  const visites = v.org + v.soc + v.aut;
  console.log(`${pad(s, 12)}${num(v.dep, 7)}${num(v.pay, 7)}${num(v.ca.toFixed(0) + " $", 10)}${num(v.org, 10)}${num(v.soc, 9)}${num(v.aut, 9)}${num(pct(v.dep, visites), 11)}`);
}

// ---------------------------------------- 4. effet des formulaires ajoutés
titre("4. EFFET DES FORMULAIRES SUR LES PAGES OBJETS (16/09)");
{
  const coupe = FORMULAIRE_PAGES_OBJETS;
  const fen = 30 * 86400000;
  const t0 = new Date(coupe).getTime();
  const avant = { dep: 0, vis: 0 }, apres = { dep: 0, vis: 0 };
  for (const it of lost) {
    const t = new Date(it.created_at).getTime();
    if (t >= t0 - fen && t < t0) avant.dep++;
    else if (t >= t0) apres.dep++;
  }
  for (const e of events) {
    const t = new Date(e.created_at).getTime();
    if (t >= t0 - fen && t < t0) avant.vis++;
    else if (t >= t0) apres.vis++;
  }
  const jours = Math.max(1, Math.round((Date.now() - t0) / 86400000));
  console.log(`30 jours AVANT : ${avant.dep} dépôts / ${avant.vis} visites → ${pct(avant.dep, avant.vis)}`);
  console.log(`${jours} jours APRÈS  : ${apres.dep} dépôts / ${apres.vis} visites → ${pct(apres.dep, apres.vis)}`);
  console.log("Si le taux monte sans que les visites montent, ce sont tes formulaires qui travaillent,");
  console.log("pas ton référencement — et les dépôts ne mesurent plus la croissance.");
}

// ------------------------------------------------ 5. villes et pages GSC
titre("5. VISIBILITÉ STRUCTURELLE — l'indicateur qui ne ment pas");
const slug = (it) => `${String(it.state_id || "").toLowerCase()}/${String(it.city || "").toLowerCase()
  .replace(/\s+[a-z]{2}$/i, "").trim().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "")}`;
const premiere = {};
for (const it of lost) {
  const k = slug(it); if (!k || k === "/") continue;
  const m = mois(it.created_at);
  if (!premiere[k] || m < premiere[k]) premiere[k] = m;
}
const nouvellesParMois = {};
for (const m of Object.values(premiere)) nouvellesParMois[m] = (nouvellesParMois[m] || 0) + 1;
console.log(`villes touchées au total : ${Object.keys(premiere).length}`);
console.log("nouvelles villes par mois (chacune est une page qui peut entrer dans l'index) :");
for (const m of Object.keys(nouvellesParMois).sort().slice(-8)) {
  const n = nouvellesParMois[m];
  console.log(`  ${m}  ${num(n, 4)}  ${"▇".repeat(Math.min(40, n))}`);
}

if (GSC) {
  const chemin = GSC.replace(/^~/, os.homedir());
  if (!fs.existsSync(chemin)) {
    console.log(`\n⚠️  export GSC introuvable : ${chemin}`);
  } else {
    const lignes = fs.readFileSync(chemin, "utf8").split("\n").slice(1).filter(Boolean);
    let villes = 0, objets = 0, clics = 0, impr = 0;
    for (const l of lignes) {
      const c = l.split(",");
      const u = c[0] || "";
      const cl = Number(c[1] || 0), im = Number(c[2] || 0);
      clics += cl; impr += im;
      if (/\/lost-and-found\/[a-z]{2}\/[^/]+$/.test(u)) villes++;
      else if (/\/lost\//.test(u)) objets++;
    }
    console.log(`\nExport Search Console (${chemin.split("/").pop()}) :`);
    console.log(`  pages VILLES avec impressions  : ${villes}   ← LE chiffre à suivre`);
    console.log(`  pages objets avec impressions  : ${objets}`);
    console.log(`  clics ${clics} · impressions ${impr} · CTR ${pct(clics, impr)}`);
    console.log("\n  Référence du 26/08/2026 : 592 pages villes.");
    const delta = villes - 592;
    console.log(delta >= 80 ? `  ${delta >= 0 ? "+" : ""}${delta} depuis → 🚀 la mécanique s'emballe`
      : delta >= 30 ? `  +${delta} depuis → 🟢 la mécanique s'enclenche (objectif +50 à +80/mois)`
      : `  ${delta >= 0 ? "+" : ""}${delta} depuis → ⚠️  sous +30/mois, ça ne décolle pas`);
  }
} else {
  console.log("\n(pas d'export Search Console fourni)");
  console.log("Pour l'ajouter : Search Console → Performances → Exporter → CSV, puis");
  console.log("  node scripts/suivi.mjs --gsc=~/Downloads/<dossier>/Pages.csv");
  console.log("Référence du 26/08/2026 : 592 pages villes avec impressions.");
}

titre("EN UNE LIGNE");
{
  const m = moisTries[moisTries.length - 1];
  const v = parMois[m];
  console.log(`${m} : ${v.dep} dépôts, ${v.pay} payés (${pct(v.pay, v.dep)}), ${v.ca.toFixed(0)} $.`);
  console.log(`Objectif 1 500 $/mois → il faut ~75 paiements/mois. Il en manque ${Math.max(0, 75 - v.pay)}.`);
}
console.log("");
