// app/api/debug-meta/route.ts
import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { fromCitySlug, buildCityPath } from "@/lib/slugify";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
const SUPABASE_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";
const CANONICAL_BASE = "https://reportlost.org";

function makeFallbackMeta(cityName: string, stateAbbr: string, citySlug: string) {
  const title = `Lost & Found in ${cityName}, ${stateAbbr.toUpperCase()}`;
  const description = `Report or find lost items in ${cityName}. Quick, secure and local via ReportLost.org.`;
  const canonical = `${CANONICAL_BASE}/lost-and-found/${stateAbbr.toLowerCase()}/${encodeURIComponent(citySlug)}`;
  return { title, description, canonical };
}

export async function GET(req: Request) {
  const url = new URL(req.url);
  const state = (url.searchParams.get("state") || "").toLowerCase();
  const citySlug = decodeURIComponent(url.searchParams.get("city") || "");
  const cityName = fromCitySlug(citySlug) || citySlug || "this city";

  console.info("debug-meta: START", { state, citySlug, cityName, hasEnv: !!(SUPABASE_URL && SUPABASE_KEY) });

  if (!SUPABASE_URL || !SUPABASE_KEY) {
    console.error("debug-meta: missing env");
    return NextResponse.json({ ok: false, reason: "missing-env" }, { status: 500 });
  }

  const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

  try {
    // NOTE: use a broader match to increase chance of finding DB row
    const ilikePattern = `%${cityName}%`;
    console.info("debug-meta: querying supabase", { state_id: state.toUpperCase(), city_ilike: ilikePattern });

    const { data, error } = await supabase
      .from("us_cities")
      .select("city_ascii, state_name, state_id, static_title, image_url")
      .eq("state_id", state.toUpperCase())
      .ilike("city_ascii", ilikePattern)
      .limit(1)
      .maybeSingle();

    if (error) {
      console.error("debug-meta: supabase error", error);
      return NextResponse.json({ ok: false, reason: "query-error", error: error.message }, { status: 500 });
    }

    if (!data) {
      console.warn("debug-meta: no city found, returning fallback", { state, cityName });
      const fallback = makeFallbackMeta(cityName, state, citySlug);
      return NextResponse.json({ ok: true, used: "fallback", meta: fallback });
    }

    const canonical = `${CANONICAL_BASE}/lost-and-found/${data.state_id.toLowerCase()}/${encodeURIComponent(data.city_ascii.toLowerCase())}`;
    const title = data.static_title || `Lost & Found in ${data.city_ascii}, ${data.state_name}`;
    const description = `Report or find lost items in ${data.city_ascii}. Quick, secure and local via ReportLost.org.`;

    const meta = {
      title,
      description,
      canonical,
      image: data.image_url ?? null,
      dbRow: data,
    };

    console.info("debug-meta: found meta", meta);
    return NextResponse.json({ ok: true, used: "db", meta });
  } catch (err) {
    console.error("debug-meta: unexpected", err);
    return NextResponse.json({ ok: false, reason: "exception", error: String(err) }, { status: 500 });
  }
}
