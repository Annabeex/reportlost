// === app/page.tsx ===
import Link from 'next/link';
import { createClient } from '@supabase/supabase-js';
import '@/app/globals.css';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export default async function HomePage() {
  const { data, error } = await supabase.from('us_states').select('name').limit(5);

  return (
    <main className="bg-gray-50 min-h-screen py-12 px-6">
      <div className="max-w-4xl mx-auto text-center">
        <h1 className="text-4xl font-bold text-blue-900 mb-4">Welcome to Lost & Found USA</h1>
        <p className="text-gray-700 mb-8">
          Report a lost item or browse lost & found reports by city or state.
        </p>

        <div className="flex flex-col sm:flex-row gap-4 justify-center mb-8">
          <Link href="/states" className="bg-blue-600 text-white px-6 py-3 rounded-md hover:bg-blue-700">
            Browse by State
          </Link>
          <Link href="/cities/losangeles" className="bg-gray-200 text-blue-800 px-6 py-3 rounded-md hover:bg-gray-300">
            Example: Los Angeles
          </Link>
        </div>

        <div className="bg-white border border-gray-200 p-6 rounded-md shadow-md text-left">
          <h2 className="text-lg font-semibold mb-2">Database Connection Check</h2>
          {error ? (
            <p className="text-red-600">❌ Error fetching states: {error.message}</p>
          ) : (
            <ul className="list-disc list-inside text-gray-800">
              {data?.map((state: any) => (
                <li key={state.name}>{state.name}</li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </main>
  );
}
