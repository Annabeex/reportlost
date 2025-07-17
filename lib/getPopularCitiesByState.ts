import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export async function getPopularCitiesByState(stateSlug: string) {
  const { data, error } = await supabase
    .from('us_cities')
    .select('city_ascii, zip, population')
    .eq('state_id', stateSlug.toUpperCase())
    .order('population', { ascending: false })
    .limit(6)

  if (error) {
    console.error('❌ Error fetching popular cities:', error.message)
    return []
  }

  return data
}
