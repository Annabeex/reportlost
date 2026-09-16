// scripts/fix-poster-photos.mjs
//
// Reconvertit en JPEG les photos de signalements que le générateur d'affiches
// ne sait pas décoder (WebP, AVIF, HEIC). Sans ça, /api/poster/<id> laisse un
// rectangle blanc au milieu de l'affiche, sans lever d'erreur.
//
// Par défaut le fichier d'origine n'est ni supprimé ni écrasé : la version
// JPEG est déposée à côté, sous un nouveau nom, et c'est la colonne
// object_photo qui pointe dessus. En cas de doute on peut revenir en arrière.
//
// ⚠️ Revers de cette prudence : l'original devient invisible pour
// purge-free-photos.mjs, qui ne supprime que le fichier RÉFÉRENCÉ. Il resterait
// donc dans le bucket pour toujours. D'où --purge-original, à utiliser une fois
// le résultat vérifié.
//
//   node scripts/fix-poster-photos.mjs                        → inventaire seul
//   node scripts/fix-poster-photos.mjs --apply                → convertit tout
//   node scripts/fix-poster-photos.mjs --apply --purge-original
//   node scripts/fix-poster-photos.mjs 96698 --apply          → un seul dossier
//   options : --limit=200 (défaut 500)

import fs from "node:fs";
import sharp from "sharp";

const envFile = fs.existsSync(".env.local") ? ".env.local" : ".env";
const env = Object.fromEntries(
  fs
    .readFileSync(envFile, "utf8")
    .split("\n")
    .filter((l) => l.includes("=") && !l.trim().startsWith("#"))
    .map((l) => {
      const i = l.indexOf("=");
      return [l.slice(0, i).trim(), l.slice(i + 1).trim().replace(/^["']|["']$/g, "")];
    })
);

const URL_ = env.SUPABASE_URL || env.NEXT_PUBLIC_SUPABASE_URL;
const KEY = env.SUPABASE_SERVICE_ROLE_KEY;
if (!URL_ || !KEY) {
  console.error(`❌ SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY introuvables dans ${envFile}`);
  process.exit(1);
}

const args = process.argv.slice(2);
const APPLY = args.includes("--apply");
const PURGE_ORIGINAL = args.includes("--purge-original");
const LIMIT = Number((args.find((a) => a.startsWith("--limit=")) || "").split("=")[1] || 500);
const ONE = args.find((a) => /^\d{5}$/.test(a)) || null;
const BUCKET = "images";

const H = { apikey: KEY, Authorization: `Bearer ${KEY}` };

function sniff(bytes) {
  const b = new Uint8Array(bytes);
  const at = (i, ...sig) => sig.every((v, k) => b[i + k] === v);
  if (at(0, 0x89, 0x50, 0x4e, 0x47)) return "png";
  if (at(0, 0xff, 0xd8, 0xff)) return "jpeg";
  if (at(0, 0x47, 0x49, 0x46, 0x38)) return "gif";
  if (at(0, 0x52, 0x49, 0x46, 0x46) && at(8, 0x57, 0x45, 0x42, 0x50)) return "webp";
  if (at(4, 0x66, 0x74, 0x79, 0x70)) return "heic/avif";
  return "unknown";
}

const RENDERABLE = new Set(["png", "jpeg", "gif"]);

async function rest(path, init) {
  const r = await fetch(`${URL_}/rest/v1/${path}`, {
    ...init,
    headers: { ...H, Accept: "application/json", "Content-Type": "application/json", ...(init?.headers || {}) },
  });
  if (!r.ok) throw new Error(`${r.status} ${await r.text()}`);
  return r.status === 204 ? null : r.json();
}

async function convert(row) {
  const src = row.object_photo;
  const label = `#${row.public_id} ${String(row.title || "").slice(0, 38)}`;

  const res = await fetch(src);
  if (!res.ok) return { label, skip: `URL inaccessible (HTTP ${res.status})` };
  const buf = Buffer.from(await res.arrayBuffer());
  const kind = sniff(buf);
  if (RENDERABLE.has(kind)) return { label, ok: true, skip: `déjà ${kind}` };

  if (!APPLY) return { label, todo: `${kind} → JPEG (${Math.round(buf.length / 1024)} Ko)` };

  // Conversion : même cadrage, 1600 px max, fond blanc si transparence.
  const jpeg = await sharp(buf)
    .rotate() // respecte l'orientation EXIF, sinon les photos de téléphone basculent
    .resize({ width: 1600, height: 1600, fit: "inside", withoutEnlargement: true })
    .flatten({ background: "#ffffff" })
    .jpeg({ quality: 86, mozjpeg: true })
    .toBuffer();

  // Nouveau chemin, à côté de l'original qui reste intact.
  const oldPath = decodeURIComponent(src.split(`/object/public/${BUCKET}/`)[1] || "");
  if (!oldPath) return { label, skip: "chemin Storage illisible" };
  const newPath = oldPath.replace(/\.[^./]+$/, "") + `-jpg-${Date.now()}.jpg`;

  const up = await fetch(`${URL_}/storage/v1/object/${BUCKET}/${encodeURI(newPath)}`, {
    method: "POST",
    headers: { ...H, "Content-Type": "image/jpeg", "x-upsert": "true" },
    body: jpeg,
  });
  if (!up.ok) return { label, skip: `upload refusé : ${up.status} ${await up.text()}` };

  const publicUrl = `${URL_}/storage/v1/object/public/${BUCKET}/${encodeURI(newPath)}`;

  // La base pointe sur le nouveau fichier AVANT toute suppression : si la
  // suppression échoue on a un orphelin, pas un signalement sans photo.
  await rest(`lost_items?id=eq.${encodeURIComponent(row.id)}`, {
    method: "PATCH",
    headers: { Prefer: "return=minimal" },
    body: JSON.stringify({ object_photo: publicUrl }),
  });

  let purged = "";
  if (PURGE_ORIGINAL) {
    const del = await fetch(`${URL_}/storage/v1/object/${BUCKET}/${encodeURI(oldPath)}`, {
      method: "DELETE",
      headers: H,
    });
    purged = del.ok ? " · original supprimé" : ` · ⚠️ original conservé (${del.status})`;
  }

  return {
    label,
    done:
      `${kind} → JPEG · ${Math.round(buf.length / 1024)} Ko → ${Math.round(jpeg.length / 1024)} Ko` + purged,
    url: publicUrl,
  };
}

const select = "select=id,public_id,title,object_photo";
const rows = ONE
  ? await rest(`lost_items?${select}&public_id=eq.${ONE}&limit=1`)
  : await rest(`lost_items?${select}&object_photo=not.is.null&order=created_at.desc&limit=${LIMIT}`);

if (!rows.length) {
  console.log("Aucun dossier à examiner.");
  process.exit(0);
}

console.log(
  `${rows.length} dossier(s) avec photo · mode ${APPLY ? "CONVERSION" : "inventaire (ajoute --apply pour écrire)"}\n`
);

let fixed = 0;
let todo = 0;
for (const row of rows) {
  try {
    const r = await convert(row);
    if (r.done) { fixed++; console.log(`✅ ${r.label}\n   ${r.done}\n   ${r.url}\n`); }
    else if (r.todo) { todo++; console.log(`⚠️  ${r.label}\n   ${r.todo}\n`); }
    else if (r.skip && !r.ok) console.log(`—  ${r.label} : ${r.skip}\n`);
  } catch (e) {
    console.log(`❌ #${row.public_id} : ${e.message}\n`);
  }
}

console.log(
  APPLY
    ? `\n${fixed} photo(s) reconverties.` +
        (PURGE_ORIGINAL
          ? ""
          : `\n⚠️ Les originaux restent dans le bucket et ne seront jamais repris par purge-free-photos.mjs.\n   Une fois le rendu vérifié : relancer avec --apply --purge-original.`)
    : `\n${todo} photo(s) à reconvertir. Relance avec --apply pour le faire.`
);
