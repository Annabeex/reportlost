// lib/supabaseAdmin.ts
import { createClient } from '@supabase/supabase-js';
import type { SupabaseClient } from '@supabase/supabase-js';

/**
 * Retourne un client Supabase admin (service role).
 * N'importez **jamais** ce fichier côté client.
 */
export function getSupabaseAdmin(): SupabaseClient | null {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceKey) {
    // eslint-disable-next-line no-console
    console.error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY for server client');
    return null;
  }

  return createClient(url, serviceKey, {
    auth: { persistSession: false },
  });
}
