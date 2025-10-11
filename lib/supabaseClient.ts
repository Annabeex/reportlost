// lib/supabaseClient.ts
import { createClient } from '@supabase/supabase-js';

/**
 * Client public côté navigateur : utilise NEXT_PUBLIC_* keys
 * Ne pas utiliser la SERVICE_ROLE_KEY côté client.
 */
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  // On log en runtime (le build ne doit pas planter ici).
  // Si tu veux forcer l'erreur à la build, retire le "!" et ajoute un throw.
  // eslint-disable-next-line no-console
  console.warn('Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY');
}

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: { persistSession: false },
});
