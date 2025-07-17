import { createClient } from '@supabase/supabase-js'
import generateContent from '@/lib/generatecontent'
import 'dotenv/config'

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_ANON_KEY!
)

async function processBatch() {
  const { data: cities, error } = await supabase
    .from('us_cities')
    .select('*')
    .or('static_title.is.null,static_content.is.null')
    .limit(20) // 👈 optionnel : traite par lots de 20 si besoin

  if (error) {
    console.error('❌ Error fetching cities:', error.message)
    return false
  }

  if (!cities || cities.length === 0) {
    return false
  }

  for (const city of cities) {
    try {
      const { text, title } = generateContent({
        city: city.city_ascii,
        malls: city.malls || [],
        parks: city.parks || [],
        tourism_sites: city.tourism_sites || []
      })

      const updatePayload: any = {}
      if (!city.static_content) updatePayload.static_content = text
      if (!city.static_title) updatePayload.static_title = title

      if (Object.keys(updatePayload).length > 0) {
        await supabase.from('us_cities').update(updatePayload).eq('id', city.id)
        console.log(`✅ Updated: ${city.city_ascii}`)
      } else {
        console.log(`⏭️ Skipped (already filled): ${city.city_ascii}`)
      }
    } catch (err) {
      console.warn(`❌ Failed on ${city.city_ascii}:`, err)
    }
  }

  return true // Il y avait encore du travail à faire
}

async function populateAll() {
  console.log('🚀 Starting...')
  let hasMore = true

  while (hasMore) {
    hasMore = await processBatch()
  }

  console.log('🎉 All done!')
}

populateAll()
