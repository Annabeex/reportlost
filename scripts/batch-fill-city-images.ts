// scripts/batch-fill-city-images.ts
import 'dotenv/config'
import { createClient } from '@supabase/supabase-js'
import fetchCityImageDirectly from '@/lib/fetchCityImageDirectly'

/**
 * Typage du résultat image pour éviter les erreurs TS sur result.url
 */
type CityImageResult = {
  url: string | null
  alt?: string | null
  photographer?: string | null
  source_url?: string | null
}

/**
 * Typage minimal des villes depuis la table us_cities
 */
type CityRow = {
  id: number
  city_ascii: string
  state_name: string | null
  image_url: string | null
  image_alt: string | null
  photographer: string | null
  image_source_url: string | null
}

const supabaseUrl = process.env.SUPABASE_URL
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY // ⚠️ clé serveur
if (!supabaseUrl || !serviceKey) {
  console.error('❌ SUPABASE_URL ou SUPABASE_SERVICE_ROLE_KEY manquants dans .env')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, serviceKey)

// ————————————————————————————————————————————————————————————————
// Helpers
// ————————————————————————————————————————————————————————————————

/** Pause utilitaire */
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms))

/**
 * Appelle fetchCityImageDirectly avec retentatives/backoff.
 * Gère notamment les 429 Pexels et quelques erreurs réseau transitoires.
 */
async function fetchWithRetry(
  city: string,
  state: string | null,
  {
    attempts = 4,
    baseDelayMs = 1500,
  }: { attempts?: number; baseDelayMs?: number } = {}
): Promise<CityImageResult> {
  let lastErr: unknown
  for (let i = 0; i < attempts; i++) {
    try {
      const res = (await fetchCityImageDirectly(city, state ?? '')) as CityImageResult
      if (res && res.url) return res
      // Pas d'URL retournée — on retente quand même (peut être terme trop générique)
      lastErr = new Error('No image URL returned')
    } catch (e: any) {
      lastErr = e
      const msg = String(e?.message || e)
      // Si l’erreur embedde un code 429 dans le message, on applique un backoff plus long
      const is429 = /429/.test(msg)
      const delay = is429 ? baseDelayMs * (i + 1) * 2 : baseDelayMs * (i + 1)
      console.warn(`⚠️ fetch retry ${i + 1}/${attempts} for ${city} (${state ?? ''}) in ${delay}ms — reason: ${msg}`)
      await sleep(delay)
      continue
    }
  }
  console.warn(`⚠️ No image found for ${city}${state ? ', ' + state : ''} after ${attempts} tries.`)
  return { url: null, alt: null, photographer: null, source_url: null }
}

/**
 * Met à jour une ville si aucune image n’est déjà présente.
 * Retourne true si MAJ, false sinon.
 */
async function updateOneCity(city: CityRow): Promise<boolean> {
  if (city.image_url) {
    // Déjà renseigné, on évite d’écraser
    return false
  }

  const result = await fetchWithRetry(city.city_ascii, city.state_name)

  if (!result.url) {
    // Rien trouvé
    return false
  }

  // Ici result.url est non-null → non-null assertion sûre pour TS
  const { error: upErr } = await supabase
    .from('us_cities')
    .update({
      image_url: result.url!,               // <- enlève le “rouge”
      image_alt: result.alt ?? `View of ${city.city_ascii}`,
      photographer: result.photographer ?? null,
      image_source_url: result.source_url ?? null,
    })
    .eq('id', city.id)

  if (upErr) {
    console.error(`❌ Update error for ${city.city_ascii}:`, upErr.message)
    return false
  }

  console.log(`✅ Updated ${city.city_ascii}${city.state_name ? ', ' + city.state_name : ''}`)
  return true
}

/**
 * Traite un lot de villes (sans image) avec une petite limite de concurrence.
 */
async function processBatch(limit = 20, concurrency = 3): Promise<{ scanned: number; updated: number }> {
  const { data, error } = await supabase
    .from('us_cities')
    .select('id, city_ascii, state_name, image_url, image_alt, photographer, image_source_url')
    .is('image_url', null)
    .order('id', { ascending: true })
    .limit(limit)

  if (error) {
    console.error('❌ Error fetching cities:', error.message)
    return { scanned: 0, updated: 0 }
  }

  const cities: CityRow[] = (data as CityRow[]) ?? []  // ✅ typage explicite

  if (cities.length === 0) {
    return { scanned: 0, updated: 0 }
  }

  let updated = 0
  let idx = 0

  // Pipeline de concurrence simple
  async function worker() {
    while (idx < cities.length) {
      const i = idx++
      const c = cities[i]  // ✅ plus besoin de "as CityRow"
      try {
        const did = await updateOneCity(c)
        if (did) updated++
        // Petit délai pour ménager l’API
        await sleep(300)
      } catch (err: any) {
        console.warn(`❌ Error updating ${c.city_ascii}:`, err?.message || err)
      }
    }
  }

  const workers = Array.from({ length: Math.max(1, concurrency) }, () => worker())
  await Promise.all(workers)

  return { scanned: cities.length, updated }
}


// ————————————————————————————————————————————————————————————————
// Main
// ————————————————————————————————————————————————————————————————

/**
 * Paramètres depuis CLI/env
 *   LIMIT     : nb de villes à traiter par lot (défaut 20)
 *   CONCURRENCY : nb d’appels Pexels en parallèle (défaut 3)
 *   MAX_BATCHES: nb max de lots à enchaîner (défaut 1 → un seul lot)
 */
const LIMIT = Number(process.env.LIMIT ?? process.argv[2] ?? 20)
const CONCURRENCY = Number(process.env.CONCURRENCY ?? process.argv[3] ?? 3)
const MAX_BATCHES = Number(process.env.MAX_BATCHES ?? process.argv[4] ?? 1)

async function main() {
  console.log(`🚀 Start filling city images (limit=${LIMIT}, concurrency=${CONCURRENCY}, maxBatches=${MAX_BATCHES})`)

  let totalScanned = 0
  let totalUpdated = 0

  for (let b = 0; b < MAX_BATCHES; b++) {
    const { scanned, updated } = await processBatch(LIMIT, CONCURRENCY)
    totalScanned += scanned
    totalUpdated += updated

    console.log(`📦 Batch ${b + 1}: scanned=${scanned}, updated=${updated}`)

    if (scanned === 0) break // plus rien à traiter
    // Petite pause entre lots
    await sleep(1000)
  }

  console.log(`🎉 Done. Scanned: ${totalScanned}, Updated: ${totalUpdated}`)
}

main().catch((e) => {
  console.error('💥 Fatal error:', e)
  process.exit(1)
})
