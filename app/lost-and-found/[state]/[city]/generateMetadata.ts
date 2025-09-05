// app/lost-and-found/[state]/[city]/generateMetadata.ts
import { createClient } from '@supabase/supabase-js';
import type { Metadata } from 'next';
import { fromCitySlug, buildCityPath } from '@/lib/slugify';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export default async function generateMetadata(
  { params }: { params: { state: string; city: string } }
): Promise<Metadata> {
  const state = (params.state || '').toLowerCase();
  const cityName = fromCitySlug(decodeURIComponent(params.city));

  const { data } = await supabase
    .from('us_cities')
    .select('city_ascii, state_name, state_id, static_title')
    .eq('state_id', state.toUpperCase()) // ✅ important !
    .ilike('city_ascii', cityName)
    .maybeSingle();

  if (!data) return {};

  const canonical = `https://reportlost.org${buildCityPath(data.state_id, data.city_ascii)}`;

  return {
    title: data.static_title || `Lost & Found in ${data.city_ascii}, ${data.state_name}`,
    description: `Report or find lost items in ${data.city_ascii}. Quick, secure and locally focused.`,
    alternates: { canonical },
  };
}
