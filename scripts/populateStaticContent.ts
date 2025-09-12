// scripts/populate-static-content.ts
import 'dotenv/config'
import { createClient } from '@supabase/supabase-js'
import generateContent from '@/lib/generatecontent'

/**
 * ⚙️ Comportement :
 * - Par défaut : on met à jour si static_content est NULL ou s'il ne contient pas d'exemples "(e.g., ...)".
 * - Pour écraser TOUTES les villes (même si déjà remplies), lance avec POPULATE_OVERWRITE=1.
 *
 * Exemples:
 *    tsx scripts/populate-static-content.ts
 *    POPULATE_OVERWRITE=1 tsx scripts/populate-static-content.ts
 */

// --- Config ---
const OVERWRITE_ALL = process.env.POPULATE_OVERWRITE === '1'
const BATCH_SIZE = Number(process.env.POPULATE_BATCH_SIZE || 50)

// ⚠️ Utilise la service role key pour écrire sans souci de RLS
const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// --- Utils ---
function safeParseArray(input: unknown): any[] {
  if (!input) return []
  if (Array.isArray(input)) return input
  if (typeof input === 'string') {
    try { return JSON.parse(input) } catch { return [] }
  }
  return []
}

/** Détecte la présence d'exemples "(e.g., XXX, YYY)" dans le texte existant */
function hasExamples(text?: string | null): boolean {
  if (!text) return false
  // repère "(e.g., <qqch>)" ou "(e.g. <qqch>)"
  return /\(e\.g\.?,\s*[^)]+\)/i.test(text)
}

/** Doit-on régénérer le contenu ? */
function shouldRefreshContent(current?: string | null): boolean {
  if (OVERWRITE_ALL) return true
  if (!current || current.trim().length === 0) return true
  // si pas d'exemples, on régénère
  if (!hasExamples(current)) return true
  return false
}

// --- Traitement par curseur d'id pour stabilité ---
async function processAll() {
  console.log('🚀 Starting populate static content...')
  let lastId = 0
  let updated = 0
  let scanned = 0

  while (true) {
    const { data: rows, error } = await supabase
      .from('us_cities')
      .select('id, city_ascii, static_title, static_content, malls, parks, tourism_sites')
      .gt('id', lastId)
      .order('id', { ascending: true })
      .limit(BATCH_SIZE)

    if (error) {
      console.error('❌ Error fetching cities:', error.message)
      break
    }
    if (!rows || rows.length === 0) break

    for (const city of rows) {
      scanned++
      lastId = city.id

      try {
        const malls = safeParseArray(city.malls)
        const parks = safeParseArray(city.parks)
        const tourism_sites = safeParseArray(city.tourism_sites)

        const needContent = shouldRefreshContent(city.static_content)
        const needTitle = !city.static_title || city.static_title.trim().length === 0

        if (!needContent && !needTitle) {
          // Rien à faire
          // console.log(`⏭️ Skipped: ${city.city_ascii}`)
          continue
        }

        const { text, title } = generateContent({
          city: city.city_ascii,
          malls,
          parks,
          tourism_sites,
        })

        const payload: Record<string, string> = {}
        if (needContent) payload.static_content = text
        if (needTitle) payload.static_title = title

        const { error: upErr } = await supabase
          .from('us_cities')
          .update(payload)
          .eq('id', city.id)

        if (upErr) {
          console.error(`❌ Update failed for ${city.city_ascii}:`, upErr.message)
        } else {
          updated++
          console.log(`✅ Updated: ${city.city_ascii}`)
        }
      } catch (err) {
        console.warn(`❌ Failed on ${city.city_ascii}:`, err)
      }
    }

    if (rows.length < BATCH_SIZE) break // fin
  }

  console.log(`🎉 Done. Scanned: ${scanned}, Updated: ${updated}, Overwrite mode: ${OVERWRITE_ALL ? 'ON' : 'OFF'}`)
}

// --- Run ---
processAll().catch((e) => {
  console.error('💥 Fatal error:', e)
  process.exit(1)
})
