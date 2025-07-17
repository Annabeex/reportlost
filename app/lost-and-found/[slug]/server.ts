import { createClient } from '@supabase/supabase-js';
import { Metadata } from 'next';
import { getSlugFromCity } from '@/lib/getSlugFromCity';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

function toTitleCase(str: string) {
  return str
    .toLowerCase()
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

export async function generateMetadata({ params }: { params: { slug: string } }): Promise<Metadata> {
  const slug = decodeURIComponent(params.slug);
  const zip = slug.split('-').slice(-1)[0];
  const rawCity = slug.replace(`-${zip}`, '').replace(/-/g, ' ');
  const cityName = toTitleCase(rawCity);

  const { data } = await supabase
    .from('us_cities')
    .select('city_ascii, state_name, zips, state_id, static_title')
    .like('zips', `%${zip}%`)
    .ilike('city_ascii', cityName)
    .single();

  if (!data) return {};

  const canonical = `https://reportlost.org/lost-and-found/${getSlugFromCity(data.city_ascii, zip)}`;

  return {
    title: data.static_title || `Lost & Found in ${data.city_ascii}, ${data.state_name}`,
    description: `Report or find lost items in ${data.city_ascii}. Quick, secure and locally focused.`,
    alternates: {
      canonical
    }
  };
}
