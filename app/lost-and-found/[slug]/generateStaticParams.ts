// app/lost-and-found/[slug]/generateStaticParams.ts
import { createClient } from '@supabase/supabase-js';
import slugify from '../../../lib/slugify';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export async function generateStaticParams() {
  const { data, error } = await supabase
    .from('us_cities')
    .select('city_ascii, main_zip')
    .order('id')
    .limit(10000); // tu peux adapter selon tes besoins

  if (error) {
    console.error('❌ Error fetching cities:', error.message);
    return [];
  }

  return (data || []).map((city) => ({
    slug: `${slugify(city.city_ascii)}-${city.main_zip}`
  }));
}
