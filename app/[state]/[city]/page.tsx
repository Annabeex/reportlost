// === app/[state]/[city]/page.tsx ===
import { createClient } from '@supabase/supabase-js';
import ReportForm from '../../../components/ReportForm';
import '../../../app/globals.css';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

interface Props {
  params: { state: string; city: string };
}

export default async function Page({ params }: Props) {
  const cityName = decodeURIComponent(params.city).replace(/-/g, ' ').toLowerCase();
  const stateName = decodeURIComponent(params.state).replace(/-/g, ' ').toLowerCase();

  const { data, error } = await supabase
    .from('us_cities')
    .select('*')
    .ilike('city', cityName)
    .ilike('state_name', stateName);

  if (error) {
    console.error('Supabase query error:', error.message || error);
  }

  const cityData = data?.[0];
  const displayName = cityData?.city || params.city;
  const county = cityData?.county_name;
  const pop = cityData?.population?.toLocaleString();
  const density = cityData?.density;
  const timezone = cityData?.timezone;
  const zip = cityData?.zips;

  const introVariants = [
    `If you lost something in ${displayName}, don't panic — lost items are found every day in ${county} County.`,
    `${displayName} residents often report misplaced phones, keys or bags.`,
    `Every day, items lost in ${displayName} — a city of ${pop} people — are recovered and returned.`,
    `Thanks to online tools like this one, recovering lost items in ${displayName} (${zip}) is easier than ever.`,
    `${displayName} (${county}, ${timezone}) has an active community that regularly reports and returns lost objects.`,
    `In a city like ${displayName} with a density of ${density} people/km², things often get misplaced but also quickly found.`,
    `Looking for a lost object in ${displayName}? Start by filing a report below.`,
    `${displayName}, ${stateName} is part of a growing network of communities helping return lost items.`,
    `Misplaced something in ${displayName}? Let others help you find it.`,
    `Report and search for lost items across ${county}, starting here in ${displayName}.`,
    `In ${displayName}, returning lost objects is part of daily civic life.`,
    `Find or report lost belongings around ${displayName}, ${stateName} with this form.`,
    `Don't give up hope — every day, ${displayName} citizens find and return lost items.`,
    `File a report and get help locating your item in ${displayName}.`,
    `Local transit, events, and parks in ${displayName} are common places for lost items — and where they’re often found.`,
    `This page helps residents of ${displayName} reconnect with their belongings.`,
    `${displayName} (${stateName}) residents use this service daily to report missing belongings.`,
    `Found something? Report it for someone in ${displayName} — they may be searching for it.`,
    `Start your search here for any object lost recently in ${displayName}.`,
    `The people of ${displayName} help each other recover what's lost — this form is the first step.`
  ];

  const introText = introVariants[Math.floor(Math.random() * introVariants.length)];

  return (
    <main className="bg-gray-100 min-h-screen py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <header className="bg-blue-900 text-white py-6 px-4 rounded-t-xl shadow">
          <h1 className="text-3xl font-bold text-center">
            Lost and Found in {displayName}, {stateName}
          </h1>
        </header>

        <div className="bg-white p-6 rounded-b-xl shadow space-y-8">
          <p className="text-gray-700">{introText}</p>

          <section>
            <h2 className="text-xl font-semibold text-blue-800 mb-2">
              Where do people usually lose items?
            </h2>
            <ul className="list-disc pl-6 text-gray-700 space-y-1">
              <li>Metro and bus lines</li>
              <li>Airports</li>
              <li>Shopping malls and libraries</li>
              <li>Events and entertainment venues</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-blue-800 mb-2">
              Report your item below
            </h2>
            <ReportForm defaultCity={displayName} />
          </section>
        </div>
      </div>
    </main>
  );
}
