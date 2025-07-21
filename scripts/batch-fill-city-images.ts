import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';
import fetchCityImageDirectly from '@/lib/fetchCityImageDirectly';

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY! // pas la clé anonyme ici
);

async function updateCitiesMissingImages(limit = 10) {
  const { data: cities, error } = await supabase
    .from('us_cities')
    .select('*')
    .is('image_url', null)
    .limit(limit);

  if (error) {
    console.error('Error fetching cities:', error);
    return;
  }

  for (const city of cities) {
    try {
      const result = await fetchCityImageDirectly(city.city_ascii, city.state_name);

      if (result.url) {
        await supabase
          .from('us_cities')
          .update({
            image_url: result.url,
            image_alt: result.alt,
            photographer: result.photographer,
            image_source_url: result.source_url,
          })
          .eq('id', city.id);

        console.log(`✅ Updated ${city.city_ascii}, ${city.state_name}`);
      } else {
        console.log(`⚠️ No image found for ${city.city_ascii}`);
      }
    } catch (err) {
      console.warn(`❌ Error updating ${city.city_ascii}:`, err);
    }
  }
}

updateCitiesMissingImages(20); // 👈 tu peux changer la limite ici
