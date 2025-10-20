// scripts/backfill-slugs.ts
import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';

const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);

async function run() {
  const { data, error } = await sb
    .from('lost_items')
    .select('id, slug')
    .is('slug', null)
    .limit(1000);

  if (error) throw error;

  for (const row of data || []) {
    // appelle directement la logique de build côté serveur si tu l’exposes,
    // sinon réécris ici une version de buildReportSlug + check unicité.
    const res = await fetch(`${process.env.NEXT_PUBLIC_SITE_URL}/api/generate-report-slug?id=${row.id}`);
    if (!res.ok) console.log('Fail slug for', row.id);
  }
  console.log('Done.');
}
run().catch(console.error);
