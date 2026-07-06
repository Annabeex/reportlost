#!/usr/bin/env tsx
/**
 * Régénère la photo Pexels d'une ville et l'enregistre en base (persiste).
 * Usage :
 *   npx tsx scripts/regen-city-image.ts                 # New York, NY (défaut)
 *   npx tsx scripts/regen-city-image.ts "Los Angeles" CA
 */
const { config } = require("dotenv");
const { existsSync } = require("node:fs");
const path = require("node:path");

const envLocal = path.resolve(process.cwd(), ".env.local");
const envDefault = path.resolve(process.cwd(), ".env");
if (existsSync(envLocal)) config({ path: envLocal });
else if (existsSync(envDefault)) config({ path: envDefault });

const { createClient } = require("@supabase/supabase-js");

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const PEXELS_KEY = process.env.PEXELS_API_KEY;

async function main() {
  const city = process.argv[2] || "New York";
  const state = (process.argv[3] || "NY").toUpperCase();

  if (!SUPABASE_URL || !SERVICE_KEY) {
    console.error("❌ SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY manquants");
    process.exit(1);
  }
  if (!PEXELS_KEY) {
    console.error("❌ PEXELS_API_KEY manquant");
    process.exit(1);
  }

  // 1) Chercher une photo sur Pexels
  const query = `${city} ${state} skyline`;
  const res = await fetch(
    `https://api.pexels.com/v1/search?query=${encodeURIComponent(query)}&per_page=1&orientation=landscape`,
    { headers: { Authorization: PEXELS_KEY } }
  );
  if (!res.ok) {
    console.error("❌ Pexels", res.status, await res.text());
    process.exit(1);
  }
  const data = await res.json();
  const photo = data.photos?.[0];
  if (!photo) {
    console.error(`❌ Aucune photo Pexels pour "${query}"`);
    process.exit(1);
  }

  const image_url = photo.src?.landscape || photo.src?.large || photo.src?.medium;
  const image_alt = photo.alt || `View of ${city}, ${state}`;
  const photographer = photo.photographer || null;
  const image_source_url = photo.url || null;

  // 2) Écrire en base (persiste)
  const sb = createClient(SUPABASE_URL, SERVICE_KEY, { auth: { persistSession: false } });
  const { data: updated, error } = await sb
    .from("us_cities")
    .update({ image_url, image_alt, photographer, image_source_url })
    .eq("state_id", state)
    .ilike("city_ascii", city)
    .select("id, city_ascii, state_id, image_url");

  if (error) {
    console.error("❌ Supabase:", error.message);
    process.exit(1);
  }
  if (!updated?.length) {
    console.error(`❌ Ligne introuvable: ${city}, ${state} (vérifie city_ascii)`);
    process.exit(1);
  }

  console.log(`✅ Image mise à jour pour ${city}, ${state}`);
  console.log("   " + image_url);
  console.log(`   Photo: ${photographer} — ${image_source_url}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
