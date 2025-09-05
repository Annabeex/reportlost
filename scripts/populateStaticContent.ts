// scripts/populate-static-content.ts
import 'dotenv/config'
import { createClient } from '@supabase/supabase-js'
import generateContent from '@/lib/generatecontent'

/**
 * ✅ Utilise la service role key pour éviter les soucis de RLS en update.
 * Si tu tiens absolument à l'ANON, garde SUPABASE_ANON_KEY — mais assure-toi
 * que les policies autorisent ces updates.
 */
const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY! // ← plus sûr pour un script serveur
  // process.env.SUPABASE_ANON_KEY!       // ← utilise ceci SEULEMENT si RLS ok
)

// Parse sûr pour champs JSON éventuellement stockés en string
function safeParseArray(input: unknown): any[] {
  if (!input) return []
  if (Array.isArray(input)) return input
  if (typeof input === 'string') {
    try { return JSON.parse(input) } catch { return [] }
  }
  return []
}

async function processBatch(limit = 20): Promise<boolean> {
  const { data: cities, error } = await supabase
    .from('us_cities')
    .select('*')
    .or('static_title.is.null,static_content.is.null')
    .order('id', { ascending: true }) // stabilité
    .limit(limit)

  if (error) {
    console.error('❌ Error fetching cities:', error.message)
    return false
  }

  if (!cities || cities.length === 0) {
    return false // plus rien à traiter
  }

  for (const city of cities) {
    try {
      const malls = safeParseArray(city.malls)
      const parks = safeParseArray(city.parks)
      const tourism_sites = safeParseArray(city.tourism_sites)

      const { text, title } = generateContent({
        city: city.city_ascii,
        malls,
        parks,
        tourism_sites,
      })

      const updatePayload: Record<string, string> = {}
      if (!city.static_content) updatePayload.static_content = text
      if (!city.static_title) updatePayload.static_title = title

      if (Object.keys(updatePayload).length > 0) {
        const { error: upErr } = await supabase
          .from('us_cities')
          .update(updatePayload)
          .eq('id', city.id)

        if (upErr) {
          console.error(`❌ Update failed for ${city.city_ascii}:`, upErr.message)
        } else {
          console.log(`✅ Updated: ${city.city_ascii}`)
        }
      } else {
        console.log(`⏭️ Skipped (already filled): ${city.city_ascii}`)
      }

      // (Optionnel) petite pause pour éviter de spammer la DB/quotas
      // await new Promise(r => setTimeout(r, 50))
    } catch (err) {
      console.warn(`❌ Failed on ${city.city_ascii}:`, err)
    }
  }

  return true // il reste potentiellement d'autres villes à traiter
}

async function populateAll() {
  console.log('🚀 Starting populate static content...')
  let hasMore = true

  while (hasMore) {
    hasMore = await processBatch(20)
  }

  console.log('🎉 All done!')
}

populateAll().catch((e) => {
  console.error('💥 Fatal error:', e)
  process.exit(1)
})
