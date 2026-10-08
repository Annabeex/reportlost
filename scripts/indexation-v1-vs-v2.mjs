// scripts/indexation-v1-vs-v2.mjs
//
// Le gabarit V2 (moins commercial) s'indexe-t-il mieux que le V1 ?
//
// On croise city_guides.tone_version avec les deux exports Search Console
// déjà présents dans _travail/ :
//   • Coverage-Valid       → URL INDEXÉES (échantillon)
//   • Coverage-Drilldown   → URL « explorée, actuellement non indexée »
//
// ⚠️ Search Console plafonne ses exports à 1 000 lignes. Ce ne sont donc pas
// des listes complètes mais des ÉCHANTILLONS. On ne peut pas en tirer un taux
// d'indexation absolu — en revanche, comparer la part de V2 dans l'échantillon
// indexé à sa part dans le corpus est parfaitement légitime : si V2 pèse 20 %
// du corpus et 35 % des pages indexées, le gabarit fait une différence.
//
//   node scripts/indexation-v1-vs-v2.mjs

import fs from "node:fs";
import path from "node:path";

const env = Object.fromEntries(
  fs.readFileSync(fs.existsSync(".env.local") ? ".env.local" : ".env", "utf8")
    .split("\n").filter((l) => l.includes("=") && !l.trim().startsWith("#"))
    .map((l) => { const i = l.indexOf("="); return [l.slice(0, i).trim(), l.slice(i + 1).trim().replace(/^["']|["']$/g, "")]; })
);
const URL_ = env.SUPABASE_URL || env.NEXT_PUBLIC_SUPABASE_URL;
const KEY = env.SUPABASE_SERVICE_ROLE_KEY;
if (!URL_ || !KEY) { console.error("❌ identifiants Supabase introuvables"); process.exit(1); }

// 1) le corpus : tous les guides publiés, avec leur version de gabarit
const guides = [];
for (let off = 0; ; off += 1000) {
  const qs = `select=state_id,city_slug,tone_version,created_at&status=eq.published&order=state_id.asc&limit=1000&offset=${off}`;
  const r = await fetch(`${URL_}/rest/v1/city_guides?${qs}`, {
    headers: { apikey: KEY, Authorization: `Bearer ${KEY}`, Accept: "application/json" },
  });
  if (!r.ok) { console.error(`❌ ${r.status} ${await r.text()}`); process.exit(1); }
  const p = await r.json(); guides.push(...p);
  if (p.length < 1000) break;
}
const version = new Map();
for (const g of guides) {
  if (!g.state_id || !g.city_slug) continue;
  version.set(`/lost-and-found/${String(g.state_id).toLowerCase()}/${String(g.city_slug).toLowerCase()}`,
              Number(g.tone_version ?? 1));
}
const corpusV2 = [...version.values()].filter((v) => v === 2).length;
const corpus = version.size;

// 2) les exports Search Console présents dans _travail/
function lireExport(dossierZipNom) {
  // On attend un dossier déjà décompressé OU le CSV directement.
  const bases = ["_travail", "_travail/" + dossierZipNom, "/tmp/" + dossierZipNom];
  for (const b of bases) {
    const f = path.join(b, "Tableau.csv");
    if (fs.existsSync(f)) return fs.readFileSync(f, "utf8");
  }
  return null;
}
// Dates d'exploration contenues dans l'export : sans elles, impossible de
// savoir si Google a seulement eu le temps de voir la cohorte V2.
function datesDe(csv) {
  if (!csv) return [];
  return csv.split("\n").slice(1)
    .map((l) => (l.split(",")[1] || "").trim())
    .filter((d) => /^\d{4}-\d{2}-\d{2}$/.test(d))
    .sort();
}

function urlsDe(csv) {
  if (!csv) return [];
  return csv.split("\n").slice(1)
    .map((l) => (l.split(",")[0] || "").trim())
    .filter((u) => u.startsWith("http"))
    .map((u) => u.replace(/^https?:\/\/[^/]+/, "").split("?")[0].toLowerCase());
}

const csvValid = lireExport("valid");
const csvDrill = lireExport("drilldown");
const sources = { indexees: urlsDe(csvValid), refusees: urlsDe(csvDrill) };
const toutesDates = [...datesDe(csvValid), ...datesDe(csvDrill)].sort();
const derniereExploration = toutesDates[toutesDates.length - 1] || null;

// Date d'apparition du gabarit V2 : la plus ancienne date de création parmi
// les guides V2. Sans marge suffisante entre elle et l'export, rien n'est
// mesurable — Google n'a pas eu le temps de passer.
const datesV2 = guides.filter((g) => Number(g.tone_version) === 2 && g.created_at)
  .map((g) => String(g.created_at).slice(0, 10)).sort();
const debutV2 = datesV2[0] || null;

if (!sources.indexees.length && !sources.refusees.length) {
  console.log(`\n⚠️  Aucun export Search Console trouvé.`);
  console.log(`   Décompresse les deux ZIP de _travail/ dans /tmp :`);
  console.log(`     unzip -o _travail/reportlost.org-Coverage-Valid-*.zip     -d /tmp/valid`);
  console.log(`     unzip -o _travail/reportlost.org-Coverage-Drilldown-*.zip -d /tmp/drilldown`);
  console.log(`   puis relance ce script.\n`);
  process.exit(0);
}

if (debutV2 && derniereExploration) {
  const jours = Math.round((new Date(derniereExploration) - new Date(debutV2)) / 86400000);
  console.log(`\nFENÊTRE DE MESURE`);
  console.log(`  gabarit V2 à partir du   ${debutV2}`);
  console.log(`  export exploré jusqu'au  ${derniereExploration}`);
  console.log(`  → ${jours} jour(s) pour que Google explore et juge la cohorte V2`);
  if (jours < 21) {
    console.log(`\n⛔ FENÊTRE TROP COURTE. Google met trois à six semaines à explorer`);
    console.log(`   puis juger un lot de pages. En dessous de 21 jours, l'absence de V2`);
    console.log(`   dans les échantillons ne veut RIEN dire — ni en bien, ni en mal.`);
    console.log(`   Refais un export Search Console aujourd'hui et relance.\n`);
  }
}

console.log(`\nCORPUS DES GUIDES PUBLIÉS`);
console.log(`  total            ${corpus}`);
console.log(`  gabarit V2       ${corpusV2}  (${(100 * corpusV2 / corpus).toFixed(1)} %)`);
console.log(`  gabarit V1       ${corpus - corpusV2}  (${(100 * (corpus - corpusV2) / corpus).toFixed(1)} %)`);

for (const [nom, urls] of Object.entries(sources)) {
  if (!urls.length) continue;
  const connues = urls.filter((u) => version.has(u));
  const v2 = connues.filter((u) => version.get(u) === 2).length;
  const v1 = connues.length - v2;
  const partCorpus = (100 * corpusV2) / corpus;
  const partIci = connues.length ? (100 * v2) / connues.length : 0;
  const etiquette = nom === "indexees" ? "PAGES INDEXÉES" : "PAGES EXPLORÉES MAIS REFUSÉES";
  console.log(`\n${etiquette} (échantillon de ${urls.length}, dont ${connues.length} guides ville)`);
  console.log(`  V2 : ${String(v2).padStart(4)}   ${partIci.toFixed(1)} %`);
  console.log(`  V1 : ${String(v1).padStart(4)}   ${(100 - partIci).toFixed(1)} %`);
  const ecart = partIci - partCorpus;
  const sens = nom === "indexees" ? 1 : -1;
  // Zéro V2 dans l'échantillon n'est pas un résultat : c'est une absence.
  // Une absence des DEUX côtés signifie que Google n'a pas encore traité la
  // cohorte — conclure quoi que ce soit dans un sens ou dans l'autre serait faux.
  const verdict =
    v2 === 0 ? "∅ aucune page V2 dans cet échantillon — non mesurable, pas un verdict"
      : Math.abs(ecart) < 3 ? "aucun écart significatif"
      : ecart * sens > 0 ? "✅ le gabarit V2 fait mieux"
      : "⚠️ le gabarit V2 fait moins bien";
  console.log(`  V2 pèse ${partCorpus.toFixed(1)} % du corpus et ${partIci.toFixed(1)} % de cet échantillon → ${verdict}`);
}

console.log(`
⚠️  RAPPEL : ces exports sont plafonnés à 1 000 lignes par Search Console.
   Ils ne donnent pas un taux absolu, seulement une comparaison de parts —
   et uniquement si l'échantillonnage de Google n'est pas biaisé par gabarit,
   ce qu'on ne peut pas vérifier. À lire comme un indice, pas comme une preuve.
`);
