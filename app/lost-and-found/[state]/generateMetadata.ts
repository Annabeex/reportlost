// app/lost-and-found/[state]/generateMetadata.ts
import type { Metadata } from "next";
import { stateNameFromSlug } from "@/lib/utils";

/**
 * Robust generateMetadata for state pages
 * - Always returns a Metadata object (never empty / never throws)
 * - Small in-memory cache to reduce work on warm instances
 * - Uses force-static (no external calls here) to avoid server-side 5xx risk
 */

/* ----------------- Config ----------------- */
const CACHE_TTL_SECONDS = 60 * 60; // 1 hour
const CANONICAL_BASE = "https://reportlost.org";

type CacheEntry = { meta: Metadata; ts: number };

declare global {
  // keep a global cache across module reloads in dev
  // eslint-disable-next-line no-var
  var __STATE_METADATA_CACHE__: Record<string, CacheEntry> | undefined;
}
if (!global.__STATE_METADATA_CACHE__) global.__STATE_METADATA_CACHE__ = {};
const cache = global.__STATE_METADATA_CACHE__;

/* Force static: state names are local logic only, avoid dynamic external calls for stability */
export const dynamic = "force-static";

function makeFallbackMetaForState(stateSlug: string): Metadata {
  const title = "Lost & Found in the USA - ReportLost.org";
  const description = "Report and recover lost items across the United States with ReportLost.org.";
  const canonical = `${CANONICAL_BASE}/lost-and-found`;
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

export default async function generateMetadata({
  params,
}: {
  params: { state: string };
}): Promise<Metadata> {
  try {
    const stateSlug = (params?.state || "").toLowerCase();
    if (!stateSlug) return makeFallbackMetaForState(stateSlug);

    // Check cache
    const now = Date.now();
    const cached = cache[stateSlug];
    if (cached && now - cached.ts < CACHE_TTL_SECONDS * 1000) {
      return cached.meta;
    }

    // Resolve human-readable state name via local util
    const stateName = stateNameFromSlug(stateSlug);

    if (!stateName) {
      const fallback = makeFallbackMetaForState(stateSlug);
      cache[stateSlug] = { meta: fallback, ts: now };
      return fallback;
    }

    const title = `Lost & Found in ${stateName} - ReportLost.org`;
    const description = `Submit or find lost items in ${stateName}. Our platform helps reconnect lost belongings with their owners.`;
    const canonical = `${CANONICAL_BASE}/lost-and-found/${stateSlug}`;

    // Optional OG image pattern: if you host per-state images under /images/states/{stateSlug}.jpg,
    // social cards will show better. If those files don't exist it's okay — crawlers ignore missing images.
    const ogImageUrl = `${CANONICAL_BASE}/images/states/${encodeURIComponent(stateSlug)}.jpg`;

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
        images: [{ url: ogImageUrl, alt: `View of ${stateName}` }],
      },
      twitter: {
        title,
        description,
        card: "summary_large_image",
      },
    };

    cache[stateSlug] = { meta, ts: now };
    return meta;
  } catch (err) {
    // Never throw — return a safe fallback
    console.error("generateMetadata (state) unexpected error:", err);
    const fallback = makeFallbackMetaForState((params && params.state) || "");
    cache[(params && params.state) || ""] = { meta: fallback, ts: Date.now() };
    return fallback;
  }
}
