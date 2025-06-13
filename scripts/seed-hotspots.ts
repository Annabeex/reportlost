import 'dotenv/config';
import axios from 'axios';
import { createClient } from '@supabase/supabase-js';

console.log('SUPABASE_URL:', process.env.SUPABASE_URL);
console.log('SUPABASE_ANON_KEY:', process.env.SUPABASE_ANON_KEY?.slice(0, 15) + '...');

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_ANON_KEY!
);

const overpassUrl = 'https://overpass-api.de/api/interpreter';

async function fetchHotspots(lat: number, lon: number, city: string): Promise<{ name: string }[]> {
  const radius = 10000; // 10 km autour de la ville

  const query = `
    [out:json][timeout:25];
    (
      node["leisure"="park"](around:${radius},${lat},${lon});
      node["tourism"](around:${radius},${lat},${lon});
      node["shop"="mall"](around:${radius},${lat},${lon});
      node["amenity"="marketplace"](around:${radius},${lat},${lon});
      node["railway"="station"](around:${radius},${lat},${lon});
      node["public_transport"="station"](around:${radius},${lat},${lon});
      node["bus_station"](around:${radius},${lat},${lon});
      node["aeroway"="aerodrome"]["aerodrome"="civil"](around:${radius},${lat},${lon});
      node["historic"](around:${radius},${lat},${lon});
      node["amenity"="theatre"](around:${radius},${lat},${lon});
      node["leisure"="nature_reserve"](around:${radius},${lat},${lon});
      node["natural"](around:${radius},${lat},${lon});
    );
    out center 30;
  `;

  try {
    const response = await axios.post(overpassUrl, query, {
      headers: { 'Content-Type': 'text/plain' },
    });

    const elements = response.data.elements;
    const names = elements
      .map((el: any) => el.tags?.name)
      .filter((name: string) => name)
      .slice(0, 30);

    console.log(`📍 Hotspots trouvés pour ${city}:`, names);
    return names.map((name: string) => ({ name }));
  } catch (error: any) {
    console.error(`❌ Erreur lors de la récupération des hotspots pour ${city}:`, error.message);
    return [];
  }
}

async function seed() {
  const { data: cities, error } = await supabase
    .from('us_cities')
    .select('city, state_name, lat, lng')
    .order('population', { ascending: false })
    .limit(50); // Tester sur 50 villes

  if (error) {
    console.error('❌ Erreur lors de la récupération des villes:', error.message);
    return;
  }

  for (const city of cities!) {
    if (!city.lat || !city.lng) {
      console.warn(`⚠️ Coordonnées manquantes pour ${city.city}, ${city.state_name}`);
      continue;
    }

    const hotspots = await fetchHotspots(city.lat, city.lng, city.city);

    const { error } = await supabase
      .from('us_cities')
      .update({ hotspots: JSON.stringify(hotspots) })
      .eq('city', city.city)
      .eq('state_name', city.state_name);

    if (error) {
      console.error(`❌ Erreur pour ${city.city}, ${city.state_name}:`, error.message);
    } else {
      console.log(`✅ Hotspots injectés pour ${city.city}, ${city.state_name}`);
    }
  }
}

seed();
