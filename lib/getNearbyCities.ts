// lib/getNearbyCities.ts (REST, sans supabase-js)
export type NearbyCity = {
  id: number;
  city_ascii: string;
  state_id: string | null;
  population?: number;
};

export async function getNearbyCities(
  currentCityId: number,
  stateId: string,
  limit = 5
): Promise<NearbyCity[]> {
  const url = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/rpc/get_nearby_cities`;
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      apikey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      Authorization: `Bearer ${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      input_id: currentCityId,
      input_state: stateId,
      max_results: limit,
    }),
    // petit cache de 1h si tu veux :
    next: { revalidate: 3600 },
  });

  if (!res.ok) {
    console.error('❌ RPC get_nearby_cities failed:', res.status, await res.text());
    return [];
  }

  const data = (await res.json()) as any[];
  const normalized = (data || []).map((c) => ({
    ...c,
    state_id: typeof c.state_id === 'string' ? c.state_id : '',
  }));

  if (normalized.some((c) => !c.state_id)) {
    console.warn('⚠️ Some nearby cities have no state_id, fallback applied:', normalized);
  }

  return normalized;
}
