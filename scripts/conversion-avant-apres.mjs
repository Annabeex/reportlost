// scripts/conversion-avant-apres.mjs
//
// Le changement de mail a-t-il fait chuter la conversion, ou est-ce le bruit
// de trois jours de volume ?
//
// Deux conversions très différentes vivent dans la même colonne `paid` :
//   — l'achat DIRECT, dans la foulée du formulaire : la personne n'a jamais vu
//     le mail, il ne dit rien de lui ;
//   — l'achat DIFFÉRÉ, plus tard : celui-là, et lui seul, mesure le mail.
// Les confondre, c'est diluer le signal dans du bruit qui ne bouge pas.
//
// Ne sont comptés que les dossiers qui ont eu la FENÊTRE ENTIÈRE pour
// convertir : sinon les plus récents comptent comme des échecs et la période
// d'après paraît mauvaise par construction.
//
//   node scripts/conversion-avant-apres.mjs
//   node scripts/conversion-avant-apres.mjs --cutover=2026-09-15 --window=3 --span=21

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
const CUTOVER = arg("cutover", "2026-09-15");
const WINDOW_DAYS = Number(arg("window", 3));
const SPAN_DAYS = Number(arg("span", 21));
const DIRECT_MIN = 30; // minutes : en deçà, l'achat suit le formulaire

const DAY = 86400000;
const cut = new Date(`${CUTOVER}T00:00:00Z`).getTime();
const from = new Date(cut - SPAN_DAYS * DAY).toISOString();
// Dernière date de dépôt ayant eu toute la fenêtre pour convertir.
const maturity = Date.now() - WINDOW_DAYS * DAY;

const rows = [];
for (let off = 0; ; off += 1000) {
  const qs = new URLSearchParams({
    select: "id,public_id,created_at,paid,paid_at,contribution",
    created_at: `gte.${from}`,
    order: "created_at.asc",
    limit: "1000",
    offset: String(off),
  });
  const r = await fetch(`${URL_}/rest/v1/lost_items?${qs}`, {
    headers: { apikey: KEY, Authorization: `Bearer ${KEY}`, Accept: "application/json" },
  });
  if (!r.ok) { console.error(`❌ ${r.status} ${await r.text()}`); process.exit(1); }
  const page = await r.json();
  rows.push(...page);
  if (page.length < 1000) break;
}

const mature = rows.filter((r) => new Date(r.created_at).getTime() <= maturity);

function bucket(list) {
  let direct = 0, deferred = 0;
  const delays = [];
  for (const r of list) {
    if (!r.paid || !r.paid_at) continue;
    const mins = (new Date(r.paid_at).getTime() - new Date(r.created_at).getTime()) / 60000;
    if (mins < 0) continue;
    if (mins > WINDOW_DAYS * 24 * 60) continue; // hors fenêtre : ni l'un ni l'autre
    if (mins < DIRECT_MIN) direct++;
    else { deferred++; delays.push(mins); }
  }
  delays.sort((a, b) => a - b);
  const median = delays.length ? delays[Math.floor(delays.length / 2)] : null;
  return { n: list.length, direct, deferred, median };
}

const before = mature.filter((r) => new Date(r.created_at).getTime() < cut);
const after = mature.filter((r) => new Date(r.created_at).getTime() >= cut);

const pct = (a, b) => (b ? `${((a / b) * 100).toFixed(1)}%` : "—");
const dur = (m) => (m === null ? "—" : m < 120 ? `${Math.round(m)} min` : `${(m / 60).toFixed(1)} h`);

function show(title, b) {
  console.log(`\n${title}`);
  console.log(`  dépôts arrivés à maturité : ${b.n}`);
  console.log(`  achat direct (< ${DIRECT_MIN} min)  : ${b.direct}  ${pct(b.direct, b.n)}`);
  console.log(`  achat différé (le mail)      : ${b.deferred}  ${pct(b.deferred, b.n)}   délai médian ${dur(b.median)}`);
}

const B = bucket(before);
const A = bucket(after);

console.log(`Bascule du mail : ${CUTOVER}`);
console.log(`Fenêtre de conversion retenue : ${WINDOW_DAYS} jours · période observée : ${SPAN_DAYS} jours avant`);
console.log(`Dossiers postérieurs au ${new Date(maturity).toISOString().slice(0, 10)} exclus : ils n'ont pas eu leur fenêtre entière.`);
show(`AVANT (« One last step to activate your search »)`, B);
show(`APRÈS (bandeau ambre)`, A);

const rb = B.n ? B.deferred / B.n : 0;
const ra = A.n ? A.deferred / A.n : 0;
console.log(`\nÉcart sur l'achat différé : ${rb ? `${(((ra - rb) / rb) * 100).toFixed(0)} %` : "—"}`);

if (A.n < 30 || B.n < 30) {
  console.log(
    `\n⚠️  Un des deux groupes compte moins de 30 dépôts (${B.n} / ${A.n}).\n` +
    `    À ce volume, deux achats de plus ou de moins déplacent le taux de plusieurs points :\n` +
    `    l'écart ci-dessus n'est pas encore une preuve. Relancer dans quelques jours.`
  );
}

// Jour par jour : une chute franche se voit, une dérive lente aussi.
console.log(`\nJour par jour (dépôts · achat différé)`);
const byDay = new Map();
for (const r of mature) {
  const d = String(r.created_at).slice(0, 10);
  if (!byDay.has(d)) byDay.set(d, []);
  byDay.get(d).push(r);
}
for (const d of [...byDay.keys()].sort()) {
  const b = bucket(byDay.get(d));
  const bar = "█".repeat(b.deferred);
  console.log(`  ${d}${d === CUTOVER ? " ←" : "  "}  ${String(b.n).padStart(3)} dépôts   ${String(b.deferred).padStart(2)} ${bar}`);
}
