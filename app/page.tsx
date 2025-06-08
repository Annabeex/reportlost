// === app/page.tsx ===
'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export default function HomePage() {
  const [connected, setConnected] = useState<boolean | null>(null);

  useEffect(() => {
    const testConnection = async () => {
      const { data, error } = await supabase.from('us_cities').select('*').limit(1);
      if (error) {
        console.error('Connection error:', error);
        setConnected(false);
      } else {
        console.log('Supabase connected');
        setConnected(true);
      }
    };

    testConnection();
  }, []);

  return (
    <main className="p-6 max-w-3xl mx-auto text-center">
      <h1 className="text-3xl font-bold mb-4">Welcome to Lost & Found USA</h1>
      <p className="text-gray-700 mb-6">
        Report and find lost items in cities across the United States.
      </p>
      {connected === true && (
        <p className="text-green-600">✅ Successfully connected to the database.</p>
      )}
      {connected === false && (
        <p className="text-red-600">❌ Failed to connect to the database.</p>
      )}
    </main>
  );
}

