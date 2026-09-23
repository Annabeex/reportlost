// scripts/audit-promesses.mjs
//
// Recense les guides ville qui promettent un résultat ou qui renvoient vers une
// page Facebook à la place du service d'objets trouvés.
//
// Pourquoi les deux ensemble : ce sont les deux défauts qui font qu'une page est
// « explorée, non indexée » (contenu jugé sans valeur ou trompeur) ET que le site
// entier se fait ranger dans la catégorie « arnaque » par les résumés IA. Un
// titre du type « one report and get it back » est exactement la promesse que
// les sites douteux de ce secteur affichent, et c'est elle qu'on a écrite noir
// sur blanc qu'on ne ferait jamais.
//
// Lecture seule. Le script ne modifie rien : il liste, compte, et prépare la
// commande de régénération ciblée.
//
//   node scripts/audit-promesses.mjs                → l'état des lieux
//   node scripts/audit-promesses.mjs --detail       → chaque page fautive + l'extrait
//   node scripts/audit-promesses.mjs --etat=FL      → limité à un État
//   node scripts/audit-promesses.mjs --commande     → la commande regenerate-v2 à lancer
//
// Le scan est volontairement insensible au schéma : il parcourt TOUS les champs
// texte de chaque ligne, sans supposer de noms de colonnes.

import fs from "fs";
import { createClient } from "@supabase/supabase-js";

const args = process.argv.slice(2);
const has = (n) => args.includes(`--${n}`);
const opt = (n, d) => (args.find((a) => a.startsWith(`--${n}=`)) || `--${n}=${d}`).split("=")[1];
const DETAIL = has("detail");
const COMMANDE = has("commande");
const ETAT = opt("etat", "").toUpperCase();
const LIMITE = Number(opt("limite", 0)); // 0 = tout

const env =
  (fs.existsSync(".env.local") ? fs.readFileSync(".env.local", "utf8") : "") + "\n" +
  (fs.existsSync(".env") ? fs.readFileSync(".env", "utf8") : "");
const url =
  env.match(/^SUPABASE_URL=([^\s]+)/m)?.[1] ||
  env.match(/^NEXT_PUBLIC_SUPABASE_URL=([^\s]+)/m)?.[1];
const key = env.match(/^SUPABASE_SERVICE_ROLE_KEY=([^\s]+)/m)?.[1];
if (!url || !key) { console.error("Clés Supabase introuvables dans .env.local"); process.exit(1); }
const sb = createClient(url, key, { auth: { persistSession: false } });

// --------------------------------------------------------------- les motifs
// Promesse de résultat : le défaut grave. On ne peut pas promettre le retour
// de l'objet, et le dire est ce qui fait basculer une page dans « trompeur ».
const PROMESSES = [
  [/\bone report\b[^.]{0,40}\bget (?:it|them) back\b/i, "one report … get it back"],
  [/\bget (?:it|them|your \w+) back\b/i, "get it back"],
  [/\bbring (?:it|them|your \w+) back\b/i, "bring it back"],
  [/\brecover your\b/i, "recover your…"],
  [/\bwe(?:'ll| will) find\b/i, "we will find"],
  [/\bguarantee[ds]?\b/i, "guarantee"],
  [/\bbe reunited\b|\breunite you\b/i, "reunited"],
  [/\byou will (?:get|receive|recover)\b/i, "you will get"],
  [/\bfound within\b|\brecovered within\b/i, "found within X"],
  [/\b100\s*%\b/i, "100 %"],
];

// Coordonnées : une page Facebook à la place du bureau des objets trouvés.
const FACEBOOK = /facebook\.com|fb\.me|\bfb\.com/i;

// Champs où une URL de contact n'a rien à faire : on scanne tout, mais on
// distingue « lien Facebook quelque part » de « Facebook donné comme contact ».
const CONTACT_HINT = /(contact|phone|police|address|url|website|site|link|desk|office|lost)/i;

// ------------------------------------------------------------------ lecture
function textesDe(row) {
  // Aplatit toute la ligne en paires [chemin, texte], quel que soit le schéma.
  const out = [];
  const visite = (v, chemin) => {
    if (v == null) return;
    if (typeof v === "string") { if (v.trim()) out.push([chemin, v]); return; }
    if (typeof v === "number" || typeof v === "boolean") return;
    if (Array.isArray(v)) { v.forEach((x, i) => visite(x, `${chemin}[${i}]`)); return; }
    if (typeof v === "object") { for (const k in v) visite(v[k], chemin ? `${chemin}.${k}` : k); }
  };
  visite(row, "");
  return out;
}

const lignes = [];
for (let from = 0; ; from += 500) {
  let q = sb.from("city_guides").select("*").range(from, from + 499);
  if (ETAT) q = q.eq("state_id", ETAT);
  const { data, error } = await q;
  if (error) { console.error("Erreur Supabase :", error.message); process.exit(1); }
  if (!data?.length) break;
  lignes.push(...data);
  process.stderr.write(`\r  lecture… ${lignes.length}`);
  if (data.length < 500) break;
  if (LIMITE && lignes.length >= LIMITE) break;
}
process.stderr.write("\r                         \r");

if (!lignes.length) { console.log("Aucun guide trouvé."); process.exit(0); }

// ------------------------------------------------------------------ analyse
const fautifs = [];
const parMotif = new Map();
const parEtat = new Map();
const parTone = new Map();

for (const row of lignes) {
  const etat = String(row.state_id || "??").toUpperCase();
  const slug = String(row.city_slug || row.slug || row.id || "?");
  const tone = row.tone_version == null ? "v1/absent" : `v${row.tone_version}`;
  parTone.set(tone, (parTone.get(tone) || 0) + 1);

  const champs = textesDe(row);
  const trouves = [];

  for (const [chemin, texte] of champs) {
    for (const [re, nom] of PROMESSES) {
      const m = texte.match(re);
      if (m) {
        trouves.push({ type: "promesse", nom, chemin, extrait: extrait(texte, m.index),
          phrase: phrase(texte, m.index) });
        parMotif.set(nom, (parMotif.get(nom) || 0) + 1);
      }
    }
    if (FACEBOOK.test(texte)) {
      const m = texte.match(FACEBOOK);
      const grave = CONTACT_HINT.test(chemin);
      trouves.push({
        type: grave ? "facebook-contact" : "facebook",
        nom: grave ? "Facebook comme coordonnée" : "lien Facebook",
        chemin, extrait: extrait(texte, m.index),
      });
      const k = grave ? "Facebook comme coordonnée" : "lien Facebook";
      parMotif.set(k, (parMotif.get(k) || 0) + 1);
    }
  }

  if (trouves.length) {
    fautifs.push({ etat, slug, tone, statut: row.status || "?", trouves });
    parEtat.set(etat, (parEtat.get(etat) || 0) + 1);
  }
}

// Phrase complète contenant le motif, puis normalisée : les noms propres et les
// nombres deviennent des jetons, de sorte que 300 variantes d'une même tournure
// se comptent comme une seule. C'est ce qui décide entre « remplacement ciblé »
// et « régénération ».
function phrase(texte, i) {
  const t = String(texte).replace(/<[^>]*>/g, " ").replace(/\s+/g, " ");
  const a = t.lastIndexOf(".", Math.max(0, i - 1));
  let b = t.indexOf(".", i);
  if (b < 0) b = t.length;
  return t.slice(a + 1, b + 1).trim();
}

function normalise(ph) {
  return ph
    .replace(/\b\d[\d,.]*\b/g, "«N»")
    .replace(/\b(?:[A-Z][a-z'’]+(?:\s+[A-Z][a-z'’]+){0,3})\b/g, (m, o) => (o === 0 ? m : "«NOM»"))
    .replace(/\s+/g, " ")
    .trim();
}

function extrait(texte, i) {
  const t = texte.replace(/\s+/g, " ");
  const a = Math.max(0, (i || 0) - 45), b = Math.min(t.length, (i || 0) + 75);
  return (a ? "…" : "") + t.slice(a, b).trim() + (b < t.length ? "…" : "");
}

// ------------------------------------------------------------------ sortie
const pct = (n) => ((100 * n) / lignes.length).toFixed(1);

console.log(`\n  ${lignes.length} guides examinés${ETAT ? ` (${ETAT})` : ""}.`);
console.log(`  ${fautifs.length} à corriger — ${pct(fautifs.length)} % du parc.\n`);

console.log("  Par défaut trouvé");
console.log("  " + "─".repeat(52));
for (const [nom, n] of [...parMotif.entries()].sort((a, b) => b[1] - a[1])) {
  console.log(`  ${String(n).padStart(5)}  ${nom}`);
}

console.log("\n  Par version de ton");
console.log("  " + "─".repeat(52));
for (const [t, n] of [...parTone.entries()].sort()) {
  const f = fautifs.filter((x) => x.tone === t).length;
  console.log(`  ${t.padEnd(12)} ${String(n).padStart(5)} guides — ${String(f).padStart(5)} fautifs` +
    ` (${n ? ((100 * f) / n).toFixed(0) : 0} %)`);
}

console.log("\n  Par État (les 15 premiers)");
console.log("  " + "─".repeat(52));
for (const [e, n] of [...parEtat.entries()].sort((a, b) => b[1] - a[1]).slice(0, 15)) {
  console.log(`  ${e}  ${String(n).padStart(5)}`);
}

if (DETAIL) {
  console.log("\n  Détail");
  console.log("  " + "─".repeat(72));
  for (const f of fautifs.slice(0, 400)) {
    console.log(`\n  ${f.etat}/${f.slug}  [${f.tone}, ${f.statut}]`);
    for (const t of f.trouves.slice(0, 4)) {
      console.log(`     ${t.type === "promesse" ? "⚑" : "⚐"} ${t.nom}  (${t.chemin})`);
      console.log(`       ${t.extrait}`);
    }
  }
  if (fautifs.length > 400) console.log(`\n  … et ${fautifs.length - 400} autres.`);
}

if (has("motifs")) {
  const cpt = new Map();
  for (const f of fautifs) {
    for (const t of f.trouves) {
      if (t.type !== "promesse" || !t.phrase) continue;
      const k = normalise(t.phrase);
      if (k.length < 12 || k.length > 260) continue;
      if (!cpt.has(k)) cpt.set(k, { n: 0, ex: t.phrase });
      cpt.get(k).n++;
    }
  }
  const tri = [...cpt.entries()].sort((a, b) => b[1].n - a[1].n);
  const total = tri.reduce((s2, [, v]) => s2 + v.n, 0);
  const top = tri.slice(0, 40);
  const couvert = top.reduce((s2, [, v]) => s2 + v.n, 0);

  console.log(`\n  ${tri.length} tournures distinctes pour ${total} occurrences.`);
  console.log(`  Les 40 plus fréquentes en couvrent ${couvert} (${((100*couvert)/total).toFixed(0)} %).`);
  console.log(`  ${tri.filter(([, v]) => v.n === 1).length} n'apparaissent qu'une fois.\n`);
  console.log("  " + "─".repeat(78));
  for (const [, v] of top) {
    console.log(`  ${String(v.n).padStart(5)}  ${v.ex.slice(0, 150)}`);
  }
  console.log("");
}

if (COMMANDE) {
  // Les promesses d'abord : ce sont elles qui coûtent le plus cher.
  const graves = fautifs.filter((f) => f.trouves.some((t) => t.type !== "facebook"));
  const only = graves.slice(0, 60).map((f) => `${f.etat.toLowerCase()}/${f.slug}`).join(",");
  console.log(`\n  ${graves.length} pages avec une promesse ou un Facebook en coordonnée.`);
  console.log(`  Les 60 premières, à régénérer en priorité :\n`);
  console.log(`  node scripts/regenerate-v2.mjs 60 --only=${only}\n`);
}

console.log("");
