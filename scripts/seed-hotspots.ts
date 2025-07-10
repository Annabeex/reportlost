import 'dotenv/config';
import axios from 'axios';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_ANON_KEY!
);

// Nouveau serveur Overpass plus stable
const overpassUrl = 'https://overpass.openstreetmap.fr/api/interpreter';

const categories = {
  parks: '["leisure"="park"]',
  tourism_sites: '["tourism"]',
  malls: '["shop"="mall"]',
  stations: '["railway"="station"]',
  airports: '["aeroway"="aerodrome"]'
};

// Extraction des noms uniques (filtrés)
function filterTopNames(elements: any[]): { name: string }[] {
  const names = elements
    .map((el) => el.tags?.name)
    .filter((name): name is string => typeof name === 'string' && name.trim().length > 0);

  return Array.from(new Set(names)).slice(0, 10).map((name) => ({ name }));
}

// Appel Overpass avec gestion des erreurs réseau
async function fetchCategory(
  type: keyof typeof categories,
  lat: number,
  lon: number
): Promise<{ name: string }[]> {
  const query = `
    [out:json][timeout:25];
    (
      node${categories[type]}(around:10000,${lat},${lon});
      way${categories[type]}(around:10000,${lat},${lon});
      relation${categories[type]}(around:10000,${lat},${lon});
    );
    out tags;
  `;

  try {
    const response = await axios.post(overpassUrl, query, {
      headers: { 'Content-Type': 'text/plain' },
    });
    return filterTopNames(response.data.elements);
  } catch (error: any) {
    const status = error?.response?.status;
    console.error(`❌ Error ${status} fetching ${type}:`, error.message);

    // Retry pour 429 (rate limit) ou 504 (timeout gateway)
    if (status === 429 || status === 504) {
      console.log('⏳ Waiting 10 seconds before retrying...');
      await new Promise((resolve) => setTimeout(resolve, 10000));
      return fetchCategory(type, lat, lon);
    }

    return [];
  }
}

// Boucle principale
async function seed(startId = 7000) {
  const { data: cities, error } = await supabase
    .from('us_cities')
    .select('id, city, state_name, lat, lng')
    .gt('id', startId)
    .order('id', { ascending: true })
    .limit(100);

  if (error || !cities?.length) {
    console.error('❌ Error loading cities:', error?.message);
    return;
  }

  for (const city of cities) {
    const { id, lat, lng, city: name, state_name: state } = city;
    console.log(`➡️ Processing ${name}, ${state}`);

    if (!lat || !lng) {
      console.warn(`⚠️ Missing coordinates for ${name}, ${state}`);
      continue;
    }

    const parks = await fetchCategory('parks', lat, lng);
    const tourism = await fetchCategory('tourism_sites', lat, lng);
    const malls = await fetchCategory('malls', lat, lng);
    const stations = await fetchCategory('stations', lat, lng);
    const airports = await fetchCategory('airports', lat, lng);

    const { error: updateError } = await supabase
      .from('us_cities')
      .update({
        parks: JSON.stringify(parks),
        tourism_sites: JSON.stringify(tourism),
        malls: JSON.stringify(malls),
        stations: JSON.stringify(stations),
        airports: JSON.stringify(airports),
      })
      .eq('id', id);

    if (updateError) {
      console.error(`❌ Update error for ${name}, ${state}:`, updateError.message);
    } else {
      console.log(`✅ Hotspots updated for ${name}, ${state}`);
    }

    // Petite pause pour soulager l’API Overpass
    await new Promise((resolve) => setTimeout(resolve, 3000));
  }

  const lastProcessedId = cities[cities.length - 1].id;
  await seed(lastProcessedId);
}

seed();
