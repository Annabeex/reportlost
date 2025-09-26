// app/lost-and-found/[state]/[city]/generateMetadata.ts
import { createClient } from "@supabase/supabase-js";
import type { Metadata } from "next";
import { fromCitySlug, buildCityPath } from "@/lib/slugify";

const CACHE_TTL_SECONDS = 60 * 60;
const CANONICAL_BASE = "https://reportlost.org";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
const SUPABASE_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

// Force runtime execution so we can log and fetch DB on request-time.
// If you want build-time SSG, remove this line (and ensure generateStaticParams covers the route).
export const dynamic = "force-dynamic";

function makeFallbackMeta(cityName: string, stateAbbr: string, citySlug: string): Metadata {
  const stateUp = (stateAbbr || "").toUpperCase();
  const title = cityName && stateUp ? `Lost & Found in ${cityName}, ${stateUp}` : `Lost & Found – ReportLost.org`;
  const description = `Report or find lost items in ${cityName || "this city"}. Quick, secure and local via ReportLost.org.`;
  const canonical = `${CANONICAL_BASE}/lost-and-found/${(stateAbbr || "").toLowerCase()}/${encodeURIComponent(citySlug)}`;
  return {
    title,
    description,
    alternates: { canonical },
    openGraph: {
      title,
      description,
      url: canonical,
      siteName: "ReportLost.org",
      type: "website",
    },
    twitter: {
      title,
      description,
      card: "summary_large_image",
    },
  };
}

/**
 * Named export is required by Next App Router.
 * Returns a Metadata object and NEVER throws.
 */
export async function generateMetadata({
  params,
}: {
  params: { state: string; city: string };
}): Promise<Metadata> {
  const state = (params.state || "").toLowerCase();
  const citySlug = decodeURIComponent(params.city || "");
  const cityName = fromCitySlug(citySlug) || citySlug || "this city";

  // Quick runtime debug that appears in Vercel function logs
  console.info("[generateMetadata] START", { state, citySlug, hasEnv: Boolean(SUPABASE_URL && SUPABASE_KEY) });

  // Env guard — return safe fallback if credentials missing
  if (!SUPABASE_URL || !SUPABASE_KEY) {
    console.warn("[generateMetadata] missing SUPABASE env, returning fallback for", state, citySlug);
    return makeFallbackMeta(cityName, state, citySlug);
  }

  try {
    const ilikePattern = `%${cityName}%`;
    const { data, error } = await supabase
      .from("us_cities")
      .select("city_ascii, state_name, state_id, static_title, image_url")
      .eq("state_id", state.toUpperCase())
      .ilike("city_ascii", ilikePattern)
      .limit(1)
      .maybeSingle();

    if (error) {
      console.error("[generateMetadata] supabase error:", error);
    }

    if (!data) {
      console.info("[generateMetadata] no DB row found -> fallback", { state, citySlug, ilikePattern });
      return makeFallbackMeta(cityName, state, citySlug);
    }

    const canonical = `${CANONICAL_BASE}${buildCityPath(data.state_id, data.city_ascii)}`;
    const title = data.static_title || `Lost & Found in ${data.city_ascii}, ${data.state_name}`;
    const description = `Report or find lost items in ${data.city_ascii}. Quick, secure and local via ReportLost.org.`;

    const meta: Metadata = {
      title,
      description,
      alternates: { canonical },
      openGraph: {
        title,
        description,
        url: canonical,
        siteName: "ReportLost.org",
        type: "website",
        ...(data.image_url ? { images: [{ url: data.image_url, alt: `View of ${data.city_ascii}` }] } : {}),
      },
      twitter: { title, description, card: "summary_large_image" },
    };

    console.info("[generateMetadata] DONE (db)", { state, city: data.city_ascii, title });
    return meta;
  } catch (err) {
    console.error("[generateMetadata] unexpected error:", err);
    return makeFallbackMeta(cityName, state, citySlug);
  }
}
