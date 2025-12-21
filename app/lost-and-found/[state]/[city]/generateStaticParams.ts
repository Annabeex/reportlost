// app/lost-and-found/[state]/[city]/generateStaticParams.ts
import { toCitySlug } from "@/lib/slugify";
import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
const SUPABASE_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";

/**
 * Safe generateStaticParams:
 * - Défend contre l'absence d'env (renvoie [] et logge)
 * - Attrape toute erreur Supabase et renvoie []
 * - Crée le client après la vérification d'env (évite comportement surprenant à l'import)
 */
export async function generateStaticParams() {
  if (!SUPABASE_URL || !SUPABASE_KEY) {
    console.warn("[generateStaticParams] Missing Supabase env vars at build time. Returning empty params.");
    return [];
  }

  const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

  try {
    const { data, error } = await supabase
      .from("us_cities")
      .select("city_ascii, state_id")
      .order("id")
      .limit(20000);

    if (error) {
      console.error("[generateStaticParams] Supabase error:", error);
      return [];
    }
    if (!data || data.length === 0) {
      console.info("[generateStaticParams] no cities returned from DB");
      return [];
    }

    return data.map((row: any) => ({
      state: String(row.state_id || "").toLowerCase(),
      city: toCitySlug(String(row.city_ascii || "")),
    }));
  } catch (err) {
    console.error("[generateStaticParams] unexpected error:", err);
    return [];
  }
}
