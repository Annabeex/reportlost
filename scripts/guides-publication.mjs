// scripts/guides-publication.mjs
//
// Quand les guides ville ont-ils été écrits, et dans quel état sont-ils ?
// À croiser avec la courbe d'impressions de Search Console : si les impressions
// montent plusieurs semaines après une vague de publication, l'indexation
// progresse toute seule et il suffit d'attendre. Si elles stagnent, c'est que
// Google voit les pages et ne les juge pas dignes d'être montrées.
//
//   node scripts/guides-publication.mjs
import fs from "node:fs";

const env = Object.fromEntries(
  fs.readFileSync(fs.existsSync(".env.local") ? ".env.local" : ".env", "utf8")
    .split("\n").filter((l) => l.includes("=") && !l.trim().startsWith("#"))
    .map((l) => { const i = l.indexOf("="); return [l.slice(0, i).trim(), l.slice(i + 1).trim().replace(/^["']|["']$/g, "")]; })
);
const URL_ = env.SUPABASE_URL || env.NEXT_PUBLIC_SUPABASE_URL;
const KEY = env.SUPABASE_SERVICE_ROLE_KEY;
if (!URL_ || !KEY) { console.error("❌ identifiants Supabase introuvables"); process.exit(1); }

const H = { apikey: KEY, Authorization: `Bearer ${KEY}`, Accept: "application/json" };

async function all(select) {
  const out = [];
  for (let off = 0; ; off += 1000) {
    const r = await fetch(`${URL_}/rest/v1/city_guides?${select}&order=id.asc&limit=1000&offset=${off}`, { headers: H });
    if (!r.ok) { console.error(`❌ ${r.status} ${await r.text()}`); process.exit(1); }
    const page = await r.json();
    out.push(...page);
    if (page.length < 1000) break;
  }
  return out;
}

// On ne demande que les colonnes sûres, puis on regarde ce qui existe vraiment.
const rows = await all("select=*");
if (!rows.length) { console.log("Aucun guide."); process.exit(0); }
const cols = Object.keys(rows[0]);
console.log(`${rows.length} guides · colonnes disponibles :\n  ${cols.join(", ")}\n`);

const byStatus = {};
for (const r of rows) byStatus[r.status ?? "(null)"] = (byStatus[r.status ?? "(null)"] || 0) + 1;
console.log("PAR STATUT");
for (const [k, v] of Object.entries(byStatus).sort((a, b) => b[1] - a[1])) {
  console.log(`  ${String(k).padEnd(16)} ${String(v).padStart(6)}`);
}

const dateCol = ["published_at", "created_at", "updated_at"].find((c) => cols.includes(c));
if (!dateCol) { console.log("\nAucune colonne de date, impossible de dater les vagues."); process.exit(0); }

console.log(`\nPUBLICATION PAR MOIS (d'après ${dateCol})\n`);
const byMonth = new Map();
for (const r of rows) {
  const d = r[dateCol];
  if (!d) continue;
  const m = String(d).slice(0, 7);
  if (!byMonth.has(m)) byMonth.set(m, { total: 0, published: 0 });
  const b = byMonth.get(m);
  b.total++;
  if (r.status === "published") b.published++;
}
let cum = 0;
console.log("mois        écrits   publiés   cumul publiés");
console.log("-".repeat(50));
for (const m of [...byMonth.keys()].sort()) {
  const b = byMonth.get(m);
  cum += b.published;
  console.log(`${m.padEnd(11)} ${String(b.total).padStart(6)}  ${String(b.published).padStart(8)}  ${String(cum).padStart(13)}`);
}

// Une mise à jour récente relance l'exploration : utile à savoir.
if (cols.includes("updated_at") && dateCol !== "updated_at") {
  const upd = new Map();
  for (const r of rows) if (r.updated_at) {
    const m = String(r.updated_at).slice(0, 7);
    upd.set(m, (upd.get(m) || 0) + 1);
  }
  console.log("\nDERNIÈRE MODIFICATION PAR MOIS");
  for (const m of [...upd.keys()].sort()) console.log(`  ${m}  ${String(upd.get(m)).padStart(6)}`);
}
