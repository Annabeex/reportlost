// app/lost-and-found/[state]/[city]/page.tsx
import "@/app/globals.css";
import Image from "next/image";
import Link from "next/link";
import NextDynamic from "next/dynamic"; // renamed to avoid local linter issues
import { notFound } from "next/navigation";
import { createClient } from "@supabase/supabase-js";
import type { Metadata } from "next";

import { exampleReports } from "@/lib/lostitems";
import { getNearbyCities } from "@/lib/getNearbyCities";
import { fromCitySlug, buildCityPath } from "@/lib/slugify";

// --- Metadata inline hotfix (force Next à l'exécuter) -----------------------
const CANONICAL_BASE = "https://reportlost.org";
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
const SUPABASE_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

// Keep runtime so we can fetch DB at request-time
export const dynamic = "force-dynamic" as const;

function _fallbackMeta(cityName: string, stateSlug: string, citySlug: string): Metadata {
  const stateUp = (stateSlug || "").toUpperCase();
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
  const state = (params.state || "").toLowerCase();
  const citySlug = decodeURIComponent(params.city || "");
  const cityName = fromCitySlug(citySlug) || citySlug || "this city";

  console.info("[generateMetadata] START", { state, citySlug, hasEnv: Boolean(SUPABASE_URL && SUPABASE_KEY) });

  if (!SUPABASE_URL || !SUPABASE_KEY) {
    console.warn("[generateMetadata] missing SUPABASE env, returning fallback", { state, citySlug });
    return _fallbackMeta(cityName, state, citySlug);
  }

  try {
    const ilikePattern = `%${cityName}%`;
    const { data, error } = await supabase
      .from("us_cities")
      .select("city_ascii, state_name, state_id, static_title, image_url, static_content")
      .eq("state_id", state.toUpperCase())
      .ilike("city_ascii", ilikePattern)
      .limit(1)
      .maybeSingle();

    if (error) {
      console.error("[generateMetadata] supabase error:", error);
    }
    if (!data) {
      console.info("[generateMetadata] no DB row found -> fallback", { state, citySlug, ilikePattern });
      return _fallbackMeta(cityName, state, citySlug);
    }

    const canonical = `${CANONICAL_BASE}${buildCityPath(data.state_id, data.city_ascii)}`;
    const title = data.static_title || `Lost & Found in ${data.city_ascii}, ${data.state_name}`;
    const description = data.static_content
      ? String(data.static_content).slice(0, 160)
      : `Report or find lost items in ${data.city_ascii}. Quick, secure and local via ReportLost.org.`;

    console.info("[generateMetadata] DONE (db)", { state: data.state_id, city: data.city_ascii, title });

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

    return meta;
  } catch (err) {
    console.error("[generateMetadata] unexpected error:", err);
    return _fallbackMeta(cityName, state, citySlug);
  }
}
// ---------------------------------------------------------------------------

// ✅ composants client chargés côté navigateur uniquement
const CityMap = NextDynamic(() => import("@/components/MapClient").then(m => m.default), {
  ssr: false,
  loading: () => <div className="text-gray-400">Loading map...</div>,
});
const CityLostFormBlock = NextDynamic(
  () => import("@/components/CityLostFormBlock").then(m => m.default),
  { ssr: false, loading: () => <div className="text-gray-400">Loading form…</div> }
);

function toTitleCase(str: string) {
  return str.toLowerCase().split(" ").map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(" ");
}
function formatDate(d: Date) {
  return d.toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });
}

type PoliceStation = { id?: string; lat: number | null; lon: number | null; name: string | null };

export default async function Page({ params }: { params: { state: string; city: string } }) {
  try {
    const stateAbbr = (params.state || "").toUpperCase();
    const cityName = toTitleCase(fromCitySlug(decodeURIComponent(params.city || "")));
    if (!stateAbbr || !cityName) notFound();

    // 1) Requête principale
    let { data: candidates, error } = await supabase
      .from("us_cities")
      .select("*")
      .eq("state_id", stateAbbr)
      .ilike("city_ascii", cityName)
      .order("population", { ascending: false })
      .limit(5);
    if (error) console.warn("Supabase error (query 1):", error.message);

    let cityData =
      candidates?.find(c => (c.city_ascii || "").toLowerCase() === cityName.toLowerCase()) ??
      candidates?.[0] ??
      null;

    // 2) Fallback préfixe
    if (!cityData) {
      const { data: prefixCandidates, error: e2 } = await supabase
        .from("us_cities")
        .select("*")
        .eq("state_id", stateAbbr)
        .ilike("city_ascii", `${cityName}%`)
        .order("population", { ascending: false })
        .limit(5);
      if (e2) console.warn("Supabase error (query 2):", e2.message);

      cityData =
        prefixCandidates?.find(c => (c.city_ascii || "").toLowerCase() === cityName.toLowerCase()) ??
        prefixCandidates?.[0] ??
        null;
    }

    if (!cityData) notFound();

    // 3) Normalise JSON éventuels
    (["parks", "malls", "tourism_sites"] as const).forEach((f) => {
      const raw = (cityData as any)[f];
      if (typeof raw === "string") {
        try { (cityData as any)[f] = JSON.parse(raw); } catch { (cityData as any)[f] = []; }
      }
    });

    const title = cityData.static_title || `Lost something in ${cityData.city_ascii}?`;
    const text = cityData.static_content || "";
    const today = formatDate(new Date());
    const reports = exampleReports(cityData);

    // 4) Nearby
    let nearbyCities: any[] = [];
    try { nearbyCities = await getNearbyCities(cityData.id, cityData.state_id); } catch { nearbyCities = []; }

    // 5) Image (dev only if missing) — import dynamique
    let cityImage = (cityData.image_url as string | null) || null;
    let cityImageAlt = cityData.image_alt || `View of ${cityName}`;
    let cityImageCredit = "";
    if (!cityImage && process.env.NODE_ENV !== "production") {
      try {
        const { default: fetchCityImageDirectly } = await import("@/lib/fetchCityImageDirectly");
        const img = await fetchCityImageDirectly(cityName, cityData.state_name);
        cityImage = img.url; cityImageAlt = img.alt;

        await supabase
          .from("us_cities")
          .update({
            image_url: img.url,
            image_alt: img.alt,
            photographer: img.photographer,
            image_source_url: img.source_url,
          })
          .eq("id", cityData.id);

        cityImageCredit = img.photographer ? `Photo by ${img.photographer}` : "";
      } catch { /* ignore */ }
    }

    // 6) Overpass → objets plats pour le composant client
    let policeStations: PoliceStation[] = [];
    try {
      const overpassUrl =
        `https://overpass-api.de/api/interpreter?data=` +
        `[out:json];node[amenity=police](around:10000,${cityData.lat},${cityData.lng});out tags center;`;
      const res = await fetch(overpassUrl, { next: { revalidate: 3600 } });
      if (res.ok) {
        const data = await res.json();
        const raw = Array.isArray(data?.elements) ? data.elements : [];
        policeStations = raw.map((el: any) => ({
          id: (typeof el?.id === "number" || typeof el?.id === "string") ? String(el.id) : undefined,
          lat: typeof el?.lat === "number" ? el.lat : (typeof el?.center?.lat === "number" ? el.center.lat : null),
          lon: typeof el?.lon === "number" ? el.lon : (typeof el?.center?.lon === "number" ? el.center.lon : null),
          name: typeof el?.tags?.name === "string" ? el?.tags?.name : null,
        }));
      }
    } catch { policeStations = []; }

    // 7) Texte enrichi
    const enrichedText = `<p>${(text || "")
      .replace(/(\n\n|\n)/g, "\n")
      .replace(/(?<!\n)\n(?!\n)/g, "\n\n")
      .replace(/hotels?/gi, "🏨 hotels")
      .replace(/restaurants?/gi, "🍽️ restaurants")
      .replace(/malls?/gi, "🛍️ malls")
      .replace(/parks?/gi, "🌳 parks")
      .replace(/tourist attractions?/gi, "🧭 tourist attractions")
      .replace(/museum/gi, "🖼️ museum")
      .replace(/staff/gi, "👥 staff")
      .replace(/\n\n+/g, "</p><p>")
      .replace(/\n/g, " ")}</p>`;

    // 8) Blocs réutilisés (passés au composant client pour masquage à l’étape 3)
    const TitleSection = (
      <section className="text-center py-10 px-4 bg-gradient-to-r from-blue-50 to-white rounded-t-xl shadow">
        <h1 className="text-3xl sm:text-4xl font-bold text-gray-900">
          {title}
        </h1>
      </section>
    );

    const RecentAndMapSection = (
      <section className="bg-white p-6 rounded-b-xl shadow -mt-px">
        <div className="flex flex-col lg:flex-row gap-8">
          <div className="lg:w-1/2 w-full prose text-gray-800">
            <h2 className="text-xl font-semibold text-blue-900 mb-3 relative pl-6">
              <span className="absolute left-0 top-0">🔍</span>
              Recently reported lost items in {cityData.city_ascii} – updated this {today}
            </h2>
            <ul className="list-none space-y-2 pl-0">
              {reports.map((r: string, i: number) => (
                <li key={i} className="flex items-start gap-2">
                  <span className="text-blue-500">📍</span>
                  <span>{r}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="lg:w-1/2 w-full h-[300px] rounded-lg overflow-hidden shadow">
            <CityMap stations={policeStations} />
          </div>
        </div>
      </section>
    );

    const ExtraBelowForm = (
      <>
        <section className="bg-white p-6 rounded-xl shadow">
          <div
            className="text-gray-800 leading-relaxed text-base [&>p]:mb-4"
            dangerouslySetInnerHTML={{ __html: enrichedText }}
          />
        </section>

        {nearbyCities.length > 0 && (
          <section className="bg-white p-6 rounded-xl shadow flex flex-col lg:flex-row gap-8 items-start">
            <div className="lg:w-1/2 w-full">
              <h2 className="text-xl font-semibold text-gray-800 mb-4">Nearby Cities</h2>
              <ul className="list-disc list-inside text-gray-700">
                {nearbyCities.map((c: any) => {
                  const sidRaw = c.state_id ?? stateAbbr;
                  const sidDisplay = typeof sidRaw === "string" ? sidRaw.toUpperCase() : stateAbbr;
                  const sidForLink = typeof sidRaw === "string" ? sidRaw : stateAbbr;
                  return (
                    <li key={c.id ?? `${c.city_ascii}-${sidDisplay}`}>
                      <Link
                        prefetch={false}
                        href={buildCityPath(sidForLink, c.city_ascii)}
                        className="text-blue-600 hover:underline"
                      >
                        {c.city_ascii} ({sidDisplay})
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </div>

            <div className="lg:w-1/2 w-full">
              {cityImage && (
                <>
                  <Image
                    src={cityImage}
                    alt={cityImageAlt}
                    width={600}
                    height={400}
                    className="w-full h-[250px] object-cover rounded-lg shadow"
                  />
                  {cityImageCredit && (
                    <p className="text-xs text-gray-500 mt-1 text-center">{cityImageCredit}</p>
                  )}
                </>
              )}
            </div>
          </section>
        )}
      </>
    );

    // 9) Render
    return (
      <main className="bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto space-y-16">
          <CityLostFormBlock
            defaultCity={cityData.city_ascii}
            titleSection={TitleSection}
            recentAndMapSection={RecentAndMapSection}
            extraBelowForm={ExtraBelowForm}
          />
        </div>
      </main>
    );
  } catch (e: any) {
    if (e?.digest === "NEXT_NOT_FOUND") throw e; // laisse Next rendre la vraie 404
    console.error("💥 Unexpected error in city page:", e);
    return new Response("Service temporarily unavailable", {
      status: 503,
      headers: { "Retry-After": "60" },
    });
  }
}
