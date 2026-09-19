// scripts/entonnoir-par-semaine.mjs
//
// L'entonnoir du formulaire, semaine par semaine, pour voir l'effet d'un
// changement daté. Le taux qui compte est étape 1 / ouverture : c'est là que
// se perdent près de neuf visiteurs sur dix.
//
//   node scripts/entonnoir-par-semaine.mjs --span=120
import fs from "node:fs";

const env = Object.fromEntries(
  fs.readFileSync(fs.existsSync(".env.local") ? ".env.local" : ".env", "utf8")
    .split("\n").filter((l) => l.includes("=") && !l.trim().startsWith("#"))
    .map((l) => { const i = l.indexOf("="); return [l.slice(0, i).trim(), l.slice(i + 1).trim().replace(/^["']|["']$/g, "")]; })
);
const URL_ = env.SUPABASE_URL || env.NEXT_PUBLIC_SUPABASE_URL;
const KEY = env.SUPABASE_SERVICE_ROLE_KEY;
const SPAN = Number((process.argv.find((a) => a.startsWith("--span=")) || "").split("=")[1] || 120);
const from = new Date(Date.now() - SPAN * 86400000).toISOString();

const rows = [];
for (let off = 0; ; off += 1000) {
  const r = await fetch(
    `${URL_}/rest/v1/events?select=event,created_at&created_at=gte.${from}&order=created_at.asc&limit=1000&offset=${off}`,
    { headers: { apikey: KEY, Authorization: `Bearer ${KEY}`, Accept: "application/json" } }
  );
  if (!r.ok) { console.error(`❌ ${r.status} ${await r.text()}`); process.exit(1); }
  const page = await r.json();
  rows.push(...page);
  if (page.length < 1000) break;
}

function weekKey(iso) {
  const d = new Date(String(iso).slice(0, 10) + "T00:00:00Z");
  d.setUTCDate(d.getUTCDate() - ((d.getUTCDay() + 6) % 7));
  return d.toISOString().slice(0, 10);
}

const W = new Map();
for (const e of rows) {
  const k = weekKey(e.created_at);
  if (!W.has(k)) W.set(k, {});
  W.get(k)[e.event] = (W.get(k)[e.event] || 0) + 1;
}

// Repères datés, pour lire les ruptures sans avoir à s'en souvenir.
const MARKS = {
  "2026-09-14": "bandeau sur les pages annonces",
  "2026-09-15": "ecran gratuit ambre",
  "2026-09-19": "trois formules",
};

console.log("semaine       ouvertures   étape 1    %      étape 2   formules   gratuit validé");
console.log("-".repeat(86));
for (const k of [...W.keys()].sort()) {
  const b = W.get(k);
  const v = b.form_view || 0;
  const s1 = b.form_step1_done || 0;
  const rate = v ? ((s1 / v) * 100).toFixed(1) + " %" : "—";
  const mark = Object.entries(MARKS).find(([d]) => weekKey(d) === k);
  console.log(
    k.padEnd(13) +
      String(v).padStart(10) +
      String(s1).padStart(10) +
      rate.padStart(8) +
      String(b.form_step2_done || 0).padStart(10) +
      String(b.form_contribution_view || 0).padStart(11) +
      String(b.form_completed_free || 0).padStart(16) +
      (mark ? `   ← ${mark[1]}` : "")
  );
}
console.log(
  "\n⚠️ « ouvertures » compte les arrivées sur /report, pas les visites des pages\n" +
  "   annonces ou villes. Une hausse du taux étape 1 signifie que les gens qui\n" +
  "   arrivent sont mieux préparés ; une hausse des ouvertures signifie que les\n" +
  "   pages envoient plus de monde."
);
