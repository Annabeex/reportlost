// scripts/org-photos-private.mjs
//
// Déplace les photos d'inventaire DÉJÀ enregistrées du bucket public « images »
// vers le bucket privé « org-private ». À lancer UNE fois, après org-portal-6.sql
// et après le déploiement. Les photos du site public (dépôts sans établissement)
// ne sont jamais touchées.
//
//   node scripts/org-photos-private.mjs            → simulation
//   node scripts/org-photos-private.mjs --apply
import fs from "node:fs";
import { randomUUID } from "node:crypto";

const env = Object.fromEntries(
  fs.readFileSync(fs.existsSync(".env.local") ? ".env.local" : ".env", "utf8")
    .split("\n").filter((l) => l.includes("=") && !l.trim().startsWith("#"))
    .map((l) => { const i = l.indexOf("="); return [l.slice(0, i).trim(), l.slice(i + 1).trim().replace(/^["']|["']$/g, "")]; })
);
const URL_ = env.SUPABASE_URL || env.NEXT_PUBLIC_SUPABASE_URL;
const KEY = env.SUPABASE_SERVICE_ROLE_KEY;
if (!URL_ || !KEY) { console.error("❌ identifiants Supabase introuvables"); process.exit(1); }
const APPLY = process.argv.includes("--apply");
const H = { apikey: KEY, Authorization: `Bearer ${KEY}` };

const rest = async (path, init) => {
  const r = await fetch(`${URL_}/rest/v1/${path}`, { ...init, headers: { ...H, "Content-Type": "application/json", ...(init?.headers || {}) } });
  if (!r.ok) throw new Error(`${r.status} ${await r.text()}`);
  return r.status === 204 ? null : r.json();
};

async function move(table, idCol, urlCol, row, folder) {
  const url = String(row[urlCol]);
  const oldPath = decodeURIComponent((url.split("/object/public/images/")[1] || "").split("?")[0]);
  if (!oldPath) return "ignorée (adresse inattendue)";
  if (!APPLY) return "à déplacer";

  const dl = await fetch(`${URL_}/storage/v1/object/images/${encodeURI(oldPath)}`, { headers: H });
  if (!dl.ok) return `⚠️ téléchargement ${dl.status}`;
  const type = dl.headers.get("content-type") || "image/jpeg";
  const ext = type.includes("png") ? "png" : type.includes("webp") ? "webp" : "jpg";
  const newPath = `org_items/${row.org_id}/${folder}${randomUUID()}.${ext}`;
  const up = await fetch(`${URL_}/storage/v1/object/org-private/${newPath}`, {
    method: "POST", headers: { ...H, "Content-Type": type }, body: Buffer.from(await dl.arrayBuffer()),
  });
  if (!up.ok) return `⚠️ envoi ${up.status} ${await up.text()}`;

  // La fiche pointe d'abord vers la nouvelle photo ; l'ancienne n'est supprimée
  // qu'ensuite. Une coupure au milieu laisse un doublon, jamais un trou.
  await rest(`${table}?${idCol}=eq.${encodeURIComponent(row[idCol])}`, {
    method: "PATCH", headers: { Prefer: "return=minimal" }, body: JSON.stringify({ [urlCol]: `private:${newPath}` }),
  });
  await fetch(`${URL_}/storage/v1/object/images/${encodeURI(oldPath)}`, { method: "DELETE", headers: H });
  return "✅ privée";
}

console.log(`Mode ${APPLY ? "DÉPLACEMENT" : "simulation (ajoute --apply)"}\n`);
const items = await rest(`found_items?select=id,org_id,org_ref,title,image_url&org_id=not.is.null&image_url=like.*%2Fobject%2Fpublic%2Fimages%2F*&limit=5000`);
console.log(`Photos d'inventaire encore publiques : ${items.length}`);
for (const it of items) console.log(`  ${it.org_ref || it.id}  ${String(it.title || "").slice(0, 40)}  ${await move("found_items", "id", "image_url", it, "")}`);

const intakes = await rest(`org_intakes?select=id,org_id,code,title,photo_url&photo_url=like.*%2Fobject%2Fpublic%2Fimages%2F*&limit=5000`);
console.log(`\nPhotos de dépôts QR encore publiques : ${intakes.length}`);
for (const it of intakes) console.log(`  ${it.code}  ${String(it.title || "").slice(0, 40)}  ${await move("org_intakes", "id", "photo_url", it, "intake/")}`);

if (!APPLY) console.log("\n👉 Rien n'a été déplacé. Relance avec --apply.");
