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

const categories = {
  parks: (lat: number, lon: number) => `
    node["leisure"="park"](around:10000,${lat},${lon});
    way["leisure"="park"](around:10000,${lat},${lon});
    relation["leisure"="park"](around:10000,${lat},${lon});
  `,
  tourism_sites: () => 'node["tourism"]',
  malls: () => 'node["shop"="mall"]',
  stations: () => 'node["railway"="station"]',
  airports: () => 'node["aeroway"="aerodrome"]'
};


async function fetchCategory(type: keyof typeof categories, lat: number, lon: number): Promise<{ name: string }[]> {
  const query = `
    [out:json][timeout:25];
    (
      ${categories[type]}(around:10000,${lat},${lon});
    );
    out center;
  `;

  try {
    const response = await axios.post(overpassUrl, query, {
      headers: { 'Content-Type': 'text/plain' },
    });

    const elements = response.data.elements;

    const sorted = elements
      .filter((el: any) => {
        const name = el.tags?.name;
        if (!name) return false;

        if (type === 'airports') {
          const isCivil = el.tags?.aerodrome === 'civil';
          const isMilitary = el.tags?.military;
          return isCivil && !isMilitary;
        }

        if (type === 'malls') {
          return name.length > 10 || /(mall|plaza|center|market)/i.test(name);
        }

        if (type === 'tourism_sites') {
          const excluded = [
            'museum', 'gallery', 'hotel', 'guest_house', 'hostel', 'motel', 'school', 'college', 'university'
          ];
          return !excluded.includes(el.tags?.tourism);
        }

        return true;
      })
      .sort((a: any, b: any) => {
        const score = (el: any) => {
          let s = 0;
          if (el.tags?.wikidata || el.tags?.wikipedia) s += 3;
          if (el.tags?.tourism === 'attraction') s += 2;
          if (el.tags?.area || el.tags?.surface) s += 1;
          return s;
        };
        return score(b) - score(a);
      });

    return sorted.length ? sorted.map((el: any) => ({ name: el.tags.name })) : [];
  } catch (error: any) {
    console.error(`❌ Error fetching ${type}:`, error.message);
    return [];
  }
}

async function seed() {
  const { data: cities, error } = await supabase
    .from('us_cities')
    .select('id, city, state_name, lat, lng')
    .order('population', { ascending: false })
    .limit(50);

  if (error) {
    console.error('❌ Error loading cities:', error.message);
    return;
  }

  for (const city of cities!) {
    const { id, lat, lng, city: name, state_name: state } = city;
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
  }
}

seed();
