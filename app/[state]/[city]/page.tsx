'use client';

import { createClient } from '@supabase/supabase-js';
import ReportForm from '../../../components/ReportForm';
import '../../../app/globals.css';
import Image from 'next/image';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

interface Props {
  params: { state: string; city: string };
}

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

async function fetchCityImageFromPexels(city: string, state: string): Promise<{ url: string | null; alt: string; photographer: string | null; source_url: string | null }> {
  const query = `${city} ${state} skyline`;
  const res = await fetch(`https://api.pexels.com/v1/search?query=${encodeURIComponent(query)}&per_page=1`, {
    headers: {
      Authorization: process.env.PEXELS_API_KEY!
    }
  });

  const data = await res.json();
  const photo = data.photos?.[0];
  return {
    url: photo?.src?.large || null,
    alt: photo?.alt || `Skyline of ${city}, ${state} – aerial view`,
    photographer: photo?.photographer || null,
    source_url: photo?.url || null
  };
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

`;
      section.names.forEach((name: string) => {
        text += `- ${name}\n`;
      });
      text += `\nThese places are busy and regularly cleaned, improving the chances of recovering lost items.\n\n`;
    }
  });

  text += `---\n\n### Who to contact in case of loss?\n\nIf you’ve lost something in ${city}, start by contacting:\n\n- Local police department\n- Public transportation Lost & Found\n- Airports or stations if applicable\n- The last venue you visited (restaurant, mall, park, etc.)\n\nReacting quickly increases your recovery chances significantly.\n\n---\n\n### Local info: ${city}, ${state_name}\n\n${city} is located in ${county_name || 'its county'}, ${state_name}, with a population of approximately ${pop} and a density of ${dens}. The main ZIP code is ${zip || 'unknown'}, and it lies in the ${timezone || 'local'} timezone.\n\nPage updated on ${today}.\n\n`;

  text += `---\n\n### Most commonly lost items\n- Phones and electronics\n- Wallets and credit cards\n- Keys (house, car, office)\n- Glasses (sun and prescription)\n- Clothing and accessories\n`;

  return text;
}

export default async function Page({ params }: Props) {
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
        .update({ image_url: cityImage, image_alt: cityImageAlt, photographer: image.photographer, image_source_url: image.source_url })
        .eq('id', cityData.id);
    }
    if (image.photographer && image.source_url) {
      cityImageCredit = `Photo by ${image.photographer} on Pexels`;
    }
  } else if (cityData?.photographer && cityData?.image_source_url) {
    cityImageCredit = `Photo by ${cityData.photographer} on Pexels`;
  }

  const articleText = cityData ? generateCitySeoText(cityData) : '';

  return (
    <main className="bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto space-y-16">
        <section className="text-center bg-gradient-to-r from-blue-50 to-white py-12 px-4 rounded-xl shadow-md">
          <h1 className="text-4xl font-bold text-gray-900">
            Lost &amp; Found in {displayName}
          </h1>
          <p className="mt-4 text-lg text-gray-600 max-w-2xl mx-auto">
            Discover how to recover your lost item in {displayName} — from local hotspots to practical advice.
          </p>
        </section>

        {cityImage && (
          <div className="flex flex-col md:flex-row items-start gap-6">
            <div className="md:w-1/2 w-full">
              <Image
                src={cityImage}
                alt={cityImageAlt}
                width={600}
                height={400}
                className="w-full h-auto rounded-lg shadow-md object-cover"
              />
              {cityImageCredit && (
                <p className="text-xs text-gray-500 mt-1 text-center">{cityImageCredit}</p>
              )}
            </div>
            <div className="md:w-1/2 w-full">
              <section className="bg-white p-6 rounded-lg shadow prose max-w-none prose-sm sm:prose-base text-gray-700">
                <div className="whitespace-pre-line">{articleText}</div>
              </section>
            </div>
          </div>
        )}

        <section className="bg-blue-50 p-6 rounded-lg shadow">
          <h2 className="text-2xl font-semibold text-blue-800 mb-4">📝 Report your lost item</h2>
          <p className="text-gray-700 mb-6">
            Fill out the form below with as many details as possible to increase your chances of recovering the lost item.
          </p>
          <ReportForm defaultCity={displayName} />
        </section>

        <section className="flex flex-col md:flex-row items-center gap-10">
          <div className="w-full md:w-1/2">
            <Image
              src="/images/lost-woman-phone.jpg"
              alt="Woman looking for a lost item"
              width={600}
              height={400}
              className="rounded-lg shadow-md"
            />
          </div>
          <div className="w-full md:w-1/2 space-y-6">
            <h2 className="text-3xl md:text-4xl font-extrabold text-gray-900 leading-snug">
              What to do if you lost something in <span className="text-blue-700">{displayName}</span>?
            </h2>
            <div className="space-y-6">
              <div className="border-l-4 border-red-100 pl-4">
                <h3 className="text-xl font-semibold text-gray-800">Identify the exact location</h3>
                <p className="text-gray-600">
                  Determine where the loss happened: public transit, a shop, park or event. This helps refine your search.
                </p>
              </div>
              <div className="border-l-4 border-red-100 pl-4">
                <h3 className="text-xl font-semibold text-gray-800">Act quickly</h3>
                <p className="text-gray-600">
                  The first 24 hours matter most. Reach out to venues and authorities without delay.
                </p>
              </div>
              <div className="border-l-4 border-red-100 pl-4">
                <h3 className="text-xl font-semibold text-gray-800">Document your loss</h3>
                <p className="text-gray-600">
                  Write down key details: description, photos, serial number, context.
                </p>
              </div>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
