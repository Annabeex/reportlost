// === app/cities/[city]/page.tsx ===
import { createClient } from '@supabase/supabase-js';
import ReportForm from '../../../components/ReportForm';
import '../../../app/globals.css';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

interface Props {
  params: { city: string };
}

export default async function Page({ params }: Props) {
  const cityName = decodeURIComponent(params.city).replace(/-/g, ' ').toLowerCase();
  console.log('Querying Supabase for:', cityName);

 const { data, error } = await supabase
  .from('us_cities')
  .select('*')
  .ilike('city', `%${cityName}%`);

console.log('Supabase result:', data);

if (error) {
  console.error('Supabase query error:', error.message || error);
} else {
  console.log('Supabase query succeeded');
}

  const cityData = data?.[0];
  const displayName = cityData?.city || 'this city';

  const suggestions = !cityData && Array.isArray(data) && data.length > 0
    ? data.map((c) => c.city).join(', ')
    : null;

  return (
    <main className="bg-gray-100 min-h-screen py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <header className="bg-blue-900 text-white py-6 px-4 rounded-t-xl shadow">
          <h1 className="text-3xl font-bold text-center">
            Lost and Found in {displayName}
          </h1>
        </header>

        <div className="bg-white p-6 rounded-b-xl shadow space-y-8">
          <p className="text-gray-700">
            If you lost an item in {displayName}, don’t panic. Every day, phones, wallets, bags, and keys are
            found and returned. This page helps you report a lost item and find helpful local resources.
          </p>

          {!cityData && suggestions && (
            <div className="bg-yellow-100 text-yellow-800 p-4 rounded">
              <p className="font-medium">Did you mean one of these?</p>
              <p>{suggestions}</p>
            </div>
          )}

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
            <h2 className="text-xl font-semibold text-blue-800 mb-2">Report your item below</h2>
            <ReportForm defaultCity={displayName} />
          </section>
        </div>
      </div>
    </main>
  );
}
