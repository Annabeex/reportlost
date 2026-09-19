// scripts/montants-payes.mjs
//
// Les montants réellement encaissés, un par un.
//
// La jauge cœur (janvier → 11 juillet) ajoutait un pourboire libre au prix de
// la formule : un paiement pouvait valoir 25, mais aussi 31, ou 1 sur une
// annonce gratuite. Regrouper en « ≥25 / <25 » masquait complètement ça.
// Ici, aucun regroupement : la valeur exacte, et ce qu'elle implique.
//
//   node scripts/montants-payes.mjs --span=260
import fs from "node:fs";

const env = Object.fromEntries(
  fs.readFileSync(fs.existsSync(".env.local") ? ".env.local" : ".env", "utf8")
    .split("\n").filter((l) => l.includes("=") && !l.trim().startsWith("#"))
    .map((l) => { const i = l.indexOf("="); return [l.slice(0, i).trim(), l.slice(i + 1).trim().replace(/^["']|["']$/g, "")]; })
);
const URL_ = env.SUPABASE_URL || env.NEXT_PUBLIC_SUPABASE_URL;
const KEY = env.SUPABASE_SERVICE_ROLE_KEY;
if (!URL_ || !KEY) { console.error("❌ identifiants Supabase introuvables"); process.exit(1); }

const SPAN = Number((process.argv.find((a) => a.startsWith("--span=")) || "").split("=")[1] || 260);
const from = new Date(Date.now() - SPAN * 86400000).toISOString();
// La jauge disparaît avec le commit du 11 juillet 2026.
const GAUGE_END = new Date("2026-07-11T00:00:00Z").getTime();

const rows = [];
for (let off = 0; ; off += 1000) {
  const qs = new URLSearchParams({
    select: "public_id,created_at,paid,contribution",
    created_at: `gte.${from}`, paid: "eq.true",
    order: "created_at.asc", limit: "1000", offset: String(off),
  });
  const r = await fetch(`${URL_}/rest/v1/lost_items?${qs}`, {
    headers: { apikey: KEY, Authorization: `Bearer ${KEY}`, Accept: "application/json" },
  });
  if (!r.ok) { console.error(`❌ ${r.status} ${await r.text()}`); process.exit(1); }
  const page = await r.json();
  rows.push(...page);
  if (page.length < 1000) break;
}

const PLANS = [0, 12, 25];
const fmt = (n) => `$${Number(n).toFixed(2).replace(/\.00$/, "")}`;

console.log(`${rows.length} paiement(s) sur ${SPAN} jours\n`);
console.log(`dossier   date         montant    lecture`);
console.log("-".repeat(68));

let tipTotal = 0, tipCount = 0, before = 0, after = 0;
for (const r of rows) {
  const a = Number(r.contribution || 0);
  const t = new Date(r.created_at).getTime();
  const era = t < GAUGE_END ? "jauge" : "sans";
  if (t < GAUGE_END) before += a; else after += a;

  // Un montant qui n'est aucun prix de formule ne peut venir que d'un
  // pourboire ajouté au prix, ou d'un prix qui n'existe plus.
  const base = PLANS.filter((p) => p <= a).pop() ?? 0;
  const extra = a - base;
  let read = `formule ${fmt(base)}`;
  if (extra > 0) { read += ` + pourboire ${fmt(extra)}`; tipTotal += extra; tipCount++; }
  if (!PLANS.includes(a) && extra === 0) read = "montant hors grille";

  console.log(
    `#${String(r.public_id || "").padEnd(7)} ${String(r.created_at).slice(0, 10)}   ${fmt(a).padStart(7)}    ${read}  (${era})`
  );
}

console.log("-".repeat(68));
console.log(`Recette du 19/01 au 11/07 (jauge en ligne) : ${fmt(before)}`);
console.log(`Recette depuis le 11/07 (sans jauge)       : ${fmt(after)}`);
console.log(`\nPourboires identifiés : ${tipCount} paiement(s), ${fmt(tipTotal)} au total.`);
if (tipCount) {
  console.log(`Soit ${((tipTotal / (before + after)) * 100).toFixed(1)} % de la recette totale de la période.`);
} else {
  console.log(`Aucun pourboire : la centaine de dollars manquante vient d'ailleurs,`);
  console.log(`et mon hypothèse sur la jauge est fausse. À creuser avant de la remettre.`);
}
