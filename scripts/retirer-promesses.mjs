// scripts/retirer-promesses.mjs
//
// Retire les promesses de résultat du contenu des guides, en base, sans
// régénérer. Motif : ce n'est PAS ce qui bloque l'indexation (69 % des pages
// indexées en contiennent autant que les refusées), mais c'est ce qui fait
// ranger le site parmi les arnaques dans les résumés IA, et c'est ce que
// /how-it-works dit qu'on ne fait jamais. Le site se contredisait.
//
// Corrige aussi "6 or 12 months" : il n'existe qu'une formule à 12 mois.
//
// Sûr par construction :
//   • à blanc par défaut, --go pour écrire ;
//   • sauvegarde complète des lignes modifiées avant écriture ;
//   • la question de FAQ "Can ReportLost guarantee I'll get my item back?" est
//     laissée intacte : c'est le bon usage, sa réponse est un non ;
//   • une chaîne qui contient encore une promesse après traitement n'est pas
//     écrite au hasard : la page est listée pour régénération.
//
//   node scripts/retirer-promesses.mjs                → ce qui serait changé
//   node scripts/retirer-promesses.mjs --exemples=20  → avant/après
//   node scripts/retirer-promesses.mjs --go           → on écrit
//   node scripts/retirer-promesses.mjs --restaurer=sauvegarde-xxx.json

import fs from "fs";
import { createClient } from "@supabase/supabase-js";

const args = process.argv.slice(2);
const has = (n) => args.includes(`--${n}`);
const opt = (n, d) => (args.find((a) => a.startsWith(`--${n}=`)) || `--${n}=${d}`).split("=").slice(1).join("=");
const GO = has("go");
const EXEMPLES = Number(opt("exemples", 8));
const RESTAURER = opt("restaurer", "");

const env =
  (fs.existsSync(".env.local") ? fs.readFileSync(".env.local", "utf8") : "") + "\n" +
  (fs.existsSync(".env") ? fs.readFileSync(".env", "utf8") : "");
const url =
  env.match(/^SUPABASE_URL=([^\s]+)/m)?.[1] ||
  env.match(/^NEXT_PUBLIC_SUPABASE_URL=([^\s]+)/m)?.[1];
const key = env.match(/^SUPABASE_SERVICE_ROLE_KEY=([^\s]+)/m)?.[1];
const sb = createClient(url, key, { auth: { persistSession: false } });

// ---------------------------------------------------------------- restauration
if (RESTAURER) {
  const sauv = JSON.parse(fs.readFileSync(RESTAURER, "utf8"));
  console.log(`\n  Restauration de ${sauv.length} lignes…`);
  let n = 0;
  for (const ligne of sauv) {
    const { id, ...champs } = ligne;
    const { error } = await sb.from("city_guides").update(champs).eq("id", id);
    if (error) console.error(`  ❌ ${id} : ${error.message}`); else n++;
  }
  console.log(`  ${n} lignes restaurées.\n`);
  process.exit(0);
}

// ---------------------------------------------------------------- les règles
// Ordre important : du plus spécifique au plus général.
const REGLES = [
  // durée : il n'existe qu'une formule, à 12 mois
  [/\b6\s*(?:or|to|-|–)\s*12\s*months\b/gi, "12 months"],
  [/\byour entire search period[\s,—-]*12 months\b/gi, "12 months"],

  // titres « Lost something in X? … get it back »
  ["TITRE", /\b(Los[et](?:\s+something|\s+your\s+[^?]{1,60})?\s+in\s+[^?]{1,60}\?)\s*[^.!?]{0,80}?\b(?:get\s+(?:it|them|your\s+\w+)\s+back|recover\s+your\s+\w+)[^.!?]{0,40}[.!]?/gi],

  // appels à l'action
  // ces trois-là sont des blocs d'appel à l'action : voir CTA plus bas
  ["CTA", /\bReady\s+to\s+(?:get\s+your\s+item\s+back|recover\s+your\s+(?:lost\s+)?item)\s*\?/gi],
  ["CTA", /\bLet'?s\s+get\s+your\s+item\s+back\.?/gi],
  ["CTA", /^\s*Get\s+your\s+item\s+back\.?\s*$/gi],

  // titres « … : where to report and recover your belongings »
  [/\b(where|how)\s+to\s+report\s+and\s+recover\s+your\s+belongings\b/gi, "$1 to report a lost item"],
  [/\breport\s+and\s+recover\s+your\s+belongings\b/gi, "where to report a lost item"],

  // tournures dans le corps
  [/\bwe'?ll\s+help\s+(?:you\s+)?get\s+it\s+back\b/gi, "we take the steps for you"],
  [/\bwe'?ll\s+get\s+it\s+back\s+to\s+you\b/gi, "we take the steps for you"],
  [/\bwe\s+help\s+you\s+report\s+it\s+and\s+get\s+it\s+back\b/gi, "we take the reporting steps for you"],
  [/\bto\s+reunite\s+you\s+with\s+your\s+(?:item|belongings)\b/gi, "to put your report in front of the right offices"],
  [/\bbe\s+reunited\s+with\s+your\s+(?:item|belongings)\b/gi, "hear from whoever finds it"],
  [/\bHow\s+ReportLost\s+helps\s+you\s+recover\s+your\s+lost\s+item\b/gi, "What ReportLost does for you"],
  [/\bhelps?\s+you\s+recover\s+your\s+(?:lost\s+)?(?:item|belongings)\b/gi, "takes the reporting steps for you"],
  [/\brecover\s+your\s+(?:lost\s+)?(?:item|belongings|wallet|phone)\b/gi, "report your loss"],
  [/\bwe\s+will\s+find\s+it\b/gi, "we take the steps for you"],
  [/\bbring\s+(?:it|them)\s+back\b/gi, "get your report to the right desk"],
];

// Champs de titre : la durée de la veille n'y a pas sa place. Un titre annonce
// ce qui est fait, pas les conditions de l'offre. Ailleurs, elle est simplement
// ramenée à 12 mois, qui est la seule durée qui existe.
const CHAMP_TITRE = /(?:^|\.)(h1|title|badge|heroSubtitle|guideHeading|guideSubtitle|areasHeading|areasSubtitle|socialHeading|socialSubtitle|static_title|meta_title|seo_title)$/i;

const REGLES_TITRE = [
  [/\s*[—–,-]?\s*\bfor\s+(?:your\s+entire\s+search\s+period[\s,—–-]*)?(?:6\s*(?:or|to|–|-)\s*)?12\s*months\b/gi, ""],
  [/\s*[—–,-]\s*(?:6\s*(?:or|to|–|-)\s*)?12\s*months\b/gi, ""],
  [/\s*\bfor\s+your\s+entire\s+search\s+period\b/gi, ""],
  [/\s*\bfor\s+(?:a\s+full\s+)?(?:a\s+)?year\b(?=[\s,.;]|$)/gi, ""],
];

// La phrase retenue pour les titres. Si elle y figure déjà, le bloc d'appel à
// l'action en bas de page ne la répète pas : il prend une variante, choisie de
// façon stable à partir du nom de la ville (même page, même variante d'un
// passage à l'autre ; deux pages voisines n'ont pas la même).
// Fins de titre. Une seule phrase répétée sur 4 600 h1 serait pire que la
// promesse qu'elle remplace : c'est le h1 que Google regarde le plus, et c'est
// lui qui donne au parc son air fabriqué à la chaîne. Les variantes ne sont pas
// des synonymes décoratifs, elles disent des choses légèrement différentes.
const TITRES_FIN = [
  "Here is where to report it.",
  "Here is who to contact.",
  "Here are the offices that take your report.",
  "Here is who holds found property.",
];
const CANON = TITRES_FIN[0];
const VARIANTES = [
  "Start your report here.",
  "Report it here.",
  "Where to file your report",
  "File your report below.",
];
function hash(ref) {
  let h = 0;
  for (const c of String(ref)) h = (h * 31 + c.charCodeAt(0)) >>> 0;
  return h;
}
function variantePour(ref) {
  return VARIANTES[hash(ref) % VARIANTES.length];
}
// le motif que la règle de titre transforme : s'il est présent dans un champ de
// titre, ce titre portera CANON, et le CTA devra donc varier
const RE_TITRE_PROMESSE = /\bLos[et](?:\s+something|\s+your\s+[^?]{1,60})?\s+in\s+[^?]{1,60}\?\s*[^.!?]{0,80}?\b(?:get\s+(?:it|them|your\s+\w+)\s+back|recover\s+your\s+\w+)/i;

// laissé intact : c'est le bon usage
const EXCEPTION = /Can\s+ReportLost\s+guarantee/i;
// ce qui reste une promesse après traitement
const RESTE = /\b(get (?:it|them|your \w+) back|recover your|we(?:’|')?ll find|reunite|guaranteed)\b/i;

function corrige(s, chemin = "", ctx = { cta: CANON, fin: CANON }) {
  if (EXCEPTION.test(s)) return s;
  let out = s;
  for (const [a, b] of REGLES) {
    if (a === "CTA") out = out.replace(b, ctx.cta);
    else if (a === "TITRE") out = out.replace(b, `$1 ${ctx.fin}`);
    else out = out.replace(a, b);
  }
  if (CHAMP_TITRE.test(chemin)) {
    for (const [re, rep] of REGLES_TITRE) out = out.replace(re, rep);
  }
  out = out
    .replace(/\s{2,}/g, " ")
    .replace(/\s+([,.;:!?])/g, "$1")
    .replace(/,\s*([.!?])/g, "$1")
    .trim();
  // Nos remplacements sont écrits en minuscule pour s'insérer au milieu d'une
  // phrase ("… and we take the steps for you"). Quand ils atterrissent en tête
  // de phrase, il faut remettre la majuscule.
  if (out !== s) {
    out = out.replace(/(^|[.!?]\s+|<p>\s*|<br\s*\/?>\s*)([a-z])/g,
      (_, avant, lettre) => avant + lettre.toUpperCase());
  }
  return out;
}

// Montre la portion qui change, pas le début de la chaîne : sur un paragraphe
// de 400 caractères, un diff tronqué à 160 affiche deux lignes identiques.
function fenetre(a, b, marge = 55) {
  let i = 0;
  while (i < a.length && i < b.length && a[i] === b[i]) i++;
  let ja = a.length - 1, jb = b.length - 1;
  while (ja > i && jb > i && a[ja] === b[jb]) { ja--; jb--; }
  const d = Math.max(0, i - marge);
  const coupe = (s, fin) => (d ? "…" : "") + s.slice(d, Math.min(s.length, fin + marge)).trim() +
    (fin + marge < s.length ? "…" : "");
  return [coupe(a, ja + 1), coupe(b, jb + 1)];
}

function transforme(v, etat, chemin = "", ctx) {
  if (typeof v === "string") {
    const n = corrige(v, chemin, ctx);
    if (n !== v) {
      etat.change = true;
      if (etat.ex.length < EXEMPLES) etat.ex.push(fenetre(v, n));
    }
    if (RESTE.test(n) && !EXCEPTION.test(n)) etat.reste = true;
    return n;
  }
  if (Array.isArray(v)) return v.map((x) => transforme(x, etat, chemin, ctx));
  if (v && typeof v === "object") {
    const o = {};
    for (const k in v) o[k] = transforme(v[k], etat, chemin ? `${chemin}.${k}` : k, ctx);
    return o;
  }
  return v;
}

// colonnes qu'on ne réécrit jamais
const HORS = new Set(["id", "created_at", "updated_at", "state_id", "city_slug", "status", "tone_version", "verified"]);

// ---------------------------------------------------------------- autotest
// `--autotest` vérifie les règles sur des lignes fabriquées, sans toucher à la
// base. Utile parce que l'essai à blanc, lui, a besoin du réseau.
if (has("autotest")) {
  const lignes = [
    { state_id: "FL", city_slug: "tampa",
      h1: "Lost something in Tampa? Get it back faster.",
      heroSubtitle: "Your report stays active for 6 or 12 months, matching new found item posts.",
      cards: [{ title: "Ready to get your item back?", body: "We'll help you get it back." }] },
    { state_id: "NC", city_slug: "kernersville",
      h1: "Lost and found in Kernersville, NC: where to report",
      heroSubtitle: "One report to the Kernersville Police Department.",
      cards: [{ title: "Ready to get your item back?", body: "File a report." }] },
    { state_id: "MA", city_slug: "boston",
      faq: [{ q: "Can ReportLost guarantee I'll get my item back?",
              a: "No. No honest service can guarantee recovery." }] },
  ];
  for (const g of lignes) {
    const etat = { change: false, reste: false, ex: [] };
    const titres = titresDe(g);
    const prend = RE_TITRE_PROMESSE.test(titres) || TITRES_FIN.some((f) => titres.includes(f));
    const ref = `${g.state_id}/${g.city_slug}`;
    const fin = TITRES_FIN[hash(ref) % TITRES_FIN.length];
    const ctx = { fin, cta: prend ? variantePour(ref) : fin };
    console.log(`\n  ── ${ref}  (titre reformulé : ${prend ? "oui" : "non"})`);
    for (const k in g) {
      if (HORS.has(k)) continue;
      const n = transforme(g[k], etat, k, ctx);
      if (JSON.stringify(n) !== JSON.stringify(g[k])) {
        console.log(`     ${k} :`);
        console.log(`       −  ${JSON.stringify(g[k])}`);
        console.log(`       +  ${JSON.stringify(n)}`);
      }
    }
    if (!etat.change) console.log("     (inchangé)");
  }
  console.log("");
  process.exit(0);
}

// ---------------------------------------------------------------- lecture
const guides = [];
for (let from = 0; ; from += 500) {
  const { data, error } = await sb.from("city_guides").select("*").range(from, from + 499);
  if (error) { console.error(error.message); process.exit(1); }
  if (!data?.length) break;
  guides.push(...data);
  process.stderr.write(`\r  lecture… ${guides.length}`);
  if (data.length < 500) break;
}
process.stderr.write("\r                      \r");

const aEcrire = [];
const sauvegarde = [];
const exemples = [];
let nReste = 0;
const pagesReste = [];

function titresDe(g) {
  const bouts = [];
  const walk = (v, chemin) => {
    if (v == null) return;
    if (typeof v === "string") { if (CHAMP_TITRE.test(chemin)) bouts.push(v); return; }
    if (Array.isArray(v)) { v.forEach((x) => walk(x, chemin)); return; }
    if (typeof v === "object") { for (const k in v) walk(v[k], chemin ? `${chemin}.${k}` : k); }
  };
  for (const k in g) if (!HORS.has(k)) walk(g[k], k);
  return bouts.join(" \n ");
}

for (const g of guides) {
  const etat = { change: false, reste: false, ex: [] };
  const titres = titresDe(g);
  const titrePrendCanon = RE_TITRE_PROMESSE.test(titres) || TITRES_FIN.some((f) => titres.includes(f));
  const ref = `${g.state_id}/${g.city_slug}`;
  const fin = TITRES_FIN[hash(ref) % TITRES_FIN.length];
  const ctx = { fin, cta: titrePrendCanon ? variantePour(ref) : fin };
  const patch = {};
  const avant = {};
  for (const k in g) {
    if (HORS.has(k)) continue;
    const n = transforme(g[k], etat, k, ctx);
    if (JSON.stringify(n) !== JSON.stringify(g[k])) { patch[k] = n; avant[k] = g[k]; }
  }
  if (etat.reste) { nReste++; pagesReste.push(`${String(g.state_id).toLowerCase()}/${g.city_slug}`); }
  if (Object.keys(patch).length) {
    aEcrire.push({ id: g.id, patch, ref: `${g.state_id}/${g.city_slug}` });
    sauvegarde.push({ id: g.id, ...avant });
    if (exemples.length < EXEMPLES) exemples.push(...etat.ex.slice(0, 2));
  }
}

console.log(`\n  ${guides.length} guides lus.`);
console.log(`  ${aEcrire.length} seraient modifiés.`);
console.log(`  ${nReste} gardent une promesse que les règles ne savent pas réécrire.\n`);

if (exemples.length) {
  console.log("  Avant / après\n  " + "─".repeat(76));
  for (const [a, b] of exemples.slice(0, EXEMPLES)) {
    console.log(`  −  ${a}`);
    console.log(`  +  ${b}\n`);
  }
}

if (!GO) {
  if (pagesReste.length) {
    console.log("  À régénérer (les 40 premières) :");
    console.log(`  node scripts/regenerate-v2.mjs 40 --only=${pagesReste.slice(0, 40).join(",")}\n`);
  }
  console.log("  (essai à blanc — rien n'a été écrit. Ajoute --go pour appliquer.)\n");
  process.exit(0);
}

// ---------------------------------------------------------------- écriture
const fichier = `_travail/sauvegarde-promesses-${new Date().toISOString().slice(0, 19).replace(/[:T]/g, "-")}.json`;
fs.writeFileSync(fichier, JSON.stringify(sauvegarde, null, 1));
console.log(`  Sauvegarde : ${fichier}`);
console.log(`  Retour arrière : node scripts/retirer-promesses.mjs --restaurer=${fichier}\n`);

let ok = 0, ko = 0;
for (const [i, e] of aEcrire.entries()) {
  const { error } = await sb.from("city_guides").update(e.patch).eq("id", e.id);
  if (error) { ko++; if (ko < 6) console.error(`  ❌ ${e.ref} : ${error.message}`); }
  else ok++;
  if (i % 100 === 0) process.stderr.write(`\r  écriture… ${i}/${aEcrire.length}`);
}
process.stderr.write("\r                            \r");
console.log(`  ✅ ${ok} guides mis à jour, ❌ ${ko} en échec.`);
console.log(`  Les pages sont en ISR 24 h : le changement sera visible d'ici demain.\n`);
