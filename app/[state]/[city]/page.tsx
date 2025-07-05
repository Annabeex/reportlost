import { createClient } from '@supabase/supabase-js';
import '../../../app/globals.css';
import Image from 'next/image';
import fetchCityImageFromPexels from '@/lib/fetchCityImageFromPexels';
import dynamic from 'next/dynamic';
import { exampleReports } from '@/lib/lostitems';

const CityMap = dynamic(() => import('@/components/Map'), { ssr: false });
const ClientReportForm = dynamic(() => import('@/components/ClientReportForm'), { ssr: false });

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

function formatDate(date: Date) {
  return date.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
}

function generateCitySeoText(cityData: any): string {
  const { city, state_name, population, density, timezone, zips, hotspots, county_name } = cityData;
  const zip = zips?.match(/\b\d{5}\b/)?.[0];
  const pop = population ? population.toLocaleString() : 'many';
  const dens = density ? `${density} people/km²` : 'unknown density';
  const today = formatDate(new Date());

  const getNames = (match: string[]) =>
    Array.isArray(hotspots)
      ? hotspots.filter((h: any) =>
          typeof h.name === 'string' &&
          match.some(keyword => h.name.toLowerCase().includes(keyword))
        ).map((h: any) => h.name).slice(0, 5)
      : [];

  const sections = [
    {
      key: 'parks',
      synonyms: ['green spaces', 'public parks', 'recreational areas'],
      names: getNames(['park'])
    },
    {
      key: 'tourism',
      synonyms: ['tourist attractions', 'landmarks', 'points of interest'],
      names: getNames(['tourism', 'attraction', 'landmark'])
    },
    {
      key: 'stations',
      synonyms: ['stations', 'transit hubs', 'commuter points'],
      names: getNames(['station'])
    },
    {
      key: 'markets',
      synonyms: ['shopping centers', 'marketplaces', 'retail zones'],
      names: getNames(['mall', 'market'])
    },
    {
      key: 'monuments',
      synonyms: ['historic places', 'memorials', 'heritage sites'],
      names: getNames(['memorial', 'historic', 'theatre'])
    },
    {
      key: 'airports',
      synonyms: ['airports', 'regional terminals', 'air travel hubs'],
      names: getNames(['airport'])
    }
  ];

  let text = `### Where are lost items commonly found in ${city}?

Lost something important in ${city}, ${state_name}? Don't worry — you're not alone. Every week, lost items like phones, wallets or backpacks are recovered in this city thanks to the vigilance of locals and public services.

`;

  sections.forEach(section => {
    if (section.names.length) {
      const synonym = section.synonyms[Math.floor(Math.random() * section.synonyms.length)];
      text += `Among the most visited ${synonym}:
\n`;
      section.names.forEach((name: string) => {
        text += `- ${name}\n`;
      });
      text += `\nThese places are busy and regularly cleaned, improving the chances of recovering lost items.\n\n`;
    }
  });

  text += `---\n\n### Who to contact in case of loss?\n\nIf you’ve lost something in ${city}, start by contacting:\n\n- Local police department\n- Public transportation Lost & Found\n- Airports or stations if applicable\n- The last venue you visited (restaurant, mall, park, etc.)\n\nReacting quickly increases your recovery chances significantly.\n\n`;

  text += `---\n\n### Local info: ${city}, ${state_name}\n\n${city} is located in ${county_name || 'its county'}, ${state_name}, with a population of approximately ${pop} and a density of ${dens}. The main ZIP code is ${zip || 'unknown'}, and it lies in the ${timezone || 'local'} timezone.\n\nPage updated on ${today}.\n\n`;

  text += `---\n\n### Most commonly lost items\n- Phones and electronics\n- Wallets and credit cards\n- Keys (house, car, office)\n- Glasses (sun and prescription)\n- Clothing and accessories\n`;

  return text;
}

export default async function Page({ params }: { params: { state: string; city: string } }) {
  const rawCity = decodeURIComponent(params.city).replace(/-/g, ' ');
  const rawState = decodeURIComponent(params.state).replace(/-/g, ' ');
  const cityName = toTitleCase(rawCity);
  const stateName = toTitleCase(rawState);

  console.log('🔠 Looking for:', cityName, stateName);

  let cityData = null;
  try {
    const { data } = await supabase
      .from('us_cities')
      .select('*')
      .eq('city', cityName)
      .eq('state_name', stateName)
      .order('population', { ascending: false })
      .limit(1);
    cityData = data?.[0] || null;
    console.log('📦 cityData raw:', cityData);
  } catch (err) {
    console.error('Error fetching city data:', err);
  }

  if (!cityData) {
    console.warn(`❌ No city found for ${cityName}, ${stateName}`);
    return <div className="text-red-600 p-4">Aucune donnée trouvée pour {cityName}, {stateName}</div>;
  }

  const displayName = cityData?.city || cityName;

  let cityImage = cityData?.image_url || null;
  let cityImageAlt = cityData?.image_alt || `View of ${displayName}, ${stateName}`;
  let cityImageCredit = '';

  if (!cityImage) {
    try {
      const image = await fetchCityImageFromPexels(cityName, stateName);
      cityImage = image.url;
      cityImageAlt = image.alt;

      if (cityImage && cityData?.id) {
        await supabase
          .from('us_cities')
          .update({
            image_url: cityImage,
            image_alt: cityImageAlt,
            photographer: image.photographer,
            image_source_url: image.source_url
          })
          .eq('id', cityData.id);
      }

      if (image.photographer && image.source_url) {
        cityImageCredit = `Photo by ${image.photographer}`;
      }
    } catch (err) {
      console.error('Error fetching image from Pexels:', err);
    }
  } else if (cityData?.photographer && cityData?.image_source_url) {
    cityImageCredit = `Photo by ${cityData.photographer}`;
  }

  let markerLat = cityData?.lat;
  let markerLon = cityData?.lng;
  let policeName = '';

  try {
    const overpassUrl = `https://overpass-api.de/api/interpreter?data=[out:json];node[amenity=police](around:10000,${markerLat},${markerLon});out;`;
    const overpassRes = await fetch(overpassUrl);
    const overpassData = await overpassRes.json();
    const police = overpassData?.elements?.[0];
    markerLat = police?.lat || markerLat;
    markerLon = police?.lon || markerLon;
    policeName = police?.tags?.name || '';
    console.log('📍 markerLat:', markerLat, 'markerLon:', markerLon);
  } catch (err) {
    console.error('Error fetching police data from Overpass:', err);
  }

  let articleText = '';
  try {
    articleText = cityData ? generateCitySeoText(cityData) : '';
  } catch (err) {
    console.error('Error generating city SEO text:', err);
  }

  let reports: string[] = [];
  try {
    reports = cityData ? exampleReports(cityData) : [];
  } catch (err) {
    console.error('Error generating example reports:', err);
  }

  const today = formatDate(new Date());

  return (
    <main className="bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto space-y-16">
        <section className="text-center bg-gradient-to-r from-blue-50 to-white py-12 px-4 rounded-xl shadow-md">
          <h1 className="text-4xl font-bold text-gray-900">
            Lost &amp; Found in {displayName}
          </h1>
          <p className="mt-2 text-sm text-gray-500">{today}</p>
          <p className="mt-4 text-lg text-gray-600 max-w-2xl mx-auto">
            Discover how to recover your lost item — from local hotspots to practical advice.
          </p>
        </section>

        <section className="bg-white p-6 rounded-lg shadow flex flex-col md:flex-row gap-6 items-start">
  <div className="md:w-1/2 w-full min-h-[300px] h-[300px]">
    <CityMap lat={markerLat} lon={markerLon} name={policeName || displayName} />
  </div>
  <div className="md:w-1/2 w-full prose max-w-none prose-sm sm:prose-base text-gray-700">
    <div className="whitespace-pre-line">{articleText.split('---')[1]}</div>
  </div>
</section>


    

        <section className="bg-blue-50 p-6 rounded-lg shadow">
          <h2 className="text-2xl font-semibold text-blue-800 mb-4">📝 Report your lost item</h2>
          <p className="text-gray-700 mb-6">
            Fill out the form below with as many details as possible to increase your chances of recovering the lost item.
          </p>
          <ClientReportForm defaultCity={displayName} />
        </section>

        {reports.length > 0 && (
          <section className="bg-gray-100 p-6 rounded-lg shadow space-y-2">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">🔍 Recently reported lost items in {displayName}</h2>
            <ul className="text-gray-700 list-none space-y-2">
              {reports.map((report, index) => (
                <li key={index}>{report}</li>
              ))}
            </ul>
          </section>
        )}

        {cityImage && (
          <section className="bg-white p-6 rounded-lg shadow flex flex-col md:flex-row gap-6 items-start">
            <div className="md:w-1/2 w-full relative rounded-lg overflow-hidden">
              <Image
                src={cityImage}
                alt={cityImageAlt}
                width={600}
                height={400}
                className="w-full h-[250px] rounded-lg shadow-md object-cover"
              />
              {cityImageCredit && (
                <p className="text-xs text-gray-500 mt-1 text-center">{cityImageCredit}</p>
              )}
            </div>
            <div className="md:w-1/2 w-full prose max-w-none prose-sm sm:prose-base text-gray-700">
              <div className="whitespace-pre-line">{articleText.split('---')[0]}</div>
            </div>
          </section>
        )}

        <section className="bg-white p-6 rounded-lg shadow prose max-w-none prose-sm sm:prose-base text-gray-700">
          <div className="whitespace-pre-line">{articleText.split('---').slice(2).join('---')}</div>
        </section>
      </div>
    </main>
  );
}
