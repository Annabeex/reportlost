// scripts/depots-avant-apres.mjs
// Lecture seule. Compare les dépôts d'une période à celle, de même durée, qui
// la précède immédiatement. Sert à mesurer l'effet d'un changement mis en ligne
// à une date donnée, sans se faire piéger par des fenêtres de longueurs
// différentes (comparer 3 jours à 7 jours n'a aucun sens).
//
//   node scripts/depots-avant-apres.mjs
//   node scripts/depots-avant-apres.mjs --depuis=2026-09-20 --tests=4
//   node scripts/depots-avant-apres.mjs --depuis=2026-09-20 --liste
//
// --tests=N  retire N dépôts de la période courante (tes propres essais).
// --liste    affiche le détail de la période courante, pour repérer les tests.

import fs from "fs";
import { createClient } from "@supabase/supabase-js";

const args = process.argv.slice(2);
const opt = (n, d) => (args.find((a) => a.startsWith(`--${n}=`)) || `--${n}=${d}`).split("=")[1];
const DEPUIS = opt("depuis", "2026-09-20");
const TESTS = Math.max(0, Number(opt("tests", 0)));
const LISTE = args.includes("--liste");

const env =
  (fs.existsSync(".env.local") ? fs.readFileSync(".env.local", "utf8") : "") + "\n" +
  (fs.existsSync(".env") ? fs.readFileSync(".env", "utf8") : "");
const url =
  env.match(/^SUPABASE_URL=([^\s]+)/m)?.[1] ||
  env.match(/^NEXT_PUBLIC_SUPABASE_URL=([^\s]+)/m)?.[1];
const key = env.match(/^SUPABASE_SERVICE_ROLE_KEY=([^\s]+)/m)?.[1];
if (!url || !key) { console.error("Clés Supabase introuvables dans .env.local"); process.exit(1); }
const sb = createClient(url, key, { auth: { persistSession: false } });

const debut = new Date(`${DEPUIS}T00:00:00Z`);
const fin = new Date();
const duree = fin - debut;                       // ms
const debutAvant = new Date(debut - duree);
const jours = duree / 86400000;

async function lire(a, b) {
  const out = [];
  for (let from = 0; ; from += 1000) {
    const { data, error } = await sb
      .from("lost_items")
      .select("public_id, created_at, email, first_name, contribution, city")
      .gte("created_at", a.toISOString())
      .lt("created_at", b.toISOString())
      .order("created_at", { ascending: true })
      .range(from, from + 999);
    if (error) { console.error(error.message); process.exit(1); }
    if (!data?.length) break;
    out.push(...data);
    if (data.length < 1000) break;
  }
  return out;
}

const [apres, avant] = await Promise.all([lire(debut, fin), lire(debutAvant, debut)]);

const paye = (r) => Number(r.contribution || 0) > 0;
const ca = (rs) => rs.reduce((s, r) => s + Number(r.contribution || 0), 0);

const nApres = apres.length - TESTS;
const nAvant = avant.length;
const pApres = apres.filter(paye).length;
const pAvant = avant.filter(paye).length;

const fmtJ = (n) => (n / jours).toFixed(1);
const ecart = (a, b) => (b === 0 ? (a === 0 ? "—" : "+∞") : `${a >= b ? "+" : ""}${(100 * (a - b) / b).toFixed(0)} %`);
const d = (x) => x.toISOString().slice(0, 16).replace("T", " ");

console.log(`\n  Fenêtre courante   : ${d(debut)} → ${d(fin)}  (${jours.toFixed(2)} j, UTC)`);
console.log(`  Fenêtre précédente : ${d(debutAvant)} → ${d(debut)}  (même durée)`);
if (TESTS) console.log(`  ${TESTS} test(s) retiré(s) de la fenêtre courante.`);

console.log(`\n                        avant      après     écart`);
console.log(`  ${"─".repeat(48)}`);
console.log(`  dépôts             ${String(nAvant).padStart(8)}   ${String(nApres).padStart(8)}   ${ecart(nApres, nAvant).padStart(7)}`);
console.log(`  dépôts / jour      ${fmtJ(nAvant).padStart(8)}   ${fmtJ(nApres).padStart(8)}`);
console.log(`  payants            ${String(pAvant).padStart(8)}   ${String(pApres).padStart(8)}   ${ecart(pApres, pAvant).padStart(7)}`);
console.log(`  taux de paiement   ${(nAvant ? (100 * pAvant / nAvant).toFixed(1) : "0").padStart(7)}%   ${(nApres > 0 ? (100 * pApres / nApres).toFixed(1) : "0").padStart(7)}%`);
console.log(`  encaissé ($)       ${String(ca(avant)).padStart(8)}   ${String(ca(apres)).padStart(8)}`);

// Par jour, pour voir si la bascule est nette ou diffuse.
const parJour = (rs) => {
  const m = new Map();
  for (const r of rs) {
    const k = r.created_at.slice(0, 10);
    if (!m.has(k)) m.set(k, { n: 0, p: 0 });
    const s = m.get(k); s.n++; if (paye(r)) s.p++;
  }
  return m;
};
console.log(`\n  jour          dépôts  payants`);
console.log(`  ${"─".repeat(32)}`);
for (const [k, s] of [...parJour([...avant, ...apres]).entries()].sort()) {
  const marque = k >= DEPUIS ? " ←" : "";
  console.log(`  ${k}   ${String(s.n).padStart(6)}  ${String(s.p).padStart(7)}${marque}`);
}

if (LISTE) {
  console.log(`\n  Détail de la fenêtre courante (pour repérer tes tests) :`);
  console.log(`  ${"─".repeat(72)}`);
  for (const r of apres) {
    console.log(`  ${r.created_at.slice(0, 16).replace("T", " ")}  ${String(r.public_id || "").padEnd(8)}` +
      ` ${String(r.contribution || 0).padStart(3)}$  ${String(r.city || "").slice(0, 18).padEnd(18)} ${String(r.email || "").slice(0, 32)}`);
  }
}
console.log("");
