import { createClient } from '@supabase/supabase-js';
import ReportForm from '../../../components/ReportForm';
import '../../../app/globals.css';
import { getRedditPosts } from '@/lib/getRedditPosts';

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
  const transitWebsite = `https://www.transit.${stateSlug}.gov`;
  const subredditName = citySlug;
  const redditPosts = await getRedditPosts(subredditName);

  return (
    <main className="bg-gray-100 min-h-screen py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <header className="bg-blue-900 text-white py-6 px-4 rounded-t-xl shadow">
          <h1 className="text-3xl font-bold text-center">
            Lost and Found in {displayName}, {stateName}
          </h1>
        </header>

        <div className="bg-white p-6 rounded-b-xl shadow space-y-8">
          <p className="text-gray-700 whitespace-pre-line">
            Located in {county ? `${county} County, ` : ''}{displayName}{zip ? ` (ZIP code: ${zip})` : ''} is home to approximately {pop ?? 'many'} residents.
            With a population density of {density ?? 'unknown'} people per square kilometer, it's no surprise that lost items are a common concern...
          </p>

          <section>
            <h2 className="text-xl font-semibold text-blue-800 mb-2">Report your lost item</h2>
            <p className="text-gray-700 mb-4">
              Please fill out the form below to report a lost object. Include as much detail as possible — location, description, and date — to maximize the chances of recovery.
            </p>
            <ReportForm defaultCity={displayName} />
          </section>

          {/* Les autres sections : objets perdus fréquents, lieux courants, contacts utiles, Reddit... */}
        </div>
      </div>
    </main>
  );
}
