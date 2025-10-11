// lib/supabase.ts
// shim: ré-exporte les utilitaires client/admin pour éviter de casser les imports existants
export { supabase } from "./supabaseClient";
export { getSupabaseAdmin } from "./supabaseAdmin";
