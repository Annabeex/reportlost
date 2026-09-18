// scripts/paiements-par-semaine.mjs
//
// Volume de paiements et répartition des montants, semaine par semaine.
//
// Tous les paiements tombent dans la session du dépôt (cf. probe-paiements),
// donc on regroupe sur created_at : c'est la même semaine, et ça permet de
// rapporter les paiements aux dépôts de la même cohorte.
//
// Le décalage de 2 h entre created_at et paid_at n'a aucun effet ici : on ne
// calcule aucune durée, seulement des comptages par semaine.
//
//   node scripts/paiements-par-semaine.mjs
//   node scripts/paiements-par-semaine.mjs --span=240 --mois
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
const BY_MONTH = process.argv.includes("--mois");
const from = new Date(Date.now() - SPAN * 86400000).toISOString();

const rows = [];
for (let off = 0; ; off += 1000) {
  const qs = new URLSearchParams({
    select: "created_at,paid,contribution",
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

// Lundi de la semaine, en UTC : un regroupement stable d'une exécution à l'autre.
function weekKey(iso) {
  const d = new Date(String(iso).slice(0, 10) + "T00:00:00Z");
  const dow = (d.getUTCDay() + 6) % 7;
  d.setUTCDate(d.getUTCDate() - dow);
  return d.toISOString().slice(0, 10);
}
const key = (iso) => (BY_MONTH ? String(iso).slice(0, 7) : weekKey(iso));

const buckets = new Map();
for (const r of rows) {
  const k = key(r.created_at);
  if (!buckets.has(k)) buckets.set(k, { n: 0, paid: 0, p25: 0, p12: 0, other: 0, revenue: 0 });
  const b = buckets.get(k);
  b.n++;
  if (!r.paid) continue;
  const amount = Number(r.contribution || 0);
  b.paid++;
  b.revenue += amount;
  if (amount >= 25) b.p25++;
  else if (amount > 0) b.p12++;
  else b.other++;
}

console.log(`${BY_MONTH ? "Mois" : "Semaine"}      dépôts   payés   taux     ≥25$   <25$   recette`);
console.log("-".repeat(64));
let tn = 0, tp = 0, t25 = 0, t12 = 0, trev = 0;
for (const k of [...buckets.keys()].sort()) {
  const b = buckets.get(k);
  tn += b.n; tp += b.paid; t25 += b.p25; t12 += b.p12; trev += b.revenue;
  const rate = b.n ? `${((b.paid / b.n) * 100).toFixed(1)}%` : "—";
  console.log(
    `${k.padEnd(12)} ${String(b.n).padStart(5)}   ${String(b.paid).padStart(5)}   ${rate.padStart(6)}` +
    `   ${String(b.p25).padStart(4)}   ${String(b.p12).padStart(4)}   ${`$${b.revenue}`.padStart(7)}` +
    `   ${"▉".repeat(b.p25)}${"▁".repeat(b.p12)}`
  );
}
console.log("-".repeat(64));
console.log(
  `${"TOTAL".padEnd(12)} ${String(tn).padStart(5)}   ${String(tp).padStart(5)}   ` +
  `${(tn ? ((tp / tn) * 100).toFixed(1) + "%" : "—").padStart(6)}   ${String(t25).padStart(4)}   ${String(t12).padStart(4)}   ${`$${trev}`.padStart(7)}`
);
console.log(`\n▉ = un paiement à 25 $ ou plus   ▁ = un paiement en dessous`);
console.log(`La première semaine où des ▁ apparaissent date l'arrivée de la formule à 12 $.`);
