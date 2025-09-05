import 'dotenv/config'
import axios from 'axios'
import { createClient } from '@supabase/supabase-js'

// ✅ Service role pour éviter les soucis RLS en update
const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY! // ← garde SUPABASE_ANON_KEY si tes RLS autorisent l'update
)

// Endpoints Overpass (avec fallback)
const OVERPASS_PRIMARY = 'https://overpass.openstreetmap.fr/api/interpreter'
const OVERPASS_FALLBACK = 'https://overpass-api.de/api/interpreter'

// Catégories à récupérer
const categories = {
  parks: '["leisure"="park"]',
  tourism_sites: '["tourism"]',
  malls: '["shop"="mall"]',
  stations: '["railway"="station"]',
  airports: '["aeroway"="aerodrome"]',
} as const

type CategoryKey = keyof typeof categories

// Extraction des noms uniques
function filterTopNames(elements: any[]): { name: string }[] {
  const names = (elements || [])
    .map((el) => el?.tags?.name)
    .filter((n: unknown): n is string => typeof n === 'string' && n.trim().length > 0)

  return Array.from(new Set(names)).slice(0, 10).map((name) => ({ name }))
}

// Appel Overpass avec retry + fallback
async function fetchCategoryOnce(
  endpoint: string,
  type: CategoryKey,
  lat: number,
  lon: number
) {
  const query = `
    [out:json][timeout:40];
    (
      node${categories[type]}(around:10000,${lat},${lon});
      way${categories[type]}(around:10000,${lat},${lon});
      relation${categories[type]}(around:10000,${lat},${lon});
    );
    out tags;
  `

  const resp = await axios.post(endpoint, query, {
    headers: { 'Content-Type': 'text/plain' },
    timeout: 45000,
  })

  const elements = resp?.data?.elements
  return Array.isArray(elements) ? filterTopNames(elements) : []
}

async function fetchCategory(type: CategoryKey, lat: number, lon: number) {
  try {
    return await fetchCategoryOnce(OVERPASS_PRIMARY, type, lat, lon)
  } catch (e1: any) {
    const status = e1?.response?.status
    console.warn(`⚠️ Overpass primary failed (${status || e1?.code || 'unknown'}). Trying fallback...`)
    try {
      return await fetchCategoryOnce(OVERPASS_FALLBACK, type, lat, lon)
    } catch (e2: any) {
      const status2 = e2?.response?.status
      console.error(`❌ Overpass fallback failed (${status2 || e2?.code || 'unknown'}) for ${type}`)
      // Si rate-limit/timeout, petite pause
      if (status2 === 429 || status2 === 504) {
        console.log('⏳ Waiting 10 seconds before continuing...')
        await new Promise((r) => setTimeout(r, 10000))
      }
      return []
    }
  }
}

// Boucle principale (100 par batch, séquentiel pour éviter le rate-limit)
export async function seed(startId = 37774) {
  const { data: cities, error } = await supabase
    .from('us_cities')
    .select('id, city, state_name, lat, lng')
    .gte('id', startId) // ← mets .gt si tu préfères strictement >
    .order('id', { ascending: true })
    .limit(100)

  if (error) {
    console.error('❌ Error loading cities:', error.message)
    return
  }
  if (!cities?.length) {
    console.log('✅ Nothing to process. Done.')
    return
  }

  for (const city of cities) {
    const { id, lat, lng, city: name, state_name: state } = city
    console.log(`➡️ Processing ${name}, ${state} (id=${id})`)

    if (typeof lat !== 'number' || typeof lng !== 'number') {
      console.warn(`⚠️ Missing coordinates for ${name}, ${state} — skipped`)
      continue
    }

    const parks = await fetchCategory('parks', lat, lng)
    const tourism = await fetchCategory('tourism_sites', lat, lng)
    const malls = await fetchCategory('malls', lat, lng)
    const stations = await fetchCategory('stations', lat, lng)
    const airports = await fetchCategory('airports', lat, lng)

    const { error: updateError } = await supabase
      .from('us_cities')
      .update({
        parks: JSON.stringify(parks),
        tourism_sites: JSON.stringify(tourism),
        malls: JSON.stringify(malls),
        stations: JSON.stringify(stations),
        airports: JSON.stringify(airports),
      })
      .eq('id', id)

    if (updateError) {
      console.error(`❌ Update error for ${name}, ${state} (id=${id}):`, updateError.message)
    } else {
      console.log(`✅ Hotspots updated for ${name}, ${state} (id=${id})`)
    }

    // Petite pause pour soulager l’API Overpass
    await new Promise((resolve) => setTimeout(resolve, 2500))
  }

  const lastProcessedId = cities[cities.length - 1].id
  console.log(`➡️ Continuing from id ${lastProcessedId + 1}...`)
  await seed(lastProcessedId + 1)
}

// 👉 Lancement manuel depuis la console :
//   npx tsx scripts/seed-hotspots.ts
// ou via ton script npm:
//   npm run seed-hotspots
//
// Tu peux aussi appeler avec un point de reprise :
//   node -e "import('./scripts/seed-hotspots.ts').then(m => m.seed(25000))"
