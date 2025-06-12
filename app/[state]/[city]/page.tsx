'use client';

import { createClient } from '@supabase/supabase-js';
import ReportForm from '../../../components/ReportForm';
import '../../../app/globals.css';
import Image from 'next/image';
import Link from 'next/link';
import { Search, MapPin, ShieldCheck, Clock, Send, Info, FileText } from 'lucide-react';

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

  const { data } = await supabase
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

  return (
    <main className="bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-5xl mx-auto space-y-12">
        <section className="text-center">
          <h1 className="text-3xl font-bold text-gray-900">Lost & Found in {displayName}, {stateName}</h1>
          <p className="text-gray-600 mt-2 max-w-xl mx-auto">
            {displayName} is located in {county || 'its county'}. ZIP code: {zip || 'N/A'}. It has approximately {pop || 'many'} residents and a density of {density || 'unknown'} people/km². The city operates in the {timezone || 'local'} timezone.
          </p>
        </section>

        <section className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-2xl font-semibold text-blue-800 mb-4">📝 Report your lost item</h2>
          <p className="text-gray-700 mb-6">Fill out the form below with as many details as possible to increase your chances of recovering the lost item.</p>
          <ReportForm defaultCity={displayName} />
        </section>

        <section className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-2xl font-semibold text-blue-800 mb-4 flex items-center gap-2"><Search size={20} />Common Places to Lose Items</h2>
          <ul className="list-disc list-inside text-gray-700 space-y-1">
            <li>Public transportation stations</li>
            <li>Parks and recreational areas</li>
            <li>Shopping centers and malls</li>
            <li>Universities, libraries, and museums</li>
            <li>Airports and large venues</li>
          </ul>
        </section>

        <section className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-2xl font-semibold text-blue-800 mb-4 flex items-center gap-2"><MapPin size={20} />Where to Look First</h2>
          <ul className="text-gray-700 space-y-2">
            <li>Check nearby police stations, community centers, or local lost & found offices.</li>
            <li>Use <a href="https://www.google.com/maps/timeline" className="text-blue-600 underline" target="_blank">Google Maps Timeline</a> to retrace your steps.</li>
            <li>Search Facebook groups like <a href={`https://www.facebook.com/search/top?q=lost%20and%20found%20${displayName}`} className="text-blue-600 underline" target="_blank">Lost & Found {displayName}</a>.</li>
          </ul>
        </section>

        <section className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-2xl font-semibold text-blue-800 mb-4 flex items-center gap-2"><ShieldCheck size={20} />How We Help</h2>
          <p className="text-gray-700">We consolidate your information and contact the right people for you, including transport companies, local authorities, and community networks. Our team follows up to ensure your report gets noticed.</p>
        </section>

        <section className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-2xl font-semibold text-blue-800 mb-4 flex items-center gap-2"><Clock size={20} />Why Act Quickly?</h2>
          <p className="text-gray-700">Many lost items are only kept for a few days in official services before being donated or discarded. Time is of the essence – don’t wait to file your report!</p>
        </section>

        <section className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-2xl font-semibold text-blue-800 mb-4 flex items-center gap-2"><Send size={20} />Broadcast Your Report</h2>
          <p className="text-gray-700">We publish your report anonymously (unless otherwise requested) and share it across social networks and local groups to increase its visibility and reach.</p>
        </section>

        <section className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-2xl font-semibold text-blue-800 mb-4 flex items-center gap-2"><Info size={20} />Need Help?</h2>
          <p className="text-gray-700">Visit our <Link href="/help" className="text-blue-600 underline">Help Center</Link> or <Link href="/contact" className="text-blue-600 underline">Contact Us</Link> if you need assistance or have questions about the process.</p>
        </section>

        <section className="text-center">
          <Link href="/reportform">
            <button className="mt-6 bg-blue-700 text-white px-6 py-3 rounded-lg hover:bg-blue-800 font-semibold">
              Report a Lost Item Now
            </button>
          </Link>
        </section>
      </div>
    </main>
  );
}
