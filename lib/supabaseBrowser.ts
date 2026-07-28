// lib/supabaseBrowser.ts
// Client Supabase navigateur AVEC session persistante (portail établissements).
// Distinct de lib/supabaseClient (persistSession: false) pour ne rien changer
// aux formulaires publics existants.
import { createClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";

export const supabaseBrowser = createClient(url, anon, {
  auth: { persistSession: true, autoRefreshToken: true },
});
