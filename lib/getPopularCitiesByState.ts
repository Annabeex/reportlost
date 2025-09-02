import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export async function getPopularCitiesByState(stateAbbr: string) {
  const { data, error } = await supabase
    .from('us_cities')
    .select('city_ascii, state_id, population') // 👈 ici
    .eq('state_id', stateAbbr.toUpperCase())
    .order('population', { ascending: false })
    .limit(6)

  if (error) {
    console.error('❌ Error fetching popular cities:', error.message)
    return []
  }

  return data
}
