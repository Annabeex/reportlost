// scripts/cwv-coupables.mjs
// Qui fait sauter les pages ? Agrège les mesures CLS remontées du terrain.
//   node scripts/cwv-coupables.mjs          → les éléments fautifs, par gravité
//   node scripts/cwv-coupables.mjs --jours=3

import fs from "fs";
import { createClient } from "@supabase/supabase-js";

const JOURS = Number((process.argv.find(a => a.startsWith("--jours=")) || "--jours=7").split("=")[1]);
const env = (fs.existsSync(".env.local") ? fs.readFileSync(".env.local","utf8") : "") + "\n" +
            (fs.existsSync(".env") ? fs.readFileSync(".env","utf8") : "");
const url = env.match(/^SUPABASE_URL=([^\s]+)/m)?.[1] || env.match(/^NEXT_PUBLIC_SUPABASE_URL=([^\s]+)/m)?.[1];
const key = env.match(/^SUPABASE_SERVICE_ROLE_KEY=([^\s]+)/m)?.[1];
const sb = createClient(url, key, { auth: { persistSession: false } });

const { data, error } = await sb.from("cwv_samples").select("*")
  .eq("metric", "CLS")
  .gte("created_at", new Date(Date.now() - JOURS * 86400000).toISOString())
  .order("value", { ascending: false });
if (error) { console.error(error.message); process.exit(1); }
if (!data?.length) { console.log("\n  Aucune mesure encore. Laisse passer quelques heures de trafic.\n"); process.exit(0); }

const mauvais = data.filter(d => d.value > 0.25);
const med = (xs) => { const s=[...xs].sort((a,b)=>a-b); return s[Math.floor(s.length/2)]; };

console.log(`\n  ${data.length} mesures sur ${JOURS} jours.`);
console.log(`  CLS médian : ${med(data.map(d=>d.value)).toFixed(3)}`);
console.log(`  ${mauvais.length} au-dessus de 0,25 (${((100*mauvais.length)/data.length).toFixed(0)} %)\n`);

const par = new Map();
for (const d of mauvais) {
  const k = d.selector || "(inconnu)";
  if (!par.has(k)) par.set(k, { n: 0, somme: 0, pages: new Set(), largeurs: [] });
  const e = par.get(k);
  e.n++; e.somme += d.value; e.pages.add(d.path); if (d.viewport_w) e.largeurs.push(d.viewport_w);
}

console.log("  Éléments responsables, du plus coûteux au moins\n  " + "─".repeat(76));
for (const [sel, e] of [...par.entries()].sort((a,b)=>b[1].somme-a[1].somme).slice(0, 15)) {
  console.log(`\n  ${(e.somme / e.n).toFixed(3)} de CLS moyen · ${e.n} mesure(s) · ${e.pages.size} page(s)`);
  console.log(`     ${sel}`);
  if (e.largeurs.length) {
    const l = e.largeurs.sort((a,b)=>a-b);
    console.log(`     largeurs d'écran : ${l[0]} à ${l[l.length-1]} px (médiane ${med(l)})`);
  }
  console.log(`     ex. : ${[...e.pages].slice(0,3).join(", ")}`);
}
console.log("");
