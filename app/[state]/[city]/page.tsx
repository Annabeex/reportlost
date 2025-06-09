// === app/[state]/[city]/page.tsx ===
import { createClient } from '@supabase/supabase-js';
import ReportForm from '../../../components/ReportForm';
import { getRedditPosts } from '@/lib/getRedditPosts';
import '../../../app/globals.css';

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

  if (error) {
    console.error('Supabase query error:', error.message || error);
  }

  const cityData = data?.[0];
  const displayName = cityData?.city || cityName;
  const county = cityData?.county_name;
  const pop = cityData?.population ? cityData.population.toLocaleString() : undefined;
  const density = cityData?.density;
  const timezone = cityData?.timezone;
  const zip = cityData?.zips?.match(/\b\d{5}\b/)?[0];

  const seoText = `
Located in ${county ? `${county} County, ` : ''}${displayName}${zip ? ` (ZIP code: ${zip})` : ''} is home to approximately ${pop ?? 'many'} residents.
With a population density of ${density ?? 'unknown'} people per square kilometer, it's no surprise that lost items are a common concern.
Every day, residents misplace phones, wallets, keys, and backpacks — especially in public places like bus stations, parks, and cafés.

This page exists to help the people of ${displayName} report and find lost belongings. Our system is simple and free to use.
Whether you dropped your glasses in a taxi or left your backpack at the gym, your item might be just a report away from being returned.

${displayName} belongs to the ${timezone ?? 'local'} timezone, meaning coordination with local businesses and institutions is efficient when an item is found.
In addition to your report, our platform may soon include tips from nearby lost-and-found offices and updates from the community.

Help us build a connected and responsive city — start by submitting your lost item report below.`;

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
          <p className="text-gray-700 whitespace-pre-line">{seoText}</p>

          <section>
            <h2 className="text-xl font-semibold text-blue-800 mb-2">
              Report your lost item
            </h2>
            <p className="text-gray-700 mb-4">
              Please fill out the form below to report a lost object. Include as much detail as possible — location, description, and date — to maximize the chances of recovery.
            </p>
            <ReportForm defaultCity={displayName} />
          </section>

          <section>
            <h2 className="text-xl font-semibold text-blue-800 mb-2">
              Commonly Lost Items in {displayName}
            </h2>
            <p className="text-gray-700">
              Wallets, phones, backpacks, glasses, and keys are among the most commonly reported lost items in {displayName}.
              Whether left behind in a ride-share, at a restaurant, or lost during an event, these items are often recovered and returned thanks to detailed lost and found reports.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-blue-800 mb-2">
              Where do people usually lose items?
            </h2>
            <ul className="list-disc pl-6 text-gray-700 space-y-1">
              <li>Metro and bus lines</li>
              <li>Airports and train stations</li>
              <li>Shopping malls, cafes, and public libraries</li>
              <li>Festivals, concerts, and sports venues</li>
              <li>Parks, schools, and public buildings</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-blue-800 mb-2">
              Tips & Local Contacts for {displayName}
            </h2>
            <p className="text-gray-700 mb-2">
              For help retrieving lost items in {displayName}, consider these local resources:
            </p>
            <ul className="list-disc pl-6 text-gray-700 space-y-1">
              <li>
                Visit the official website: <a href={cityWebsite} className="text-blue-700 underline" target="_blank">{cityWebsite}</a>
              </li>
              <li>
                Contact local transit authorities: <a href={transitWebsite} className="text-blue-700 underline" target="_blank">{transitWebsite}</a>
              </li>
              <li>
                Search local Reddit posts: <a href={`https://www.reddit.com/r/${citySlug}`} className="text-blue-700 underline" target="_blank">r/{citySlug}</a>
              </li>
            </ul>
          </section>

          {redditPosts.length > 0 && (
            <section>
              <h2 className="text-xl font-semibold text-blue-800 mb-2">
                Latest Reddit Mentions in r/{citySlug}
              </h2>
              <ul className="list-disc pl-6 text-gray-700 space-y-1">
                {redditPosts.map(post => (
                  <li key={post.id}>
                    <a href={post.url} target="_blank" className="text-blue-700 underline">
                      {post.title}
                    </a>
                  </li>
                ))}
              </ul>
            </section>
          )}
        </div>
      </div>
    </main>
  );
}

