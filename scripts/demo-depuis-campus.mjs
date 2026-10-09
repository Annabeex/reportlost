// scripts/demo-depuis-campus.mjs
//
// Recopie l'inventaire de la démo universités vers la démo commissariat
// (demo-police) : on REPREND LES PHOTOS, on ADAPTE LE DÉCOR.
//
// Les photos, les titres et les descriptions viennent de la source — ce sont
// de vraies images, c'est ce qui rend la démonstration crédible. En revanche
// les lieux sont réécrits : un objet trouvé « à la bibliothèque » ou « en
// résidence universitaire » sur l'écran d'un commissariat se repère tout de
// suite, et décrédibilise le reste.
//
// Pourquoi un script et pas du SQL : les photos ne sont pas dans la base. Elles
// vivent dans le bucket privé « org-private », sous org_items/<org>/<uuid>.jpg,
// et la base ne stocke qu'une référence. Copier la référence telle quelle
// ferait afficher à la démo les fichiers d'un AUTRE établissement : les deux
// partageraient le même objet de stockage, et le jour où la source supprime une
// fiche, la photo disparaît aussi de la démo. On copie donc les FICHIERS dans
// l'espace de la démo, qui devient propriétaire des siens.
//
//   node scripts/demo-depuis-campus.mjs --list
//   node scripts/demo-depuis-campus.mjs --from=SLUG              → simulation
//   node scripts/demo-depuis-campus.mjs --from=SLUG --go         → remplace tout
//   node scripts/demo-depuis-campus.mjs --from=SLUG --attach --go → garde les
//        objets de la destination et ne leur pose QUE les photos de la source,
//        appariées par catégorie. À préférer quand la destination a déjà un
//        inventaire mieux fourni que la source.
//
// Par défaut la destination est demo-police (--to=<slug> pour changer).
// Relançable : la destination est vidée avant chaque copie.

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

const { createClient } = await import("@supabase/supabase-js");
const sb = createClient(URL_, KEY, { auth: { persistSession: false } });

const arg = (n, d) => (process.argv.find((a) => a.startsWith(`--${n}=`)) || "").split("=")[1] || d;
const GO = process.argv.includes("--go");
const LIST = process.argv.includes("--list");
const ATTACH = process.argv.includes("--attach");
const AJOUTER = process.argv.includes("--ajouter");
const SRC = arg("from", "");
const DST = arg("to", "demo-police");

const BUCKET = "org-private";
const PREFIX = "private:";
const estRef = (v) => typeof v === "string" && v.startsWith(PREFIX);
const chemin = (ref) => ref.slice(PREFIX.length);

// Garde légale appliquée à la démo : 90 jours, la valeur par défaut de
// lib/legalHolding.ts pour un service de police sans règle d'État vérifiée.
const GARDE_JOURS = 90;

// Décor d'un commissariat : voirie, parcs, transports, comptoir d'accueil.
// Attribués en boucle, dans l'ordre, pour que la liste reste variée.
const LIEUX = [
  "Main St & 3rd Ave — handed in by a passer-by",
  "Riverside Park, near the playground",
  "Center St bus stop",
  "Handed in at the front desk",
  "City Hall parking garage, level 2",
  "Public library entrance",
  "Traffic stop, Highway 17 southbound",
  "Sidewalk, 200 block of Main St",
  "Bus terminal, gate 3",
  "Riverside Park bike path",
  "Handed in by a patrol unit",
  "Municipal pool parking lot",
];
const RANGEMENTS = [
  "Property room · shelf A2",
  "Property room · shelf B1",
  "Property room · safe",
  "Property room · drawer 1",
  "Property room · drawer 2",
  "Garage · rack 3",
];
const plusJours = (iso, n) => {
  const d = new Date(`${String(iso).slice(0, 10)}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
};

// ── Inventaire des établissements ─────────────────────────────────────────
if (LIST || !SRC) {
  const { data: orgs } = await sb
    .from("organizations")
    .select("id, slug, name, type, city, verified")
    .order("name");
  console.log("\nÉtablissements et contenu :\n");
  for (const o of orgs || []) {
    const { count: objets } = await sb.from("found_items")
      .select("id", { count: "exact", head: true }).eq("org_id", o.id);
    const { data: avecPhoto } = await sb.from("found_items")
      .select("image_url").eq("org_id", o.id).not("image_url", "is", null).limit(500);
    const privees = (avecPhoto || []).filter((r) => estRef(r.image_url)).length;
    // Anciennes photos : adresse publique du bucket « images », avant migration.
    const heritees = (avecPhoto || []).filter((r) => !estRef(r.image_url) && String(r.image_url || "").startsWith("http")).length;
    const photos = privees + heritees;
    const { count: intakes } = await sb.from("org_intakes")
      .select("id", { count: "exact", head: true }).eq("org_id", o.id);
    console.log(
      `  ${String(o.slug).padEnd(26)} ${String(o.type).padEnd(11)} ` +
      `${String(objets || 0).padStart(4)} objets · ${String(photos).padStart(3)} photos` +
      `${heritees ? ` (dont ${heritees} anciennes)` : ""}` + ` · ` +
      `${String(intakes || 0).padStart(3)} dépôts   ${o.name}`
    );
  }
  console.log("\nPuis : node scripts/demo-depuis-campus.mjs --from=<slug> [--go]\n");
  process.exit(0);
}

// ── Source et destination ─────────────────────────────────────────────────
const prendre = async (slug) => {
  const { data } = await sb.from("organizations").select("*").eq("slug", slug).maybeSingle();
  if (!data) { console.error(`❌ établissement introuvable : ${slug}`); process.exit(1); }
  return data;
};
const src = await prendre(SRC);
const dst = await prendre(DST);
if (src.id === dst.id) { console.error("❌ source et destination identiques"); process.exit(1); }

const { data: items } = await sb.from("found_items")
  .select("*").eq("org_id", src.id).order("date", { ascending: false }).limit(60);
const { data: intakes } = await sb.from("org_intakes")
  .select("*").eq("org_id", src.id).order("found_at", { ascending: false }).limit(20);

const photos = (items || []).filter((i) => estRef(i.image_url)).length;

console.log(`\nSource      : ${src.name} (${src.slug}, ${src.type})`);
console.log(`Destination : ${dst.name} (${dst.slug}, ${dst.type})`);
console.log(`À copier    : ${items?.length || 0} objets dont ${photos} avec photo, ${intakes?.length || 0} dépôts\n`);
for (const it of (items || []).slice(0, 12)) {
  console.log(`  ${estRef(it.image_url) ? "📷" : "  "} ${String(it.public_label || "").padEnd(22)} ${it.title}`);
}
if ((items?.length || 0) > 12) console.log(`  … et ${items.length - 12} de plus`);

if (!GO) {
  console.log("\n(simulation — relancer avec --go pour écrire)\n");
  process.exit(0);
}

const copierPhoto = async (ref) => {
  let blob = null, source = "";
  if (estRef(ref)) {
    source = chemin(ref);
    const r = await sb.storage.from(BUCKET).download(source);
    blob = r.data;
    if (r.error || !blob) { console.warn(`   ⚠ photo illisible, ignorée : ${source}`); return null; }
  } else if (String(ref || "").startsWith("http")) {
    // Ancienne photo publique : on la rapatrie dans le bucket privé.
    source = String(ref);
    const r = await fetch(source).catch(() => null);
    if (!r || !r.ok) { console.warn(`   ⚠ photo inaccessible, ignorée : ${source.slice(0, 70)}`); return null; }
    blob = await r.blob();
  } else {
    return null;
  }
  const ext = ((source.split("?")[0]).match(/\.(\w+)$/) || [, "jpg"])[1].toLowerCase();
  const mime = ext === "png" ? "image/png" : ext === "webp" ? "image/webp" : "image/jpeg";
  const cible = `org_items/${dst.id}/${randomUUID()}.${ext}`;
  const buf = Buffer.from(await blob.arrayBuffer());
  const { error: e2 } = await sb.storage.from(BUCKET).upload(cible, buf, { contentType: mime, upsert: false });
  if (e2) { console.warn(`   ⚠ copie refusée : ${e2.message}`); return null; }
  return `${PREFIX}${cible}`;
};

// ── Mode --ajouter : on complète l'inventaire avec les objets photographiés ─
if (AJOUTER) {
  const avecPhoto = (items || []).filter(
    (i) => estRef(i.image_url) || String(i.image_url || "").startsWith("http")
  );
  const { data: cibles } = await sb.from("found_items")
    .select("id").eq("org_id", dst.id);
  const dejaLa = (cibles || []).length;

  console.log(`Objets photographiés dans la source : ${avecPhoto.length}`);
  console.log(`Déjà présents dans la destination   : ${dejaLa}`);
  console.log(`Après ajout                         : ${dejaLa + avecPhoto.length}\n`);
  for (const i of avecPhoto) {
    console.log(`  📷 ${String(i.public_label || "?").padEnd(20)} ${i.title}`);
  }

  if (!GO) { console.log("\n(simulation — relancer avec --ajouter --go pour écrire)\n"); process.exit(0); }

  // Le compteur de références repart du plus grand numéro déjà émis.
  const { data: org } = await sb.from("organizations").select("ref_seq").eq("id", dst.id).maybeSingle();
  let seq = Number(org?.ref_seq || dejaLa);

  let k = 0, lieu = 0;
  for (const it of avecPhoto.slice().reverse()) {
    const ref = await copierPhoto(it.image_url);
    seq += 1;
    const { error } = await sb.from("found_items").insert({
      org_id: dst.id,
      org_ref: `F-${String(seq).padStart(4, "0")}`,
      title: it.title,
      description: it.description,
      image_url: ref,
      date: it.date,
      city: dst.city,
      // Décor réécrit : le titre, la description et la photo restent ceux de
      // la source, c'est leur cohérence qui fait la crédibilité de la démo.
      dropoff_location: LIEUX[(lieu) % LIEUX.length],
      storage_location: RANGEMENTS[(lieu++) % RANGEMENTS.length],
      status: "stored",
      legal_deadline: plusJours(it.date || new Date().toISOString(), GARDE_JOURS),
      public_visible: it.public_visible !== false,
      public_label: it.public_label,
      labels: it.labels, logos: it.logos, objects: it.objects, ocr_text: it.ocr_text,
    });
    if (error) console.warn(`   ⚠ ${it.title} : ${error.message}`);
    else k++;
  }
  await sb.from("organizations").update({ ref_seq: seq }).eq("id", dst.id);

  console.log(`\n✅ ${k} objets photographiés ajoutés à ${dst.name}.`);
  console.log(`   https://reportlost.org/lost-property/demo\n`);
  process.exit(0);
}

// ── Mode --attach : on ne pose que les photos ─────────────────────────────
// La destination garde ses objets, ses libellés et ses lieux. On apparie
// d'abord par catégorie publique (une photo de sac va sur le sac), puis, pour
// ce qui reste, dans l'ordre. Une démo où la photo ne correspond pas à la
// ligne est pire qu'une démo sans photo.
if (ATTACH) {
  const sources = (items || []).filter((i) => estRef(i.image_url) || String(i.image_url || "").startsWith("http"));
  const { data: cibles } = await sb.from("found_items")
    .select("id, org_ref, title, public_label, image_url")
    .eq("org_id", dst.id).order("org_ref");
  const libres = (cibles || []).filter((c) => !c.image_url);

  const paires = [];
  const pris = new Set();
  const cle = (v) => String(v || "").trim().toLowerCase();
  for (const src_ of sources) {
    const exact = libres.find((c) => !pris.has(c.id) && cle(c.public_label) === cle(src_.public_label));
    if (exact) { pris.add(exact.id); paires.push([src_, exact]); }
  }
  for (const src_ of sources) {
    if (paires.some(([a]) => a.id === src_.id)) continue;
    const suivant = libres.find((c) => !pris.has(c.id));
    if (!suivant) break;
    pris.add(suivant.id);
    paires.push([src_, suivant]);
  }

  console.log("Appariement :\n");
  for (const [a, b] of paires) {
    const exact = cle(a.public_label) === cle(b.public_label) ? "=" : "~";
    console.log(`  ${exact} ${String(a.public_label || "?").padEnd(20)} ${String(a.title).slice(0, 34).padEnd(36)} → ${b.org_ref}  ${b.title}`);
  }
  if (!paires.length) console.log("  (aucune photo à poser)");
  console.log(`\n  « = » même catégorie, « ~ » appariement par défaut.`);

  if (!GO) { console.log("\n(simulation — relancer avec --attach --go pour écrire)\n"); process.exit(0); }

  let k = 0;
  for (const [a, b] of paires) {
    const ref = await copierPhoto(a.image_url);
    if (!ref) continue;
    const { error } = await sb.from("found_items").update({ image_url: ref }).eq("id", b.id);
    if (error) console.warn(`   ⚠ ${b.org_ref} : ${error.message}`);
    else k++;
  }
  console.log(`\n✅ ${k} photos posées sur l'inventaire de ${dst.name}, textes inchangés.`);
  console.log(`   https://reportlost.org/lost-property/demo\n`);
  process.exit(0);
}

// ── Remise à zéro de la destination ───────────────────────────────────────
// On supprime aussi les FICHIERS de la destination : sinon chaque passage
// laisse derrière lui un jeu de photos orphelines dans le bucket.
const { data: anciens } = await sb.from("found_items")
  .select("image_url").eq("org_id", dst.id);
const aEffacer = (anciens || []).map((r) => r.image_url).filter(estRef).map(chemin);
if (aEffacer.length) await sb.storage.from(BUCKET).remove(aEffacer);

await sb.from("org_item_events").delete().eq("org_id", dst.id);
await sb.from("found_items").delete().eq("org_id", dst.id);
await sb.from("org_intakes").delete().eq("org_id", dst.id);
await sb.from("organizations").update({ ref_seq: 0 }).eq("id", dst.id);

// ── Copie ─────────────────────────────────────────────────────────────────

let n = 0, nPhotos = 0;
for (const it of (items || []).slice().reverse()) {
  const ref = await copierPhoto(it.image_url);
  if (ref) nPhotos++;
  n++;
  const { error } = await sb.from("found_items").insert({
    org_id: dst.id,
    org_ref: `F-${String(n).padStart(4, "0")}`,
    title: it.title,
    description: it.description,
    image_url: ref,
    date: it.date,
    city: dst.city,
    // Décor réécrit : le reste (photo, titre, description) vient de la source.
    dropoff_location: LIEUX[(n - 1) % LIEUX.length],
    storage_location: RANGEMENTS[(n - 1) % RANGEMENTS.length],
    status: it.status === "returned" || it.status === "disposed" ? "stored" : it.status,
    legal_deadline: plusJours(it.date || new Date().toISOString(), GARDE_JOURS),
    public_visible: it.public_visible !== false,
    public_label: it.public_label,
    labels: it.labels, logos: it.logos, objects: it.objects, ocr_text: it.ocr_text,
  });
  if (error) console.warn(`   ⚠ ${it.title} : ${error.message}`);
}
await sb.from("organizations").update({ ref_seq: n }).eq("id", dst.id);

let m = 0, m_lieu = 3;
for (const i of (intakes || []).slice().reverse()) {
  const ref = await copierPhoto(i.photo_url);
  const { error } = await sb.from("org_intakes").insert({
    org_id: dst.id,
    code: i.code,
    title: i.title,
    description: i.description,
    found_location: LIEUX[(m_lieu++) % LIEUX.length],
    found_at: i.found_at,
    photo_url: ref,
    finder_name: i.finder_name,
    finder_email: i.finder_email,
    held_by: i.held_by || "desk",
    status: "pending",
    public_visible: i.public_visible === true,
    public_label: i.public_label,
  });
  if (!error) m++; else console.warn(`   ⚠ dépôt ${i.code} : ${error.message}`);
}

console.log(`\n✅ ${n} objets copiés (${nPhotos} photos), ${m} dépôts.`);
console.log(`   Photos, titres et descriptions repris de ${src.name}.`);
console.log(`   Lieux et rangements réécrits pour un commissariat.`);
console.log(`   https://reportlost.org/lost-property/${dst.slug}`);
console.log(`   https://reportlost.org/lost-property/demo\n`);
