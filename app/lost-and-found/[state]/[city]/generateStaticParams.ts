import { createClient } from '@supabase/supabase-js';
import { toCitySlug } from '@/lib/slugify';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export async function generateStaticParams() {
  const { data, error } = await supabase
    .from('us_cities')
    .select('city_ascii, state_id')
    .order('id')
    .limit(20000); // adapte selon tes besoins

  if (error) {
    console.error('❌ Error fetching cities:', error.message);
    return [];
  }

  return (data || []).map((row) => ({
    state: row.state_id.toLowerCase(),
    city: toCitySlug(row.city_ascii),
  }));
}
