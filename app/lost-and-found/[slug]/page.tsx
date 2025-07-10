import { createClient } from '@supabase/supabase-js';
import '../../../app/globals.css';
import Image from 'next/image';
import fetchCityImageFromPexels from '@/lib/fetchCityImageFromPexels';
import dynamic from 'next/dynamic';
import { exampleReports } from '@/lib/lostitems';
import ReportFormPage from '@/app/reportform/page';
import { getSlugFromCity } from '@/lib/getSlugFromCity';
import { getNearbyCities } from '@/lib/getNearbyCities';
import Link from 'next/link';
import { Metadata } from 'next';

const CityMap = dynamic(() => import('@/components/Map'), { ssr: false });

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

interface CityData {
  id: number;
  city: string;
  city_ascii: string;
  state_name: string;
  state_id: string;
  lat: number;
  lng: number;
  image_url: string | null;
  image_alt: string | null;
  photographer: string | null;
  image_source_url: string | null;
  zips: string;
  population: number;
  density: number;
  timezone: string;
  hotspots: any[];
  county_name: string;
}

function generateCitySeoText(cityData: CityData): string {
  const { city, state_name, population, density, timezone, zips, hotspots, county_name } = cityData;
  const zip = zips?.match(/\b\d{5}\b/)?.[0];
  const pop = population ? population.toLocaleString() : 'many';
  const dens = density ? `${density} people/km²` : 'unknown density';
  const today = formatDate(new Date());

  const getNames = (match: string[]) =>
    Array.isArray(hotspots)
      ? hotspots
          .filter((h: any) => typeof h.name === 'string' && match.some(k => h.name.toLowerCase().includes(k)))
          .map((h: any) => h.name)
          .slice(0, 5)
      : [];

  const sections = [
    { key: 'parks', synonyms: ['green spaces', 'public parks', 'recreational areas'], names: getNames(['park']) },
    { key: 'tourism', synonyms: ['tourist attractions', 'landmarks', 'points of interest'], names: getNames(['tourism', 'attraction', 'landmark']) },
    { key: 'stations', synonyms: ['stations', 'transit hubs', 'commuter points'], names: getNames(['station']) },
    { key: 'markets', synonyms: ['shopping centers', 'marketplaces', 'retail zones'], names: getNames(['mall', 'market']) },
    { key: 'monuments', synonyms: ['historic places', 'memorials', 'heritage sites'], names: getNames(['memorial', 'historic', 'theatre']) },
    { key: 'airports', synonyms: ['airports', 'regional terminals', 'air travel hubs'], names: getNames(['airport']) },
  ];

  let text = `### Where are lost items commonly found in ${city}?

Lost something important in ${city}, ${state_name}? Don't worry — you're not alone. Every week, lost items like phones, wallets or backpacks are recovered in this city thanks to the vigilance of locals and public services.

`;

  sections.forEach(section => {
    if (section.names.length) {
      const synonym = section.synonyms[Math.floor(Math.random() * section.synonyms.length)];
      text += `Among the most visited ${synonym}:
`;
      section.names.forEach(name => {
        text += `- ${name}
`;
      });
      text += `\nThese places are busy and regularly cleaned, improving the chances of recovering lost items.\n\n`;
    }
  });

  text += `---\n\n### Local info: ${city}, ${state_name}\n\n${city} is located in ${county_name || 'its county'}, ${state_name}, with a population of approximately ${pop} and a density of ${dens}. The main ZIP code is ${zip || 'unknown'}, and it lies in the ${timezone || 'local'} timezone.\n\nPage updated on ${today}.\n\n`;

  text += `---\n\n### Most commonly lost items\n- Phones and electronics\n- Wallets and credit cards\n- Keys (house, car, office)\n- Glasses (sun and prescription)\n- Clothing and accessories\n`;

  return text;
}

export async function generateMetadata({ params }: { params: { slug: string } }): Promise<Metadata> {
  const slug = decodeURIComponent(params.slug);
  const zip = slug.split('-').slice(-1)[0];
  const rawCity = slug.replace(`-${zip}`, '').replace(/-/g, ' ');
  const cityName = toTitleCase(rawCity);

  const { data } = await supabase
    .from('us_cities')
    .select('city_ascii, state_name, zips, state_id')
    .like('zips', `%${zip}%`)
    .ilike('city_ascii', cityName)
    .single();

  if (!data) return {};

  const canonical = `https://reportlost.org/lost-and-found/${getSlugFromCity(data.city_ascii, zip)}`;

  return {
    title: `Lost & Found in ${data.city_ascii}, ${data.state_name} – ReportLost.org`,
    description: `Report or find lost items in ${data.city_ascii}. Quick, secure and locally focused.`,
    alternates: {
      canonical
    }
  };
}

export default async function Page({ params }: { params: { slug: string } }) {
  const slug = decodeURIComponent(params.slug);
  const zip = slug.split('-').slice(-1)[0];
  const rawCity = slug.replace(`-${zip}`, '').replace(/-/g, ' ');
  const cityName = toTitleCase(rawCity);

  let cityData: CityData | null = null;
  try {
    const { data } = await supabase
      .from('us_cities')
      .select('*')
      .ilike('city_ascii', cityName)
      .like('zips', `%${zip}%`)
      .single();
    cityData = data as CityData;
  } catch (err) {
    console.error('Error fetching city data:', err);
  }

  if (!cityData) {
    return <div className="text-red-600 p-4">No data found for {cityName} (ZIP {zip})</div>;
  }

  const displayName = cityData.city || cityName;
  const stateName = cityData.state_name || '';

  const slugUrl = getSlugFromCity(cityData.city_ascii, zip);
  const nearbyCities = await getNearbyCities(cityData.id, cityData.state_id);

  let cityImage = cityData.image_url || null;
  let cityImageAlt = cityData.image_alt || `View of ${displayName}, ${stateName}`;
  let cityImageCredit = '';

  if (!cityImage) {
    try {
      const image = await fetchCityImageFromPexels(cityName, stateName);
      cityImage = image.url;
      cityImageAlt = image.alt;

      if (cityImage && cityData.id) {
        await supabase
          .from('us_cities')
          .update({
            image_url: image.url,
            image_alt: image.alt,
            photographer: image.photographer,
            image_source_url: image.source_url,
          })
          .eq('id', cityData.id);
      }

      if (image.photographer && image.source_url) {
        cityImageCredit = `Photo by ${image.photographer}`;
      }
    } catch (err) {
      console.error('Error fetching image from Pexels:', err);
    }
  } else if (cityData.photographer && cityData.image_source_url) {
    cityImageCredit = `Photo by ${cityData.photographer}`;
  }

  const markerLat = cityData?.lat;
  const markerLon = cityData?.lng;
  let policeStations = [];

  try {
    const overpassUrl = `https://overpass-api.de/api/interpreter?data=[out:json];node[amenity=police](around:10000,${markerLat},${markerLon});out tags center;`;
    const overpassRes = await fetch(overpassUrl);
    const overpassData = await overpassRes.json();
    policeStations = overpassData?.elements || [];
  } catch (err) {
    console.error('Error fetching police data from Overpass:', err);
  }

  const articleText = cityData ? generateCitySeoText(cityData) : '';
  const reports: string[] = cityData ? exampleReports(cityData) : [];
  const today = formatDate(new Date());

  return (
    <main className="bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto space-y-16">
        <section className="text-center bg-gradient-to-r from-blue-50 to-white py-12 px-4 rounded-xl shadow-md">
          <h1 className="text-4xl font-bold text-gray-900">Lost &amp; Found in {displayName}</h1>
          <p className="mt-2 text-sm text-gray-500">{today}</p>
          <p className="mt-4 text-lg text-gray-600 max-w-2xl mx-auto">
            Discover how to recover your lost item — from local hotspots to practical advice.
          </p>
        </section>

        <section className="bg-gray-100 p-6 rounded-lg shadow flex flex-col md:flex-row gap-6 items-start">
          <div className="md:w-1/2 w-full h-[300px]">
            <CityMap stations={policeStations} />
          </div>

          <div className="md:w-1/2 w-full prose max-w-none prose-sm sm:prose-base text-gray-700">
            <h2 className="text-xl font-semibold text-gray-800 mb-2">🔍 Recently reported lost items in {displayName}</h2>
            <ul className="text-gray-700 list-none space-y-2 pl-0">
              {reports.map((report, index) => (
                <li key={index} className="pl-6 relative flex items-start">
                  <span className="absolute left-0 top-0">• 📍</span>
                  <span className="block ml-4 break-words">{report}</span>
                </li>
              ))}
            </ul>
          </div>
        </section>

        <section className="bg-blue-50 p-6 rounded-lg shadow">
          <h2 className="text-2xl font-semibold text-blue-800 mb-4">📝 Report your lost item or upload a found one</h2>
          <p className="text-gray-700 mb-6">
            Fill out the form below with as many details as possible to increase your chances of recovering the lost item.
          </p>
          <ReportFormPage defaultCity={displayName} />
        </section>

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
          <div className="whitespace-pre-line">{articleText.split('---').slice(1).join('---')}</div>
        </section>

        {nearbyCities.length > 0 && (
          <section className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">Nearby Cities</h2>
            <ul className="list-disc list-inside text-gray-700">
              {nearbyCities.map((city: any) => {
                const cityZip = city.zips?.match(/\b\d{5}\b/)?.[0];
                return (
                  <li key={city.id}>
                    <Link href={`/lost-and-found/${getSlugFromCity(city.city_ascii, cityZip)}`} className="text-blue-600 hover:underline">
                      {city.city_ascii} ({cityZip})
                    </Link>
                  </li>
                );
              })}
            </ul>
          </section>
        )}
      </div>
    </main>
  );
}