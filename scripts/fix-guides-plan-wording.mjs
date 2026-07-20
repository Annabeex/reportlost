// scripts/fix-guides-plan-wording.mjs
// Scanne TOUS les guides ville générés (table city_guides) et remplace le
// vocabulaire "plan" (connotation abonnement) par la formulation période de
// recherche / paiement unique. Affiche le nombre total de guides et ce qui
// serait modifié.
//
// Simulation par défaut :
//   node scripts/fix-guides-plan-wording.mjs           → compte + aperçu
//   node scripts/fix-guides-plan-wording.mjs --apply   → modifie vraiment
//
// Les pages étant en ISR 24h, les textes corrigés apparaissent en ligne
// progressivement dans la journée (ou immédiatement après un redéploiement).

import fs from "fs";
import { createClient } from "@supabase/supabase-js";

const APPLY = process.argv.includes("--apply");

const env =
  (fs.existsSync(".env.local") ? fs.readFileSync(".env.local", "utf8") : "") +
  "\n" +
  (fs.existsSync(".env") ? fs.readFileSync(".env", "utf8") : "");
const url =
  env.match(/^SUPABASE_URL=([^\s]+)/m)?.[1] ||
  env.match(/^NEXT_PUBLIC_SUPABASE_URL=([^\s]+)/m)?.[1];
const key = env.match(/^SUPABASE_SERVICE_ROLE_KEY=([^\s]+)/m)?.[1];
if (!url || !key) {
  console.error("SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY introuvables dans .env.local");
  process.exit(1);
}
const sb = createClient(url, key, { auth: { persistSession: false } });

// Remplacements, du plus spécifique au plus générique (insensibles à la casse,
// on préserve la majuscule initiale du segment remplacé quand pertinent).
const RULES = [
  [/for the (full|entire) duration of your plan/gi, "for your entire search period"],
  [/the (full|entire) duration of your plan/gi, "your entire search period"],
  [/duration of your plan/gi, "your entire search period"],
  [/your plan is activated/gi, "your search is activated"],
  [/once your plan starts/gi, "once your search starts"],
  [/when your plan starts/gi, "when your search starts"],
  [/depending on the plan you choose/gi, "depending on the search level you choose"],
  [/depending on your plan/gi, "depending on your search level"],
  [/with (the|our) paid plans?/gi, "with an assisted search"],
  [/(our|the) (paid|assisted) plans?/gi, "our assisted searches"],
  [/paid plans?/gi, "assisted searches"],
  [/assisted plans?/gi, "assisted searches"],
  [/subscription/gi, "one-time payment"],
  [/plan options/gi, "search options"],
  [/pricing plans?/gi, "search levels"],
  [/plan levels?/gi, "search levels"],
  [/your plan/gi, "your search period"],
];

function fixText(s) {
  let out = s;
  for (const [re, rep] of RULES) out = out.replace(re, rep);
  return out;
}

// Applique fixText à toutes les chaînes d'un objet JSON, récursivement.
function walk(node, hits) {
  if (typeof node === "string") {
    const fixed = fixText(node);
    if (fixed !== node) hits.push([node, fixed]);
    return fixed;
  }
  if (Array.isArray(node)) return node.map((n) => walk(n, hits));
  if (node && typeof node === "object") {
    const out = {};
    for (const [k, v] of Object.entries(node)) out[k] = walk(v, hits);
    return out;
  }
  return node;
}

// 1) Charge tous les guides (pagination)
const rows = [];
const PAGE = 500;
for (let from = 0; ; from += PAGE) {
  const { data, error } = await sb
    .from("city_guides")
    .select("id, state_id, city_slug, status, guide")
    .order("id", { ascending: true })
    .range(from, from + PAGE - 1);
  if (error) {
    console.error("Erreur lecture city_guides:", error.message);
    process.exit(1);
  }
  if (!data?.length) break;
  rows.push(...data);
  if (data.length < PAGE) break;
}

const published = rows.filter((r) => r.status === "published").length;
console.log(`📊 ${rows.length} guides ville générés au total (${published} publiés, ${rows.length - published} brouillons)\n`);

let toChange = [];
let leftovers = [];
for (const r of rows) {
  if (!r.guide) continue;
  const hits = [];
  const fixed = walk(r.guide, hits);
  if (hits.length) toChange.push({ r, fixed, hits });
  // Occurrences de "plan" restantes après remplacements (à relire à la main)
  const residual = JSON.stringify(fixed).match(/[^"]{0,40}\bplans?\b[^"]{0,40}/gi) || [];
  for (const m of residual) leftovers.push(`${r.state_id}/${r.city_slug}: …${m}…`);
}

console.log(`✏️  ${toChange.length} guide(s) contiennent du vocabulaire "plan" à corriger`);
if (toChange.length) {
  console.log("\nAperçu (3 premiers) :");
  for (const { r, hits } of toChange.slice(0, 3)) {
    console.log(`  ${r.state_id}/${r.city_slug}: ${hits.length} remplacement(s)`);
    for (const [a, b] of hits.slice(0, 2)) {
      console.log(`    - "${a.slice(0, 80)}…"`);
      console.log(`    + "${b.slice(0, 80)}…"`);
    }
  }
}
if (leftovers.length) {
  console.log(`\n⚠️ ${leftovers.length} occurrence(s) de "plan" resteront (contexte différent, à relire) :`);
  for (const l of leftovers.slice(0, 10)) console.log("   " + l);
  if (leftovers.length > 10) console.log(`   … et ${leftovers.length - 10} autres`);
}

if (!APPLY) {
  console.log(`\n🔍 SIMULATION, rien n'a été modifié.`);
  if (toChange.length) console.log(`👉 Pour appliquer : node scripts/fix-guides-plan-wording.mjs --apply`);
  process.exit(0);
}

let ok = 0;
for (const { r, fixed } of toChange) {
  const { error } = await sb
    .from("city_guides")
    .update({ guide: fixed, updated_at: new Date().toISOString() })
    .eq("id", r.id);
  if (error) console.log(`⚠️ ${r.state_id}/${r.city_slug}: ${error.message}`);
  else ok++;
}
console.log(`\n✅ ${ok}/${toChange.length} guide(s) corrigé(s). Les pages se mettent à jour au fil de la journée (ISR 24h).`);
