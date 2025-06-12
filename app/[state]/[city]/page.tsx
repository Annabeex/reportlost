'use client';

import { createClient } from '@supabase/supabase-js';
import ReportForm from '../../../components/ReportForm';
import '../../../app/globals.css';
import { getRedditPosts } from '@/lib/getRedditPosts';
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

export default async function Page({ params }: Props) {
  const rawCity = decodeURIComponent(params.city).replace(/-/g, ' ');
  const rawState = decodeURIComponent(params.state).replace(/-/g, ' ');
  const cityName = toTitleCase(rawCity);
  const stateName = toTitleCase(rawState);

  const { data, error } = await supabase
    .from('us_cities')
    .select('*')
    .eq('city', cityName)
    .eq('state_name', stateName)
    .order('population', { ascending: false })
    .limit(1);

  const cityData = data?.[0];
  const displayName = cityData?.city || cityName;
  const county = cityData?.county_name;
  const pop = cityData?.population ? cityData.population.toLocaleString() : undefined;
  const density = cityData?.density;
  const timezone = cityData?.timezone;
  const zip = cityData?.zips?.match(/\b\d{5}\b/)?.[0];
  const citySlug = params.city.toLowerCase().replace(/\s+/g, '');
  const stateSlug = params.state.toLowerCase().replace(/\s+/g, '');
  const cityWebsite = `https://www.${citySlug}.gov`;
  const redditPosts = await getRedditPosts(citySlug);

  const googlePlacesSearch = [
    'airport',
    'train station',
    'bus station',
    'public library',
    'shopping mall',
    'university',
    'hospital',
    'city hall',
    'zoo',
    'museum'
  ];

  return (
    <main className="min-h-screen bg-gray-100">
      <header className="bg-white shadow px-6 py-8 text-center">
        <h1 className="text-3xl font-bold text-gray-900">Lost & Found in {displayName}, {stateName}</h1>
        <p className="text-gray-600 mt-2">Helping residents and visitors recover lost items.</p>
      </header>

      <section className="px-4 py-10 max-w-6xl mx-auto grid md:grid-cols-2 gap-8">
        <div>
          <Image src="/images/usa-map-gray.svg" alt="Map" width={600} height={400} className="rounded-lg shadow" />
          <div className="mt-6 bg-white p-6 rounded-lg shadow">
            <h2 className="text-xl font-semibold text-blue-800 mb-2">City Information</h2>
            <p className="text-gray-700 whitespace-pre-line">
              {displayName} is located in {county || 'its county'}, ZIP code {zip || 'N/A'}. It has approximately {pop || 'many'} residents and a density of {density || 'unknown'} people/km². The city operates in the {timezone || 'local'} timezone.
            </p>
          </div>
        </div>

        <div>
          <div className="bg-white p-6 rounded-lg shadow mb-6">
            <h2 className="text-xl font-semibold text-blue-800 mb-2">Report a Lost Item</h2>
            <p className="text-gray-700 mb-4">Fill out the form below to report a lost object in {displayName}. Include as many details as possible.</p>
            <ReportForm defaultCity={displayName} />
          </div>

          <div className="bg-white p-6 rounded-lg shadow mb-6">
            <h2 className="text-xl font-semibold text-blue-800 mb-2">Where to Check Locally</h2>
            <ul className="list-disc list-inside text-gray-700 space-y-2">
              <li>Nearest <a href={`https://www.google.com/maps/search/police+station+near+${displayName}`} target="_blank" className="text-blue-600 underline">police station</a></li>
              <li><a href={`https://www.facebook.com/search/top?q=lost%20and%20found%20${displayName}`} target="_blank" className="text-blue-600 underline">Facebook Lost & Found - {displayName}</a></li>
              <li><a href={cityWebsite} target="_blank" className="text-blue-600 underline">Local city portal</a></li>
              <li>Use <a href="https://www.google.com/maps/timeline" target="_blank" className="text-blue-600 underline">Google Maps Timeline</a> to retrace your steps</li>
            </ul>
          </div>

          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-xl font-semibold text-blue-800 mb-2">Frequent Lost Item Locations</h2>
            <ul className="list-disc list-inside text-gray-700 space-y-2">
              {googlePlacesSearch.map(place => (
                <li key={place}>
                  <a
                    href={`https://www.google.com/maps/search/${encodeURIComponent(place)}+near+${encodeURIComponent(displayName)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 underline"
                  >
                    {place.charAt(0).toUpperCase() + place.slice(1)} near {displayName}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>
    </main>
  );
}
