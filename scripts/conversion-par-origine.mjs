// scripts/conversion-par-origine.mjs
//
// Taux de conversion selon la page d'où vient le dépôt.
//
// Deux sources, et il faut savoir laquelle on lit :
//   station_slug  → renseigné depuis toujours, QR des commissariats uniquement
//   source_page   → ajouté le 18/09/2026, couvre toutes les pages du site
// Les dossiers antérieurs n'ont pas de source_page : ils sont comptés à part,
// sous « avant la mesure », et jamais fondus dans les autres lignes.
//
//   node scripts/conversion-par-origine.mjs
//   node scripts/conversion-par-origine.mjs --span=120 --min=5
import fs from "node:fs";

const env = Object.fromEntries(
  fs.readFileSync(fs.existsSync(".env.local") ? ".env.local" : ".env", "utf8")
    .split("\n").filter((l) => l.includes("=") && !l.trim().startsWith("#"))
    .map((l) => { const i = l.indexOf("="); return [l.slice(0, i).trim(), l.slice(i + 1).trim().replace(/^["']|["']$/g, "")]; })
);
const URL_ = env.SUPABASE_URL || env.NEXT_PUBLIC_SUPABASE_URL;
const KEY = env.SUPABASE_SERVICE_ROLE_KEY;
if (!URL_ || !KEY) { console.error("❌ identifiants Supabase introuvables"); process.exit(1); }

const arg = (n, d) => Number((process.argv.find((a) => a.startsWith(`--${n}=`)) || "").split("=")[1] || d);
const SPAN = arg("span", 180);
const MIN = arg("min", 3);
const from = new Date(Date.now() - SPAN * 86400000).toISOString();

const rows = [];
for (let off = 0; ; off += 1000) {
  const qs = new URLSearchParams({
    select: "created_at,paid,contribution,station_slug,source_page",
    created_at: `gte.${from}`,
    order: "created_at.asc",
    limit: "1000",
    offset: String(off),
  });
  const r = await fetch(`${URL_}/rest/v1/lost_items?${qs}`, {
    headers: { apikey: KEY, Authorization: `Bearer ${KEY}`, Accept: "application/json" },
  });
  if (!r.ok) {
    const t = await r.text();
    if (/source_page/.test(t)) {
      console.error("❌ La colonne source_page n'existe pas encore. Exécute source-page.sql dans Supabase.");
      process.exit(1);
    }
    console.error(`❌ ${r.status} ${t}`); process.exit(1);
  }
  const page = await r.json();
  rows.push(...page);
  if (page.length < 1000) break;
}

// Familles de pages : « /lost-and-found/ga/sandy-springs » et les 7000 autres
// ne s'analysent pas une par une. On regroupe, on détaille seulement si besoin.
function family(src) {
  const s = String(src || "");
  if (!s) return "— avant la mesure";
  if (s === "direct") return "direct / hors referrer";
  if (s.startsWith("ext:")) return s;
  if (s === "/" ) return "accueil";
  if (s.startsWith("/lost-and-found/category")) return "page catégorie";
  if (/^\/lost-and-found\/[a-z]{2}\//i.test(s)) return "page ville";
  if (s.startsWith("/lost-and-found")) return "page État";
  if (s.startsWith("/universities")) return "page université";
  if (s.startsWith("/lost/")) return "annonce publique";
  if (s.startsWith("/o/") || /^\/(campus|org|at)\/[^/]+/.test(s)) return "page établissement";
  return s;
}

const groups = new Map();
const add = (k, r) => {
  if (!groups.has(k)) groups.set(k, { n: 0, paid: 0, revenue: 0 });
  const g = groups.get(k);
  g.n++;
  if (r.paid) { g.paid++; g.revenue += Number(r.contribution || 0); }
};

for (const r of rows) add(r.station_slug ? "QR commissariat" : family(r.source_page), r);

const measured = rows.filter((r) => r.source_page).length;
console.log(`${rows.length} dépôts sur ${SPAN} jours · ${measured} avec une provenance enregistrée\n`);

if (!measured) {
  console.log("Aucun dépôt ne porte encore de provenance : la colonne vient d'être créée.");
  console.log("Reviens dans quelques jours, le temps que des dépôts arrivent.\n");
}

console.log(`origine                        dépôts   payés    taux   recette   $/dépôt`);
console.log("-".repeat(70));
const sorted = [...groups.entries()].sort((a, b) => b[1].n - a[1].n);
for (const [k, g] of sorted) {
  const rate = g.n ? `${((g.paid / g.n) * 100).toFixed(1)}%` : "—";
  const per = g.n ? (g.revenue / g.n).toFixed(2) : "0.00";
  const flag = g.n < MIN ? "  ⚠ trop peu" : "";
  console.log(
    `${k.slice(0, 28).padEnd(30)} ${String(g.n).padStart(5)}   ${String(g.paid).padStart(5)}  ${rate.padStart(6)}` +
    `  ${`$${g.revenue}`.padStart(7)}   ${`$${per}`.padStart(7)}${flag}`
  );
}
console.log("-".repeat(70));
console.log(`\n⚠ = moins de ${MIN} dépôts : la ligne ne veut rien dire, elle est là pour l'inventaire.`);
console.log(`Le chiffre qui compte est $/dépôt, pas le taux : un trafic qui convertit moins`);
console.log(`mais plus cher vaut mieux qu'un trafic qui convertit plus à 12 $.`);
