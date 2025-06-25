import { createClient } from '@supabase/supabase-js';
import ReportForm from '@/components/ReportForm';
import '../../../app/globals.css';
import Image from 'next/image';
import fetchCityImageFromPexels from '@/lib/fetchCityImageFromPexels';

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

export default async function Page({ params }: { params: { state: string; city: string } }) {
  const rawCity = decodeURIComponent(params.city).replace(/-/g, ' ');
  const rawState = decodeURIComponent(params.state).replace(/-/g, ' ');
  const cityName = toTitleCase(rawCity);
  const stateName = toTitleCase(rawState);

  const { data } = await supabase
    .from('us_cities')
    .select('*')
    .eq('city', cityName)
    .eq('state_name', stateName)
    .order('population', { ascending: false })
    .limit(1);

  const cityData = data?.[0];
  const displayName = cityData?.city || cityName;

  let cityImage = cityData?.image_url || null;
  let cityImageAlt = cityData?.image_alt || `View of ${displayName}, ${stateName}`;
  let cityImageCredit = '';

  if (!cityImage) {
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
  } else if (cityData?.photographer && cityData?.image_source_url) {
    cityImageCredit = `Photo by ${cityData.photographer}`;
  }

  const overpassUrl = `https://overpass-api.de/api/interpreter?data=[out:json];node[amenity=police](around:10000,${cityData.latitude},${cityData.longitude});out;`;
  const overpassRes = await fetch(overpassUrl);
  const overpassData = await overpassRes.json();
  const police = overpassData?.elements?.[0];
  const markerLat = police?.lat || cityData?.latitude;
  const markerLon = police?.lon || cityData?.longitude;
  const policeName = police?.tags?.name || '';
  const bbox = `${markerLon - 0.05},${markerLat - 0.03},${markerLon + 0.05},${markerLat + 0.03}`;
  const policeMarkerUrl = `https://www.openstreetmap.org/export/embed.html?bbox=${bbox}&layer=mapnik&marker=${markerLat},${markerLon}`;

  const articleText = cityData?.seo_text || '';
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

        {/* SECTION 1 - MAP + TEXT */}
        <section className="bg-gray-100 p-6 rounded-lg shadow flex flex-col md:flex-row gap-6 items-center">
          <div className="md:w-1/2 w-full h-80">
            <iframe
              title="map"
              className="rounded-lg shadow-md w-full h-full"
              loading="lazy"
              allowFullScreen
              src={policeMarkerUrl}
            ></iframe>
            {policeName && (
              <p className="text-sm text-center text-gray-600 mt-2">Closest police station: {policeName}</p>
            )}
          </div>
          <div className="md:w-1/2 w-full">
            <section className="bg-white p-6 rounded-lg shadow prose max-w-none prose-sm sm:prose-base text-gray-700">
              <div className="whitespace-pre-line">{articleText.split('---')[1]}</div>
            </section>
          </div>
        </section>

        {/* SECTION 2 - FORMULAIRE */}
        <section className="bg-blue-50 p-6 rounded-lg shadow">
          <h2 className="text-2xl font-semibold text-blue-800 mb-4">📝 Report your lost item</h2>
          <p className="text-gray-700 mb-6">
            Fill out the form below with as many details as possible to increase your chances of recovering the lost item.
          </p>
          <ReportForm defaultCity={displayName} />
        </section>

        {/* SECTION 3 - IMAGE + TEXTE */}
        {cityImage && (
          <section className="bg-white p-6 rounded-lg shadow flex flex-col md:flex-row gap-6 items-center">
            <div className="md:w-1/2 w-full relative rounded-lg overflow-hidden">
              <Image
                src={cityImage}
                alt={cityImageAlt}
                width={600}
                height={400}
                className="w-full h-auto rounded-lg shadow-md object-cover opacity-80"
              />
              {cityImageCredit && (
                <p className="text-xs text-gray-500 mt-1 text-center">{cityImageCredit}</p>
              )}
            </div>
            <div className="md:w-1/2 w-full">
              <section className="bg-white p-6 rounded-lg shadow prose max-w-none prose-sm sm:prose-base text-gray-700">
                <div className="whitespace-pre-line">{articleText.split('---')[0]}</div>
              </section>
            </div>
          </section>
        )}

        {/* SECTION 4 - TEXTE FINAL */}
        <section className="bg-white p-6 rounded-lg shadow prose max-w-none prose-sm sm:prose-base text-gray-700">
          <div className="whitespace-pre-line">{articleText.split('---').slice(2).join('---')}</div>
        </section>
      </div>
    </main>
  );
}
