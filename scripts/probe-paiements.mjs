// scripts/probe-paiements.mjs
// Relevé brut des paiements sur la période : combien, quand, à quel montant,
// et combien de temps après le dépôt. Aucune interprétation, juste les faits.
//   node scripts/probe-paiements.mjs --span=30
import fs from "node:fs";

const env = Object.fromEntries(
  fs.readFileSync(fs.existsSync(".env.local") ? ".env.local" : ".env", "utf8")
    .split("\n").filter((l) => l.includes("=") && !l.trim().startsWith("#"))
    .map((l) => { const i = l.indexOf("="); return [l.slice(0, i).trim(), l.slice(i + 1).trim().replace(/^["']|["']$/g, "")]; })
);
const URL_ = env.SUPABASE_URL || env.NEXT_PUBLIC_SUPABASE_URL;
const KEY = env.SUPABASE_SERVICE_ROLE_KEY;
const SPAN = Number((process.argv.find((a) => a.startsWith("--span=")) || "").split("=")[1] || 30);
const from = new Date(Date.now() - SPAN * 86400000).toISOString();

const get = async (qs) => {
  const r = await fetch(`${URL_}/rest/v1/lost_items?${qs}`, {
    headers: { apikey: KEY, Authorization: `Bearer ${KEY}`, Accept: "application/json", Prefer: "count=exact" },
  });
  if (!r.ok) { console.error(`❌ ${r.status} ${await r.text()}`); process.exit(1); }
  return { rows: await r.json(), count: Number((r.headers.get("content-range") || "/0").split("/")[1]) };
};

const all = await get(`select=id,public_id,created_at,paid,paid_at,contribution&created_at=gte.${from}&order=created_at.asc&limit=2000`);
const rows = all.rows;

const paidTrue = rows.filter((r) => r.paid === true);
const withPaidAt = paidTrue.filter((r) => r.paid_at);
const contrib = rows.filter((r) => Number(r.contribution || 0) > 0);

console.log(`Période : ${SPAN} derniers jours`);
console.log(`Dépôts                    : ${rows.length}`);
console.log(`paid = true               : ${paidTrue.length}`);
console.log(`  dont paid_at renseigné  : ${withPaidAt.length}`);
console.log(`contribution > 0          : ${contrib.length}`);

// Un paiement peut exister sans que paid soit passé à true (webhook manqué).
const orphan = contrib.filter((r) => r.paid !== true);
if (orphan.length) console.log(`⚠️ contribution > 0 mais paid ≠ true : ${orphan.length}`);

console.log(`\nDétail des paiements :`);
if (!paidTrue.length) console.log("  aucun.");
for (const r of paidTrue.sort((a, b) => String(a.paid_at).localeCompare(String(b.paid_at)))) {
  const mins = r.paid_at
    ? (new Date(r.paid_at).getTime() - new Date(r.created_at).getTime()) / 60000
    : null;
  const delay =
    mins === null ? "paid_at absent"
    : mins < 60 ? `${Math.round(mins)} min après le dépôt`
    : mins < 48 * 60 ? `${(mins / 60).toFixed(1)} h après`
    : `${(mins / 1440).toFixed(1)} jours après`;
  console.log(
    `  #${String(r.public_id || "").padEnd(6)} déposé ${String(r.created_at).slice(0, 16).replace("T", " ")}` +
    `  ·  $${r.contribution ?? "?"}  ·  ${delay}`
  );
}
