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

  console.info("[head] START", { state, citySlug, hasEnv: Boolean(SUPABASE_URL && SUPABASE_KEY) });

  // fallback meta if no env or DB error
  const makeFallback = () => {
    const stateUp = (state || "").toUpperCase();
    const title = cityName && stateUp ? `Lost & Found in ${cityName}, ${stateUp}` : `Lost & Found – ReportLost.org`;
    const description = `Report or find lost items in ${cityName || "this city"}. Quick, secure and local via ReportLost.org.`;
    const canonical = `${CANONICAL_BASE}/lost-and-found/${(state || "").toLowerCase()}/${encodeURIComponent(citySlug)}`;
    return { title, description, canonical, image: undefined };
  };

  if (!SUPABASE_URL || !SUPABASE_KEY) {
    console.warn("[head] missing SUPABASE env — fallback meta");
    const fb = makeFallback();
    return (
      <>
        <title>{fb.title}</title>
        <meta name="description" content={fb.description} />
        <link rel="canonical" href={fb.canonical} />
        <meta property="og:title" content={fb.title} />
        <meta property="og:description" content={fb.description} />
        <meta property="og:site_name" content="ReportLost.org" />
        <meta property="og:type" content="website" />
        <meta name="twitter:card" content="summary_large_image" />
      </>
    );
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
      console.error("[head] supabase error:", error);
    }

    if (!data) {
      console.info("[head] no DB row -> fallback", { state, citySlug, ilikePattern });
      const fb = makeFallback();
      return (
        <>
          <title>{fb.title}</title>
          <meta name="description" content={fb.description} />
          <link rel="canonical" href={fb.canonical} />
          <meta property="og:title" content={fb.title} />
          <meta property="og:description" content={fb.description} />
          <meta property="og:site_name" content="ReportLost.org" />
          <meta property="og:type" content="website" />
          <meta name="twitter:card" content="summary_large_image" />
        </>
      );
    }

    const title = data.static_title || `Lost & Found in ${data.city_ascii}, ${data.state_name}`;
    const description = `Report or find lost items in ${data.city_ascii}. Quick, secure and local via ReportLost.org.`;
    const canonical = `${CANONICAL_BASE}${buildCityPath(data.state_id, data.city_ascii)}`;
    const image = data.image_url || undefined;

    console.info("[head] DONE (db)", { state: data.state_id, city: data.city_ascii, title });

    return (
      <>
        <title>{title}</title>
        <meta name="description" content={description} />
        <link rel="canonical" href={canonical} />

        {/* Open Graph */}
        <meta property="og:title" content={title} />
        <meta property="og:description" content={description} />
        <meta property="og:site_name" content="ReportLost.org" />
        <meta property="og:type" content="website" />
        {image && <meta property="og:image" content={image} />}

        {/* Twitter */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={title} />
        <meta name="twitter:description" content={description} />
        {image && <meta name="twitter:image" content={image} />}
      </>
    );
  } catch (err) {
    console.error("[head] unexpected error:", err);
    const fb = makeFallback();
    return (
      <>
        <title>{fb.title}</title>
        <meta name="description" content={fb.description} />
        <link rel="canonical" href={fb.canonical} />
        <meta property="og:title" content={fb.title} />
        <meta property="og:description" content={fb.description} />
        <meta property="og:site_name" content="ReportLost.org" />
        <meta property="og:type" content="website" />
        <meta name="twitter:card" content="summary_large_image" />
      </>
    );
  }
}
