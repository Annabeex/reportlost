import { notFound } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import fetchCityImageDirectly from '@/lib/fetchCityImageDirectly';
import { exampleReports } from '@/lib/lostitems';
import { getNearbyCities } from '@/lib/getNearbyCities';
import ClientReportForm from '@/components/ClientReportForm';
import { fromCitySlug, buildCityPath } from '@/lib/slugify';
import { createClient } from '@supabase/supabase-js';
import dynamic from 'next/dynamic';

const CityMap = dynamic(() => import('@/components/Map').then(mod => mod.default), {
  ssr: false,
  loading: () => <div className="text-gray-400">Chargement de la carte...</div>,
});

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

function toTitleCase(str: string) {
  return str
    .toLowerCase()
    .split(' ')
    .map(w => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');
}

function formatDate(date: Date) {
  return date.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
}

export default async function Page({ params }: { params: { state: string; city: string } }) {
  // ✅ récupération des paramètres d’URL
  const state = (params.state || '').toLowerCase();
  const cityName = toTitleCase(fromCitySlug(decodeURIComponent(params.city)));

  // ✅ requête Supabase : ville par state_id + city_ascii
  const { data: cityData } = await supabase
    .from('us_cities')
    .select('*')
    .eq('state_id', state.toUpperCase())
    .ilike('city_ascii', cityName)
    .maybeSingle();

  if (!cityData) {
    return <div className="text-red-600 p-4">Aucune donnée trouvée pour {cityName} ({state.toUpperCase()})</div>;
  }

  // Parsing JSON → objets
  ['parks', 'malls', 'tourism_sites'].forEach((field) => {
    if (typeof (cityData as any)[field] === 'string') {
      try {
        (cityData as any)[field] = JSON.parse((cityData as any)[field]);
      } catch {
        (cityData as any)[field] = [];
      }
    }
  });

  const title = cityData.static_title || `Lost something in ${cityData.city_ascii}?`;
  const text = cityData.static_content || '';
  const today = formatDate(new Date());
  const reports = exampleReports(cityData);
  const nearbyCities = await getNearbyCities(cityData.id, cityData.state_id);

  // ✅ Image ville
  let cityImage = cityData.image_url;
  let cityImageAlt = cityData.image_alt || `Vue de ${cityName}`;
  let cityImageCredit = '';

  const isDev = process.env.NODE_ENV !== 'production';
  if (!cityImage && isDev) {
    try {
      const image = await fetchCityImageDirectly(cityName, cityData.state_name);
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

      cityImageCredit = image.photographer ? `Photo par ${image.photographer}` : '';
    } catch (err) {
      console.warn('Impossible de récupérer une image pour la ville :', err);
    }
  }

  // ✅ Postes de police via Overpass
  let policeStations: any[] = [];
  try {
    const overpassUrl = `https://overpass-api.de/api/interpreter?data=[out:json];node[amenity=police](around:10000,${cityData.lat},${cityData.lng});out tags center;`;
    const res = await fetch(overpassUrl, { next: { revalidate: 3600 } });
    const data = await res.json();
    policeStations = data.elements;
  } catch (err) {
    console.warn('Échec du fetch des postes de police :', err);
  }

  // ✅ Texte enrichi avec icônes
  const enrichedText = `<p>${(text || '')
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
        {/* Titre */}
        <section className="text-center py-10 px-4 bg-gradient-to-r from-blue-50 to-white rounded-xl shadow">
          <h1 className="text-3xl sm:text-4xl font-bold text-gray-900">{title}</h1>
        </section>

        {/* Liste d’exemples + carte */}
        <section className="bg-white p-6 rounded-xl shadow flex flex-col lg:flex-row gap-8">
          <div className="lg:w-1/2 w-full prose text-gray-800">
            <h2 className="text-xl font-semibold text-blue-900 mb-3">
              🔍 Objets perdus récemment signalés à {cityData.city_ascii} – mis à jour le {today}
            </h2>
            <ul className="list-none space-y-2 pl-0">
              {reports.map((r: string, i: number) => (
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

        {/* Formulaire dépôt */}
        <section className="bg-blue-100 py-10 px-6 rounded-xl shadow">
          <ClientReportForm defaultCity={`${cityData.city_ascii} (${cityData.state_id})`} />
        </section>

        {/* Texte enrichi */}
        <section className="bg-white p-6 rounded-xl shadow">
          <div
            className="text-gray-800 leading-relaxed text-base [&>p]:mb-4"
            dangerouslySetInnerHTML={{ __html: enrichedText }}
          />
        </section>

        {/* Villes proches */}
        {nearbyCities.length > 0 && cityImage && (
          <section className="bg-white p-6 rounded-xl shadow flex flex-col lg:flex-row gap-8 items-start">
            <div className="lg:w-1/2 w-full">
              <h2 className="text-xl font-semibold text-gray-800 mb-4">Villes à proximité</h2>
              <ul className="list-disc list-inside text-gray-700">
                {nearbyCities.map((city: any) => (
                  <li key={city.id}>
                    <Link
                      href={buildCityPath(city.state_id, city.city_ascii)}
                      className="text-blue-600 hover:underline"
                    >
                      {city.city_ascii} ({city.state_id.toUpperCase()})
                    </Link>
                  </li>
                ))}
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
