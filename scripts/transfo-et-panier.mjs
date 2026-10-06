// scripts/transfo-et-panier.mjs
//
// Taux de transformation, panier moyen et chiffre d'affaires :
//   - sur une période précise (par défaut depuis le 2 octobre 2026)
//   - jour par jour, pour juger si la période est représentative
//   - mois par mois depuis le début, car c'est la série mensuelle — et elle
//     seule — qui autorise une projection. Quatre jours ne projettent rien.
//
//   node scripts/transfo-et-panier.mjs
//   node scripts/transfo-et-panier.mjs --depuis=2026-10-02
//   node scripts/transfo-et-panier.mjs --depuis=2026-09-20 --exclure=11093,51717
//
// --exclure : des public_id à retirer (dossiers de test).

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
const DEPUIS = arg("depuis", "2026-10-02");
const EXCLUS = new Set(String(arg("exclure", "")).split(",").map((s) => s.trim()).filter(Boolean));

// Tout l'historique : les agrégats mensuels en ont besoin.
const rows = [];
for (let off = 0; ; off += 1000) {
  const qs = new URLSearchParams({
    select: "public_id,created_at,paid,contribution",
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

const lignes = rows.filter((r) => r.created_at && !EXCLUS.has(String(r.public_id)));
const jour = (iso) => new Date(iso).toLocaleDateString("fr-CA", { timeZone: "Europe/Paris" });
const mois = (iso) => jour(iso).slice(0, 7);
const paye = (r) => r.paid === true;
const eur = (n) => `$${Number(n || 0).toFixed(2)}`;

function bilan(list) {
  const depots = list.length;
  const payes = list.filter(paye);
  const ca = payes.reduce((s, r) => s + Number(r.contribution || 0), 0);
  return {
    depots,
    payes: payes.length,
    taux: depots ? (100 * payes.length) / depots : 0,
    panier: payes.length ? ca / payes.length : 0,
    ca,
  };
}

const periode = lignes.filter((r) => jour(r.created_at) >= DEPUIS);
const b = bilan(periode);

console.log(`\n═══ Depuis le ${DEPUIS} ═══`);
console.log(`Dépôts          ${b.depots}`);
console.log(`Payés           ${b.payes}`);
console.log(`Taux de transfo ${b.taux.toFixed(1)} %`);
console.log(`Panier moyen    ${eur(b.panier)}`);
console.log(`Chiffre         ${eur(b.ca)}`);

const jours = [...new Set(periode.map((r) => jour(r.created_at)))].sort();
if (jours.length) {
  const parJour = jours.map((j) => bilan(periode.filter((r) => jour(r.created_at) === j)));
  const moyDepots = b.depots / jours.length;
  const moyCa = b.ca / jours.length;
  console.log(`\nSur ${jours.length} jour(s) : ${moyDepots.toFixed(1)} dépôts/jour, ${eur(moyCa)}/jour`);
  console.log(`Extrapolation brute sur 30 jours : ${Math.round(moyDepots * 30)} dépôts, ${eur(moyCa * 30)}`);
  const mini = Math.min(...parJour.map((x) => x.ca));
  const maxi = Math.max(...parJour.map((x) => x.ca));
  console.log(`⚠️  Le chiffre journalier va de ${eur(mini)} à ${eur(maxi)} sur la période :`);
  console.log(`    une extrapolation à partir de ${jours.length} jour(s) n'est pas une prévision.`);

  console.log(`\n── jour par jour ──`);
  console.log("jour         dépôts  payés   taux   panier      ca");
  jours.forEach((j, i) => {
    const x = parJour[i];
    console.log(
      `${j}   ${String(x.depots).padStart(4)}  ${String(x.payes).padStart(5)}  ${x.taux.toFixed(0).padStart(4)}%  ${eur(x.panier).padStart(8)}  ${eur(x.ca).padStart(8)}`
    );
  });
}

console.log(`\n── mois par mois (c'est cette série qui porte la prévision) ──`);
console.log("mois      dépôts  payés   taux   panier      ca");
const moisListe = [...new Set(lignes.map((r) => mois(r.created_at)))].sort();
for (const m of moisListe) {
  const x = bilan(lignes.filter((r) => mois(r.created_at) === m));
  console.log(
    `${m}   ${String(x.depots).padStart(5)}  ${String(x.payes).padStart(5)}  ${x.taux.toFixed(1).padStart(5)}%  ${eur(x.panier).padStart(8)}  ${eur(x.ca).padStart(9)}`
  );
}
console.log("");
