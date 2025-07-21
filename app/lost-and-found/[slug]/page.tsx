import { createClient } from '@supabase/supabase-js';
import '../../../app/globals.css';
import Image from 'next/image';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import fetchCityImageDirectly from '@/lib/fetchCityImageDirectly'; // ✅ nouvelle fonction serveur
import { exampleReports } from '@/lib/lostitems';
import { getSlugFromCity } from '@/lib/getSlugFromCity';
import { getNearbyCities } from '@/lib/getNearbyCities';
import ClientReportForm from '@/components/ClientReportForm';

const CityMap = dynamic(() => import('@/components/Map').then(mod => mod.default), {
  ssr: false,
  loading: () => <div className="text-gray-400">Loading map...</div>,
});

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

export default async function Page({ params }: { params: { slug: string } }) {
  const slug = decodeURIComponent(params.slug);
  const zip = slug.split('-').slice(-1)[0];
  const rawCity = slug.replace(`-${zip}`, '').replace(/-/g, ' ');
  const cityName = toTitleCase(rawCity);

  const { data: cityData } = await supabase
    .from('us_cities')
    .select('*')
    .ilike('city_ascii', cityName)
    .like('zips', `%${zip}%`)
    .single();

  if (!cityData) {
    return <div className="text-red-600 p-4">No data found for {cityName} (ZIP {zip})</div>;
  }

  ['parks', 'malls', 'tourism_sites'].forEach((field) => {
    if (typeof cityData[field] === 'string') {
      try {
        cityData[field] = JSON.parse(cityData[field]);
      } catch {
        cityData[field] = [];
      }
    }
  });

  const title = cityData.static_title || `Lost something in ${cityData.city_ascii}?`;
  const text = cityData.static_content || '';
  const today = formatDate(new Date());
  const reports = exampleReports(cityData);
  const nearbyCities = await getNearbyCities(cityData.id, cityData.state_id);

  let cityImage = cityData.image_url;
  let cityImageAlt = cityData.image_alt || `View of ${cityName}`;
  let cityImageCredit = '';

  const isDev = process.env.NODE_ENV !== 'production';

  if (!cityImage && isDev) {
    try {
      const image = await fetchCityImageDirectly(cityName, cityData.state_name); // ✅ appel direct sans API route
      cityImage = image.url;
      cityImageAlt = image.alt;

      await supabase
        .from('us_cities')
        .update({
          image_url: image.url,
          image_alt: image.alt,
          photographer: image.photographer,
          image_source_url: image.source_url,
        })
        .eq('id', cityData.id);

      cityImageCredit = image.photographer ? `Photo by ${image.photographer}` : '';
    } catch (err) {
      console.warn('Could not fetch city image:', err);
    }
  }

  let policeStations = [];
  try {
    const overpassUrl = `https://overpass-api.de/api/interpreter?data=[out:json];node[amenity=police](around:10000,${cityData.lat},${cityData.lng});out tags center;`;
    const res = await fetch(overpassUrl, {
      next: { revalidate: 3600 },
    });
    const data = await res.json();
    policeStations = data.elements;
  } catch (err) {
    console.warn('Police station fetch failed:', err);
  }

  const enrichedText = `<p>${text
    .replace(/(\n\n|\n)/g, '\n')
    .replace(/(?<!\n)\n(?!\n)/g, '\n\n')
    .replace(/hotels?/gi, '🏨 hotels')
    .replace(/restaurants?/gi, '🍽️ restaurants')
    .replace(/malls?/gi, '🛍️ malls')
    .replace(/parks?/gi, '🌳 parks')
    .replace(/tourist attractions?/gi, '🧭 tourist attractions')
    .replace(/museum/gi, '🖼️ museum')
    .replace(/staff/gi, '👥 staff')
    .replace(/\n\n+/g, '</p><p>')
    .replace(/\n/g, ' ')}</p>`;

  return (
    <main className="bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto space-y-16">
        <section className="text-center py-10 px-4 bg-gradient-to-r from-blue-50 to-white rounded-xl shadow">
          <h1 className="text-3xl sm:text-4xl font-bold text-gray-900">{title}</h1>
        </section>

        <section className="bg-white p-6 rounded-xl shadow flex flex-col lg:flex-row gap-8">
          <div className="lg:w-1/2 w-full prose text-gray-800">
            <h2 className="text-xl font-semibold text-blue-900 mb-3">
              🔍 Recently reported lost items in {cityData.city_ascii} – updated this {today}
            </h2>
            <ul className="list-none space-y-2 pl-0">
              {reports.map((r, i) => (
                <li key={i} className="flex items-start gap-2">
                  <span className="text-blue-500">📍</span>
                  <span>{r}</span>
                </li>
              ))}
            </ul>
          </div>
          <div className="lg:w-1/2 w-full h-[300px] rounded-lg overflow-hidden shadow">
            <CityMap stations={policeStations} />
          </div>
        </section>

        <section className="bg-blue-100 py-10 px-6 rounded-xl shadow">
          <ClientReportForm defaultCity={cityData.city_ascii} />
        </section>

        <section className="bg-white p-6 rounded-xl shadow">
          <div
            className="text-gray-800 leading-relaxed text-base [&>p]:mb-4"
            dangerouslySetInnerHTML={{ __html: enrichedText }}
          />
        </section>

        {nearbyCities.length > 0 && cityImage && (
          <section className="bg-white p-6 rounded-xl shadow flex flex-col lg:flex-row gap-8 items-start">
            <div className="lg:w-1/2 w-full">
              <h2 className="text-xl font-semibold text-gray-800 mb-4">Nearby Cities</h2>
              <ul className="list-disc list-inside text-gray-700">
                {nearbyCities.map((city: any) => {
                  const zip = city.zips?.match(/\b\d{5}\b/)?.[0];
                  return (
                    <li key={city.id}>
                      <Link
                        href={`/lost-and-found/${getSlugFromCity(city.city_ascii, zip)}`}
                        className="text-blue-600 hover:underline"
                      >
                        {city.city_ascii} ({zip})
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </div>
            <div className="lg:w-1/2 w-full">
              <Image
                src={cityImage}
                alt={cityImageAlt}
                width={600}
                height={400}
                className="w-full h-[250px] object-cover rounded-lg shadow"
              />
              {cityImageCredit && (
                <p className="text-xs text-gray-500 mt-1 text-center">{cityImageCredit}</p>
              )}
            </div>
          </section>
        )}
      </div>
    </main>
  );
}
