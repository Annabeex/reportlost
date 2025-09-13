#!/usr/bin/env tsx
/* eslint-disable @typescript-eslint/no-var-requires */

// 1) Charger les variables d'env AVANT tout import Supabase
const { config } = require("dotenv");
const { existsSync } = require("node:fs");
const path = require("node:path");

// on privilégie .env.local, sinon .env
const envLocal = path.resolve(process.cwd(), ".env.local");
const envDefault = path.resolve(process.cwd(), ".env");
if (existsSync(envLocal)) {
  config({ path: envLocal });
  console.log("🔐 Variables Supabase chargées (.env.local).");
} else if (existsSync(envDefault)) {
  config({ path: envDefault });
  console.log("🔐 Variables Supabase chargées (.env).");
} else {
  console.warn("⚠️ Aucun fichier .env(.local) trouvé, on tente process.env.");
}
if (!process.env.SUPABASE_URL || !process.env.SUPABASE_ANON_KEY) {
  console.error("❌ SUPABASE_URL ou SUPABASE_ANON_KEY manquants. Ajoute-les dans .env.local ou .env");
  process.exit(1);
}

// 2) Imports/require après config
const { access, mkdir, writeFile } = require("node:fs/promises");
const { resolve, join, dirname } = require("node:path");
const states = require("../lib/states").default;
const { getPopularCitiesByState } = require("../lib/getPopularCitiesByState");

// --- Types
type ByState = Record<string, string[]>;

// --- Helpers
function cityToSlug(name: string) {
  return String(name).toLowerCase().replace(/\s+/g, "-");
}

async function fileExists(p: string) {
  try {
    await access(p);
    return true;
  } catch {
    return false;
  }
}

// --- Main
async function main() {
  const byState: ByState = {};
  const flatSet = new Set<string>();

  const projectRoot = resolve(".");
  const imagesDir = join(projectRoot, "public", "images", "cities");

  // Option CLI: --state=CA
  const argState = process.argv.find((a) => a.startsWith("--state="));
  const filterAbbr = argState ? argState.split("=")[1].toUpperCase() : null;

  const statesToProcess = filterAbbr
    ? states.filter((s: any) => s.code === filterAbbr)
    : states;

  if (filterAbbr && statesToProcess.length === 0) {
    console.error(`❌ État ${filterAbbr} introuvable dans lib/states`);
    process.exit(1);
  }

  for (const st of statesToProcess) {
    const abbr: string = st.code; // ex: "WA"
    try {
      const cities = await getPopularCitiesByState(abbr); // doit renvoyer city_ascii
      const top6 = (cities || []).slice(0, 6);

      const slugs = top6
        .map((c: any) => String(c.city_ascii || "").trim())
        .filter(Boolean)
        .map(cityToSlug);

      byState[abbr] = slugs;
      slugs.forEach((s: string) => flatSet.add(s));

      console.log(`[OK] ${abbr} -> ${slugs.join(", ") || "(aucune ville)"}`);
    } catch (err: any) {
      console.error(`[ERREUR] ${abbr}:`, err?.message || err);
      byState[abbr] = [];
    }
  }

  const output = {
    byState,
    available: Array.from(flatSet).sort(),
    meta: {
      pathConvention: "public/images/cities/<city-slug>.webp|jpg",
      note: "Prévois un default.jpg|webp pour le fallback.",
      generatedAt: new Date().toISOString(),
    },
  };

  const outPath = resolve("data/cityImages.json");
  await mkdir(dirname(outPath), { recursive: true });
  await writeFile(outPath, JSON.stringify(output, null, 2), "utf8");

  console.log(
    `\n✅ Fichier généré: ${outPath}\n   États: ${
      Object.keys(byState).length
    } | Total slugs uniques: ${output.available.length}\n`
  );

  // --- Rapport TODO images présentes/manquantes
  console.log("📋 Vérification des images dans public/images/cities :\n");

  let present = 0;
  let missing = 0;

  for (const [abbr, slugs] of Object.entries(byState)) {
    if (slugs.length === 0) continue;

    const checks = await Promise.all(
      slugs.map(async (slug) => {
        const imgPathWebp = join(imagesDir, `${slug}.webp`);
        const imgPathJpg = join(imagesDir, `${slug}.jpg`);
        const exists = (await fileExists(imgPathWebp)) || (await fileExists(imgPathJpg));
        exists ? present++ : missing++;
        return `${exists ? "✅" : "❌"} ${slug}`;
      })
    );

    console.log(`${abbr}: ${checks.join(", ")}`);
  }

  console.log(`\n📦 Bilan images: ${present} présentes / ${missing} manquantes`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
