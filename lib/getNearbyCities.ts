// lib/getNearbyCities.ts
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export type NearbyCity = {
  id: number;
  city_ascii: string;
  state_id: string | null;   // ⚠️ parfois null
  population?: number;
};

/**
 * Récupère les villes proches via la fonction PostgreSQL `get_nearby_cities`.
 * - currentCityId : id de la ville actuelle
 * - stateId : abréviation d’état (ex: "CA")
 * - limit : nombre max de résultats
 */
export async function getNearbyCities(
  currentCityId: number,
  stateId: string,
  limit = 5
): Promise<NearbyCity[]> {
  const { data, error } = await supabase.rpc('get_nearby_cities', {
    input_id: currentCityId,
    input_state: stateId,
    max_results: limit,
  });

  if (error) {
    console.error('❌ Error fetching nearby cities via RPC:', error.message);
    return [];
  }

  // Normalisation : garantir state_id non null (au moins string vide)
  const normalized = (data || []).map((c: any) => ({
    ...c,
    state_id: typeof c.state_id === 'string' ? c.state_id : '',
  }));

if (normalized.some((c: NearbyCity) => !c.state_id)) {
  console.warn('⚠️ Some nearby cities have no state_id, fallback applied:', normalized);
}

  return normalized;
}
