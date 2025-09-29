// app/lost-and-found/[state]/[city]/head.tsx
import React from "react";
import { createClient } from "@supabase/supabase-js";
import { fromCitySlug, buildCityPath } from "@/lib/slugify";

const CANONICAL_BASE = "https://reportlost.org";
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
const SUPABASE_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

export default async function Head({ params }: { params: { state: string; city: string } }) {
  const state = (params.state || "").toLowerCase();
  const citySlug = decodeURIComponent(params.city || "");
  const cityName = fromCitySlug(citySlug) || citySlug || "this city";

  // Log minimal pour debug côté Vercel (s'affichera dans les Function Logs)
  console.info("[head] START", { state, citySlug, hasEnv: Boolean(SUPABASE_URL && SUPABASE_KEY) });

  // fallback metadata (toujours renvoyé si DB/Env KO)
  const fallbackTitle = cityName && state ? `Lost & Found in ${cityName}, ${state.toUpperCase()}` : "Lost & Found – ReportLost.org";
  const fallbackDescription = `Report or find lost items in ${cityName || "this city"}. Quick, secure and local via ReportLost.org.`;
  const fallbackCanonical = `${CANONICAL_BASE}/lost-and-found/${(state || "").toLowerCase()}/${encodeURIComponent(citySlug)}`;

  try {
    if (!SUPABASE_URL || !SUPABASE_KEY) {
      console.warn("[head] missing supabase env -> returning fallback");
      return (
        <>
          <title>{fallbackTitle}</title>
          <meta name="description" content={fallbackDescription} />
          <link rel="canonical" href={fallbackCanonical} />
          <meta property="og:title" content={fallbackTitle} />
          <meta property="og:description" content={fallbackDescription} />
          <meta property="og:site_name" content="ReportLost.org" />
          <meta property="og:type" content="website" />
          <meta name="twitter:card" content="summary_large_image" />
        </>
      );
    }

    const ilikePattern = `%${cityName}%`;
    const { data, error } = await supabase
      .from("us_cities")
      .select("city_ascii, state_name, state_id, static_title, image_url, static_content")
      .eq("state_id", state.toUpperCase())
      .ilike("city_ascii", ilikePattern)
      .limit(1)
      .maybeSingle();

    if (error) {
      console.error("[head] supabase error:", error);
      // retourne fallback en cas d'erreur DB
      return (
        <>
          <title>{fallbackTitle}</title>
          <meta name="description" content={fallbackDescription} />
          <link rel="canonical" href={fallbackCanonical} />
          <meta property="og:title" content={fallbackTitle} />
          <meta property="og:description" content={fallbackDescription} />
        </>
      );
    }

    if (!data) {
      console.info("[head] no DB row found -> fallback", { ilikePattern });
      return (
        <>
          <title>{fallbackTitle}</title>
          <meta name="description" content={fallbackDescription} />
          <link rel="canonical" href={fallbackCanonical} />
        </>
      );
    }

    const canonical = `${CANONICAL_BASE}${buildCityPath(data.state_id, data.city_ascii)}`;
    const title = data.static_title || `Lost & Found in ${data.city_ascii}, ${data.state_name}`;
    const description = data.static_content
      ? String(data.static_content).slice(0, 160)
      : `Report or find lost items in ${data.city_ascii}. Quick, secure and local via ReportLost.org.`;

    console.info("[head] DONE (db)", { state: data.state_id, city: data.city_ascii, title });

    return (
      <>
        <title>{title}</title>
        <meta name="description" content={description} />
        <link rel="canonical" href={canonical} />
        <meta property="og:title" content={title} />
        <meta property="og:description" content={description} />
        <meta property="og:site_name" content="ReportLost.org" />
        <meta property="og:type" content="website" />
        {data.image_url && <meta property="og:image" content={data.image_url} />}
        <meta name="twitter:card" content="summary_large_image" />
      </>
    );
  } catch (err) {
    console.error("[head] unexpected error:", err);
    return (
      <>
        <title>{fallbackTitle}</title>
        <meta name="description" content={fallbackDescription} />
        <link rel="canonical" href={fallbackCanonical} />
      </>
    );
  }
}
