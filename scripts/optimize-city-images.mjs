// scripts/optimize-city-images.mjs
// Convertit les images de villes déjà générées (bucket "city-images") en
// WebP 1200px q80 : ~10-20x plus léger, aucune différence visible à l'écran.
// Met à jour us_cities.image_url et supprime l'ancien PNG/JPG.
//
// Simulation par défaut :
//   node scripts/optimize-city-images.mjs           → liste + poids total
//   node scripts/optimize-city-images.mjs --apply   → convertit vraiment
//
// Identifiants lus dans .env.local (SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY).

import fs from "fs";
import { createClient } from "@supabase/supabase-js";
import sharp from "sharp";

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
const BUCKET = "city-images";

// 1) Inventaire du bucket : dossiers par état, fichiers png/jpg à convertir
async function listAll(prefix = "") {
  const out = [];
  const { data, error } = await sb.storage.from(BUCKET).list(prefix, { limit: 1000 });
  if (error) {
    console.error(`Erreur list "${prefix}":`, error.message);
    return out;
  }
  for (const entry of data || []) {
    const path = prefix ? `${prefix}/${entry.name}` : entry.name;
    if (entry.id === null && !entry.metadata) {
      // dossier
      out.push(...(await listAll(path)));
    } else {
      out.push({ path, size: entry.metadata?.size ?? 0 });
    }
  }
  return out;
}

console.log("📦 Inventaire du bucket city-images…");
const files = (await listAll()).filter((f) => /\.(png|jpe?g)$/i.test(f.path));
const totalMB = files.reduce((s, f) => s + f.size, 0) / 1024 / 1024;

console.log(`   ${files.length} image(s) PNG/JPG, poids total : ${totalMB.toFixed(0)} Mo`);
if (!files.length) {
  console.log("Rien à convertir (tout est déjà en WebP).");
  process.exit(0);
}

if (!APPLY) {
  console.log(`\n🔍 SIMULATION. Poids estimé après conversion : ~${Math.max(1, Math.round(totalMB / 15))} Mo`);
  console.log("👉 Pour convertir réellement : node scripts/optimize-city-images.mjs --apply");
  process.exit(0);
}

let ok = 0;
let ko = 0;
let savedMB = 0;
for (const [i, f] of files.entries()) {
  try {
    // Télécharge, convertit, upload le .webp, met à jour l'URL, supprime l'ancien
    const { data: blob, error: dlErr } = await sb.storage.from(BUCKET).download(f.path);
    if (dlErr || !blob) throw new Error(dlErr?.message || "download vide");
    const input = Buffer.from(await blob.arrayBuffer());
    const output = await sharp(input).resize({ width: 1200, withoutEnlargement: true }).webp({ quality: 80 }).toBuffer();

    const newPath = f.path.replace(/\.(png|jpe?g)$/i, ".webp");
    const up = await sb.storage.from(BUCKET).upload(newPath, output, { contentType: "image/webp", upsert: true });
    if (up.error) throw new Error(up.error.message);

    const { data: pub } = sb.storage.from(BUCKET).getPublicUrl(newPath);
    const { data: pubOld } = sb.storage.from(BUCKET).getPublicUrl(f.path);
    if (pub?.publicUrl && pubOld?.publicUrl) {
      // Met à jour toutes les lignes qui pointaient sur l'ancienne URL
      const { error: upErr } = await sb
        .from("us_cities")
        .update({ image_url: pub.publicUrl })
        .eq("image_url", pubOld.publicUrl);
      if (upErr) throw new Error(`maj us_cities: ${upErr.message}`);
    }

    await sb.storage.from(BUCKET).remove([f.path]);
    ok++;
    savedMB += (f.size - output.length) / 1024 / 1024;
    process.stdout.write(`  ${i + 1}/${files.length} ✅ ${f.path} (${(f.size / 1024 / 1024).toFixed(1)} Mo → ${(output.length / 1024).toFixed(0)} Ko)\n`);
  } catch (e) {
    ko++;
    console.log(`  ${i + 1}/${files.length} ⚠️ ${f.path}: ${e.message}`);
  }
}

console.log(`\n✅ ${ok} image(s) convertie(s)${ko ? `, ⚠️ ${ko} échec(s)` : ""}. Espace libéré : ~${savedMB.toFixed(0)} Mo.`);
