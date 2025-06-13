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

function generateSeoText(cityData: any): string {
  const { city, state_name, population, density, timezone, zips, hotspots, county_name } = cityData;
  const zip = zips?.match(/\b\d{5}\b/)?.[0];
  const pop = population ? population.toLocaleString() : 'many';
  const dens = density ? `${density} people/km²` : 'unknown density';

  const getNames = (match: string[]) =>
    Array.isArray(hotspots)
      ? hotspots
          .filter((h: any) => typeof h.name === 'string' && match.some(keyword => h.name.toLowerCase().includes(keyword)))
          .map((h: any) => h.name)
      : [];

  const sections = [
    {
      key: 'parks',
      synonyms: ['green spaces', 'public parks', 'recreational areas'],
      names: getNames(['park'])
    },
    {
      key: 'attractions',
      synonyms: ['attractions', 'landmarks', 'popular sites'],
      names: getNames(['tour', 'attraction', 'landmark'])
    },
    {
      key: 'stations',
      synonyms: ['stations', 'transport hubs', 'main stops'],
      names: getNames(['station'])
    },
    {
      key: 'markets',
      synonyms: ['markets', 'shopping malls', 'retail centers'],
      names: getNames(['mall', 'market'])
    },
    {
      key: 'monuments',
      synonyms: ['memorials', 'historic sites', 'theaters'],
      names: getNames(['memorial', 'historic', 'theatre'])
    },
    {
      key: 'airports',
      synonyms: ['airport', 'air terminal', 'regional airport'],
      names: getNames(['airport'])
    }
  ];

  let text = `## Where are lost items frequently found in ${city}?

Lost something in ${city}? This city in ${state_name} features several emblematic places where lost items are often recovered.\n\n`;

  sections.forEach(section => {
    if (section.names.length) {
      const synonym = section.synonyms[Math.floor(Math.random() * section.synonyms.length)];
      text += `Among the most visited ${synonym}, you’ll find:\n\n`;
      section.names.slice(0, 5).forEach((name: string) => {
        text += `- ${name}\n`;
      });
      text += `\nThese areas are frequently visited and regularly cleaned, which increases the chances of finding your lost belongings.\n\n`;
    }
  });

  text += `---\n\n## Useful info about ${city}
${city} is located in ${county_name || 'its county'}, ${state_name}. It has approximately ${pop} inhabitants and a population density of ${dens}. The main ZIP code is ${zip || 'unknown'}, and it lies in the ${timezone || 'local'} timezone.\n\n`;

  text += `---\n\n## Most commonly lost items
- Phones and electronics
- Wallets and credit cards
- Keys (house, car, office)
- Glasses (sun and prescription)
- Clothing and accessories\n`;

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
  const articleText = cityData ? generateSeoText(cityData) : '';

  return (
    <main className="bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto space-y-12">
        <section className="text-center">
          <h1 className="text-3xl font-bold text-gray-900">Lost & Found in {displayName}, {stateName}</h1>
          <div className="text-gray-600 mt-2 max-w-3xl mx-auto whitespace-pre-line text-left prose prose-sm sm:prose-base">
            {articleText}
          </div>
        </section>

        <section className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-2xl font-semibold text-blue-800 mb-4">📝 Report your lost item</h2>
          <p className="text-gray-700 mb-6">Fill out the form below with as many details as possible to increase your chances of recovering the lost item.</p>
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
                  Determine exactly where you lost the item: street, public transport, store, restaurant or park. This information is crucial to target your search.
                </p>
              </div>
              <div className="border-l-4 border-red-100 pl-4">
                <h3 className="text-xl font-semibold text-gray-800">Act quickly</h3>
                <p className="text-gray-600">
                  The first 24 hours are critical. Immediately contact visited locations and relevant services to report your loss.
                </p>
              </div>
              <div className="border-l-4 border-red-100 pl-4">
                <h3 className="text-xl font-semibold text-gray-800">Document your loss</h3>
                <p className="text-gray-600">
                  Gather all relevant details: description, photos, serial number and the context of the disappearance.
                </p>
              </div>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
