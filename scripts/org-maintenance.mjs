// scripts/org-maintenance.mjs
//
// Deux balayages, tous deux partant du DÉPART RÉEL de l'objet (disposed_at),
// jamais de l'échéance légale — qui n'est qu'un droit, pas un événement.
//
//   photo  : supprimée 30 jours après le départ. Elle ne servait qu'à vérifier
//            une réclamation ; l'objet parti, elle ne vérifie plus rien.
//   fiche  : supprimée 365 jours après le départ. Entre les deux, elle reste
//            consultable : qui l'a reçue, quand, sous quelle référence. C'est
//            ce qui permet de répondre à quelqu'un qui arrive en retard.
//
// Rien n'est supprimé pour un objet encore au bureau, quelle que soit sa date.
//
//   node scripts/org-maintenance.mjs                 → simulation
//   node scripts/org-maintenance.mjs --apply
//   options : --photo-days=30 --record-days=365

import fs from "node:fs";

const env = Object.fromEntries(
  fs.readFileSync(fs.existsSync(".env.local") ? ".env.local" : ".env", "utf8")
    .split("\n").filter((l) => l.includes("=") && !l.trim().startsWith("#"))
    .map((l) => { const i = l.indexOf("="); return [l.slice(0, i).trim(), l.slice(i + 1).trim().replace(/^["']|["']$/g, "")]; })
);
const URL_ = env.SUPABASE_URL || env.NEXT_PUBLIC_SUPABASE_URL;
const KEY = env.SUPABASE_SERVICE_ROLE_KEY;
if (!URL_ || !KEY) { console.error("❌ identifiants Supabase introuvables"); process.exit(1); }

const APPLY = process.argv.includes("--apply");
const num = (n, d) => Number((process.argv.find((a) => a.startsWith(`--${n}=`)) || "").split("=")[1] || d);
const PHOTO_DAYS = num("photo-days", 30);
const RECORD_DAYS = num("record-days", 365);
const BUCKET = "images";
const H = { apikey: KEY, Authorization: `Bearer ${KEY}` };
const iso = (d) => new Date(Date.now() - d * 86400000).toISOString();

const rest = async (path, init) => {
  const r = await fetch(`${URL_}/rest/v1/${path}`, {
    ...init,
    headers: { ...H, Accept: "application/json", "Content-Type": "application/json", ...(init?.headers || {}) },
  });
  if (!r.ok) throw new Error(`${r.status} ${await r.text()}`);
  return r.status === 204 ? null : r.json();
};

console.log(
  `Mode ${APPLY ? "SUPPRESSION" : "simulation (ajoute --apply)"} · photo à ${PHOTO_DAYS} j · fiche à ${RECORD_DAYS} j\n`
);

// ── 1. Photos des objets partis il y a plus de PHOTO_DAYS ──────────────────
const photos = await rest(
  `found_items?select=id,org_ref,title,image_url,disposed_at,disposition` +
  `&disposed_at=lt.${iso(PHOTO_DAYS)}&image_url=not.is.null&photo_purged_at=is.null&limit=1000`
);
console.log(`Photos à supprimer : ${photos.length}`);
let photoOk = 0;
for (const it of photos) {
  const path = String(it.image_url).split(`/object/public/${BUCKET}/`)[1];
  const line = `  ${it.org_ref || it.id}  ${String(it.title || "").slice(0, 34)}  parti ${String(it.disposed_at).slice(0, 10)} (${it.disposition || "—"})`;
  if (!APPLY) { console.log(line); continue; }
  if (path) {
    const del = await fetch(`${URL_}/storage/v1/object/${BUCKET}/${encodeURI(decodeURIComponent(path))}`, {
      method: "DELETE", headers: H,
    });
    if (!del.ok && del.status !== 404) { console.log(`${line}  ⚠️ storage ${del.status}`); continue; }
  }
  // La colonne est vidée même si le fichier avait déjà disparu : le but est
  // qu'aucune fiche ne pointe vers une photo qui n'existe plus.
  await rest(`found_items?id=eq.${encodeURIComponent(it.id)}`, {
    method: "PATCH",
    headers: { Prefer: "return=minimal" },
    body: JSON.stringify({ image_url: null, photo_purged_at: new Date().toISOString() }),
  });
  photoOk++;
  console.log(`${line}  ✅`);
}

// ── 2. Fiches des objets partis il y a plus de RECORD_DAYS ─────────────────
const records = await rest(
  `found_items?select=id,org_ref,title,disposed_at,disposition,image_url` +
  `&disposed_at=lt.${iso(RECORD_DAYS)}&limit=1000`
);
console.log(`\nFiches à supprimer : ${records.length}`);
let recOk = 0;
for (const it of records) {
  const line = `  ${it.org_ref || it.id}  ${String(it.title || "").slice(0, 34)}  parti ${String(it.disposed_at).slice(0, 10)}`;
  if (!APPLY) { console.log(line); continue; }
  // Filet : une photo encore présente à ce stade part avec la fiche, sinon
  // elle deviendrait un orphelin que plus rien ne référence.
  const path = it.image_url ? String(it.image_url).split(`/object/public/${BUCKET}/`)[1] : null;
  if (path) {
    await fetch(`${URL_}/storage/v1/object/${BUCKET}/${encodeURI(decodeURIComponent(path))}`, {
      method: "DELETE", headers: H,
    }).catch(() => {});
  }
  // Les rapprochements pointent sur la fiche : ils partent d'abord.
  await rest(`org_matches?found_item_id=eq.${encodeURIComponent(it.id)}`, {
    method: "DELETE", headers: { Prefer: "return=minimal" },
  }).catch(() => {});
  await rest(`org_item_events?item_id=eq.${encodeURIComponent(it.id)}`, {
    method: "DELETE", headers: { Prefer: "return=minimal" },
  }).catch(() => {});
  await rest(`found_items?id=eq.${encodeURIComponent(it.id)}`, {
    method: "DELETE", headers: { Prefer: "return=minimal" },
  });
  recOk++;
  console.log(`${line}  ✅`);
}

console.log(
  APPLY
    ? `\n✅ ${photoOk} photo(s) supprimée(s), ${recOk} fiche(s) supprimée(s).`
    : `\n👉 Rien n'a été supprimé. Relance avec --apply.`
);
