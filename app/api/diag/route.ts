// app/api/diag/route.ts
import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function GET() {
  const url = process.env.SUPABASE_URL ?? null;
  const key = process.env.SUPABASE_ANON_KEY ?? null;

  let lostOk = false;
  let foundOk = false;
  let err: string | null = null;

  try {
    if (url && key) {
      const sb = createClient(url, key);
      const { error: e1 } = await sb.from('lost_items').select('id', { count: 'exact', head: true });
      lostOk = !e1;
      const { error: e2 } = await sb.from('found_items').select('id', { count: 'exact', head: true });
      foundOk = !e2;
    }
  } catch (e: any) {
    err = String(e?.message || e);
  }

  return NextResponse.json({
    env: { SUPABASE_URL: !!url, SUPABASE_ANON_KEY: !!key },
    tables: { lost_items: lostOk, found_items: foundOk },
    note: 'Booleans only. No secrets are returned.',
    err,
  });
}
