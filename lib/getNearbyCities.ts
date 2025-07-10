import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

// Appel à la fonction PostgreSQL get_nearby_cities définie dans Supabase
export async function getNearbyCities(
  currentCityId: number,
  stateId: string,
  limit = 5
) {
  const { data, error } = await supabase.rpc('get_nearby_cities', {
    input_id: currentCityId,
    input_state: stateId,
    max_results: limit
  });

  if (error) {
    console.error('Error fetching nearby cities via RPC:', error.message);
    return [];
  }

  return data || [];
}
