// app/lost-and-found/[state]/[city]/generateMetadata.ts
import { createClient } from "@supabase/supabase-js";
import type { Metadata } from "next";
import { fromCitySlug } from "@/lib/slugify";

const CANONICAL_BASE = "https://reportlost.org";
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
const SUPABASE_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

// Keep runtime so we can fetch DB at request-time
export const dynamic = "force-dynamic";

function fallbackMeta(stateSlug: string, citySlugRaw: string): Metadata {
  const stateUp = (stateSlug || "").toUpperCase();
  const citySlug = decodeURIComponent(citySlugRaw || "");
  const cityName = fromCitySlug(citySlug) || citySlug || "this city";

  const title =
    cityName && stateUp ? `Lost & Found in ${cityName}, ${stateUp}` : `Lost & Found – ReportLost.org`;

  const description = `Report or find lost items in ${cityName || "this city"}. Quick, secure and local via ReportLost.org.`;

  const canonical = `${CANONICAL_BASE}/lost-and-found/${(stateSlug || "").toLowerCase()}/${encodeURIComponent(
    citySlug
  )}`;

  return {
    title,
    description,
    alternates: { canonical },
    openGraph: { title, description, url: canonical, siteName: "ReportLost.org", type: "website" },
    twitter: { title, description, card: "summary_large_image" },
  };
}

export async function generateMetadata({
  params,
}: {
  params: { state: string; city: string };
}): Promise<Metadata> {
  const stateSlug = (params.state || "").toLowerCase();
  const citySlug = decodeURIComponent(params.city || "");
  const cityName = fromCitySlug(citySlug) || citySlug || "this city";

  // Canonical MUST match the requested URL (no regeneration => no accidental “merge”)
  const canonical = `${CANONICAL_BASE}/lost-and-found/${stateSlug}/${encodeURIComponent(citySlug)}`;

  if (!SUPABASE_URL || !SUPABASE_KEY) {
    return fallbackMeta(stateSlug, citySlug);
  }

  try {
    // ✅ STRICT match (no %...%) to avoid “New York Mills” matching “New York”
    const { data, error } = await supabase
      .from("us_cities")
      .select("city_ascii, state_name, state_id, static_title, image_url, static_content")
      .eq("state_id", stateSlug.toUpperCase())
      .ilike("city_ascii", cityName) // exact (case-insensitive)
      .maybeSingle();

    if (error || !data) {
      return {
        ...fallbackMeta(stateSlug, citySlug),
        alternates: { canonical },
      };
    }

    const title = data.static_title || `Lost & Found in ${data.city_ascii}, ${data.state_name}`;
    const description = data.static_content
      ? String(data.static_content).slice(0, 160)
      : `Report or find lost items in ${data.city_ascii}. Quick, secure and local via ReportLost.org.`;

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
        ...(data.image_url ? { images: [{ url: data.image_url, alt: `View of ${data.city_ascii}` }] } : {}),
      },
      twitter: { title, description, card: "summary_large_image" },
    };
  } catch {
    return {
      ...fallbackMeta(stateSlug, citySlug),
      alternates: { canonical },
    };
  }
}
