// scripts/purge-free-photos.mjs
// Supprime les PHOTOS des signalements GRATUITS de plus de 30 jours :
// fichier retiré du Storage Supabase (bucket "images") + colonne object_photo
// remise à NULL. Les signalements eux-mêmes ne sont PAS supprimés.
//
// ⚠️ Irréversible. Le script tourne en SIMULATION par défaut :
//   node scripts/purge-free-photos.mjs            → liste ce qui serait supprimé
//   node scripts/purge-free-photos.mjs --apply    → supprime vraiment
//
// Options :
//   --days=60   → changer l'ancienneté (défaut 30 jours)
//
// Identifiants lus dans .env.local (SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY).

import fs from "fs";
import { createClient } from "@supabase/supabase-js";

const APPLY = process.argv.includes("--apply");
const daysArg = process.argv.find((a) => a.startsWith("--days="));
const DAYS = Math.max(1, Number(daysArg?.split("=")[1] || 30));

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

const cutoff = new Date(Date.now() - DAYS * 86400000).toISOString();

// 1) Signalements gratuits (pas de contribution, pas payés) de plus de N jours, avec photo
const rows = [];
const PAGE = 1000;
for (let from = 0; ; from += PAGE) {
  const { data, error } = await sb
    .from("lost_items")
    .select("id, public_id, created_at, contribution, paid, object_photo")
    .not("object_photo", "is", null)
    .lt("created_at", cutoff)
    .or("contribution.is.null,contribution.eq.0")
    .order("created_at", { ascending: true })
    .range(from, from + PAGE - 1);
  if (error) {
    console.error("Erreur lecture lost_items:", error.message);
    process.exit(1);
  }
  if (!data?.length) break;
  rows.push(...data);
  if (data.length < PAGE) break;
}

// Sécurité : on écarte tout ce qui est marqué payé, même avec contribution vide
const targets = rows.filter((r) => !r.paid && String(r.object_photo || "").trim() !== "");

// 2) URL publique -> chemin dans le bucket "images"
//    ex: https://xxx.supabase.co/storage/v1/object/public/images/object_photo/lost-123-cat.jpg
//        -> object_photo/lost-123-cat.jpg
const items = targets
  .map((r) => {
    const m = String(r.object_photo).split("/object/public/images/")[1];
    return m ? { id: r.id, public_id: r.public_id, created_at: r.created_at, path: decodeURIComponent(m) } : null;
  })
  .filter(Boolean);

const skipped = targets.length - items.length;

console.log(`📊 Signalements gratuits de plus de ${DAYS} jours avec photo : ${targets.length}`);
if (skipped) console.log(`   (dont ${skipped} avec une URL externe au bucket "images", ignorés)`);
if (!items.length) {
  console.log("Rien à faire.");
  process.exit(0);
}

if (!APPLY) {
  console.log("\n🔍 SIMULATION (aucune suppression). Aperçu :\n");
  for (const it of items.slice(0, 15)) {
    console.log(`  #${it.public_id || it.id}  ${it.created_at?.slice(0, 10)}  ${it.path}`);
  }
  if (items.length > 15) console.log(`  … et ${items.length - 15} autres`);
  console.log(`\n👉 Pour supprimer réellement : node scripts/purge-free-photos.mjs --apply`);
  process.exit(0);
}

// 3) Suppression Storage par lots de 100, puis nettoyage de la colonne
let filesOk = 0;
let filesKo = 0;
const cleanedIds = [];
for (let i = 0; i < items.length; i += 100) {
  const batch = items.slice(i, i + 100);
  const { data, error } = await sb.storage.from("images").remove(batch.map((b) => b.path));
  if (error) {
    console.error(`⚠️ Lot ${i / 100 + 1}: ${error.message}`);
    filesKo += batch.length;
    continue;
  }
  // remove() renvoie les fichiers effectivement supprimés ; un fichier déjà
  // absent n'empêche pas de nettoyer la colonne (le but est atteint).
  filesOk += data?.length ?? 0;
  cleanedIds.push(...batch.map((b) => b.id));
  process.stdout.write(`  … ${Math.min(i + 100, items.length)}/${items.length}\r`);
}

let dbOk = 0;
for (let i = 0; i < cleanedIds.length; i += 200) {
  const chunk = cleanedIds.slice(i, i + 200);
  const { error } = await sb.from("lost_items").update({ object_photo: null }).in("id", chunk);
  if (error) console.error(`⚠️ Nettoyage colonne (lot ${i / 200 + 1}): ${error.message}`);
  else dbOk += chunk.length;
}

console.log(`\n✅ ${filesOk} fichier(s) supprimé(s) du Storage${filesKo ? `, ⚠️ ${filesKo} en échec` : ""}.`);
console.log(`✅ ${dbOk} signalement(s) nettoyé(s) (object_photo → NULL).`);
