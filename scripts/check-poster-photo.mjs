// scripts/check-poster-photo.mjs
//
// Pourquoi la photo d'un dossier n'apparaît pas sur le poster /api/poster/<id>.
//
// Le générateur (next/og = satori + resvg) ne sait décoder que PNG, JPEG et GIF.
// Une image WebP, AVIF ou HEIC — ou une URL qui répond autre chose qu'une image —
// laisse un rectangle vide de la taille du bloc photo, sans erreur.
//
//   node scripts/check-poster-photo.mjs 96698
//   node scripts/check-poster-photo.mjs            → les 20 derniers dossiers avec photo

import fs from "node:fs";

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

const arg = process.argv[2];

const rest = async (qs) => {
  const r = await fetch(`${URL_}/rest/v1/lost_items?${qs}`, {
    headers: { apikey: KEY, Authorization: `Bearer ${KEY}`, Accept: "application/json" },
  });
  if (!r.ok) throw new Error(`${r.status} ${await r.text()}`);
  return r.json();
};

// Signature binaire : le Content-Type annoncé par le serveur peut mentir
// (octet-stream sur un vrai JPEG), les premiers octets non.
function sniff(bytes) {
  const b = new Uint8Array(bytes);
  const at = (i, ...sig) => sig.every((v, k) => b[i + k] === v);
  if (at(0, 0x89, 0x50, 0x4e, 0x47)) return "png";
  if (at(0, 0xff, 0xd8, 0xff)) return "jpeg";
  if (at(0, 0x47, 0x49, 0x46, 0x38)) return "gif";
  if (at(0, 0x52, 0x49, 0x46, 0x46) && at(8, 0x57, 0x45, 0x42, 0x50)) return "webp";
  if (at(4, 0x66, 0x74, 0x79, 0x70)) {
    const brand = String.fromCharCode(b[8], b[9], b[10], b[11]);
    if (brand.startsWith("avi")) return "avif";
    if (brand.startsWith("hei") || brand.startsWith("mif")) return "heic";
    return `iso/${brand}`;
  }
  const head = new TextDecoder().decode(b.slice(0, 300)).trim();
  if (head.startsWith("<svg") || head.includes("<svg")) return "svg";
  if (head.startsWith("{") || head.startsWith("[")) return "json (pas une image)";
  return "inconnu";
}

const OK = new Set(["png", "jpeg", "gif"]);

async function inspect(row) {
  const src = row.object_photo;
  const tag = `#${row.public_id}  ${String(row.title || "").slice(0, 40)}`;
  if (!src) {
    console.log(`—  ${tag}\n   pas de photo en base\n`);
    return;
  }
  let line = `   ${src}\n`;
  try {
    const r = await fetch(src);
    const ct = r.headers.get("content-type") || "?";
    if (!r.ok) {
      console.log(`❌ ${tag}\n${line}   HTTP ${r.status} · ${ct}\n`);
      return;
    }
    const buf = await r.arrayBuffer();
    const real = sniff(buf);
    const kb = Math.round(buf.byteLength / 1024);
    const verdict = OK.has(real)
      ? "✅ lisible par le générateur"
      : `❌ ${real.toUpperCase()} : satori ne sait pas le décoder → rectangle vide`;
    console.log(`${OK.has(real) ? "✅" : "❌"} ${tag}\n${line}   ${kb} Ko · annoncé ${ct} · réel ${real}\n   ${verdict}\n`);
  } catch (e) {
    console.log(`❌ ${tag}\n${line}   fetch impossible : ${e.message}\n`);
  }
}

if (arg) {
  const col = /^\d{5}$/.test(arg) ? "public_id" : "id";
  const rows = await rest(
    `select=id,public_id,title,object_photo&${col}=eq.${encodeURIComponent(arg)}&limit=1`
  );
  if (!rows.length) {
    console.error(`Dossier ${arg} introuvable.`);
    process.exit(1);
  }
  await inspect(rows[0]);
} else {
  const rows = await rest(
    "select=id,public_id,title,object_photo&object_photo=not.is.null&order=created_at.desc&limit=20"
  );
  console.log(`${rows.length} dossier(s) récent(s) avec photo :\n`);
  for (const row of rows) await inspect(row);
}
