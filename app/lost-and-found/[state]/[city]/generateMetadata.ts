// app/lost-and-found/[state]/[city]/generateMetadata.ts
import { createClient } from "@supabase/supabase-js";
import type { Metadata } from "next";
import { fromCitySlug, buildCityPath } from "@/lib/slugify";

/**
 * Robust generateMetadata for city pages
 * - Always returns a Metadata object (never empty / never throws)
 * - Uses a tiny in-memory TTL cache to reduce Supabase calls
 * - Logs Supabase errors so you can inspect Vercel logs
 */

/* ----------------- Configuration ----------------- */
const CACHE_TTL_SECONDS = 60 * 60; // 1 hour cache (change if you want)
const CANONICAL_BASE = "https://reportlost.org";

/* ----------------- Small in-memory cache -----------------
   Note: serverless instances may be recycled, but this still reduces
   repeated calls on warm instances.
----------------------------------------------------- */
type CacheEntry = { meta: Metadata; ts: number };
declare global {
  // allow global cache across module reloads in dev/hot reload
  // eslint-disable-next-line no-var
  var __CITY_METADATA_CACHE__: Record<string, CacheEntry> | undefined;
}
if (!global.__CITY_METADATA_CACHE__) global.__CITY_METADATA_CACHE__ = {};

const cache = global.__CITY_METADATA_CACHE__;

/* ----------------- Supabase client ----------------- */
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
const SUPABASE_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";

// Create client even if env missing - we will guard calls
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY, {
  // keep default options; we rely on try/catch for safety
});

/* ----------------- Helper ----------------- */
function normalizeCacheKey(state: string, citySlug: string) {
  return `${state}::${citySlug}`.toLowerCase();
}

function makeFallbackMeta(cityName: string, stateAbbr: string, citySlug: string): Metadata {
  const title = `Lost & Found in ${cityName}, ${stateAbbr.toUpperCase()}`;
  const description = `Report or find lost items in ${cityName}. Quick, secure and local via ReportLost.org.`;
  const canonical = `${CANONICAL_BASE}/lost-and-found/${stateAbbr.toLowerCase()}/${encodeURIComponent(citySlug)}`;
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

/* ----------------- Export (Next App Router) ----------------- */
// Force dynamic is okay — but we protect with cache + safe fallbacks
export const dynamic = "force-dynamic";

export default async function generateMetadata({
  params,
}: {
  params: { state: string; city: string };
}): Promise<Metadata> {
  const state = (params.state || "").toLowerCase();
  const citySlug = decodeURIComponent(params.city || "");
  const cityName = fromCitySlug(citySlug) || citySlug || "this city";

  const cacheKey = normalizeCacheKey(state, citySlug);
  const now = Date.now();

  // 1) Return cached if fresh
  const cached = cache[cacheKey];
  if (cached && now - cached.ts < CACHE_TTL_SECONDS * 1000) {
    return cached.meta;
  }

  // 2) If env missing, return fallback (and cache it)
  if (!SUPABASE_URL || !SUPABASE_KEY) {
    const fallback = makeFallbackMeta(cityName, state, citySlug);
    cache[cacheKey] = { meta: fallback, ts: now };
    console.warn("generateMetadata: Supabase env missing, returning fallback metadata for", cacheKey);
    return fallback;
  }

  try {
    // Query Supabase safely - use maybeSingle to avoid exception on no rows
    const { data, error } = await supabase
      .from("us_cities")
      .select("city_ascii, state_name, state_id, static_title, image_url")
      .eq("state_id", state.toUpperCase())
      .ilike("city_ascii", cityName)
      .maybeSingle();

    if (error) {
      // Log the error but do not throw
      console.error("generateMetadata supabase error:", error);
    }

    if (!data) {
      // No city found -> fallback metadata
      const fallback = makeFallbackMeta(cityName, state, citySlug);
      cache[cacheKey] = { meta: fallback, ts: now };
      return fallback;
    }

    // Build canonical + meta from db
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
      twitter: {
        title,
        description,
        card: "summary_large_image",
      },
    };

    // cache and return
    cache[cacheKey] = { meta, ts: now };
    return meta;
  } catch (err) {
    // unexpected error -> log and return fallback (never throw)
    console.error("generateMetadata unexpected error:", err);
    const fallback = makeFallbackMeta(cityName, state, citySlug);
    cache[cacheKey] = { meta: fallback, ts: now };
    return fallback;
  }
}
