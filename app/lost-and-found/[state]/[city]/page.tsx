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
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";
import { fetchPoliceStations } from "@/lib/fetchPoliceStations";
import { NycTitleSection, NycExtraContent } from "@/components/NycContent";
import { LaTitleSection, LaExtraContent } from "@/components/LosAngelesContent";

const CANONICAL_BASE = "https://reportlost.org";
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
const SUPABASE_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

// Keep runtime so we can fetch DB at request-time
export const dynamic = "force-dynamic" as const;

// ✅ composants client chargés côté navigateur uniquement
const CityMap = NextDynamic(() => import("@/components/MapClient").then((m) => m.default), {
  ssr: false,
  loading: () => <div className="text-gray-400">Loading map...</div>,
});
const CityLostFormBlock = NextDynamic(
  () => import("@/components/CityLostFormBlock").then((m) => m.default),
  { ssr: false, loading: () => <div className="text-gray-400">Loading form…</div> }
);

// ---------- helpers (slug <-> name) ----------
function cityNameFromParam(cityParam: string) {
  const raw = decodeURIComponent(cityParam || "");
  // IMPORTANT: do NOT truncate or “merge” cities. Keep full slug.
  // "new-york-mills" -> "New York Mills"
  const spaced = raw
    .replace(/\+/g, " ")
    .replace(/-+/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  // Title case (simple, predictable)
  return spaced
    .toLowerCase()
    .split(" ")
    .filter(Boolean)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

function formatDate(d: Date) {
  return d.toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });
}

function formatMonthDay(d: Date) {
  return d.toLocaleDateString("en-US", { month: "long", day: "numeric" });
}

function canonicalUrl(stateSlug: string, citySlug: string) {
  return `${CANONICAL_BASE}/lost-and-found/${(stateSlug || "").toLowerCase()}/${encodeURIComponent(
    decodeURIComponent(citySlug || "")
  )}`;
}

function _fallbackMeta(stateSlug: string, citySlug: string): Metadata {
  const stateUp = (stateSlug || "").toUpperCase();
  const cityName = cityNameFromParam(citySlug) || citySlug || "this city";
  const title = cityName && stateUp ? `Lost & Found in ${cityName}, ${stateUp}` : `Lost & Found – ReportLost.org`;
  const description = `Report or find lost items in ${cityName || "this city"}. Quick, secure and local via ReportLost.org.`;
  const canonical = canonicalUrl(stateSlug, citySlug);

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
  const citySlug = params.city || "";

  if (!SUPABASE_URL || !SUPABASE_KEY) {
    return _fallbackMeta(state, citySlug);
  }

  const stateAbbr = (state || "").toUpperCase();
  const cityName = cityNameFromParam(citySlug);

  try {
    // STRICT: one page per city, no fuzzy merge.
    const { data, error } = await supabase
      .from("us_cities")
      .select("city_ascii, state_name, state_id, static_title, image_url, static_content")
      .eq("state_id", stateAbbr)
      .ilike("city_ascii", cityName) // exact (case-insensitive)
      .maybeSingle();

    if (error || !data) {
      return _fallbackMeta(state, citySlug);
    }

    const canonical = canonicalUrl(data.state_id ?? state, citySlug);
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
    return _fallbackMeta(state, citySlug);
  }
}

type PoliceStation = { id?: string; lat: number | null; lon: number | null; name: string | null };

export default async function Page({ params }: { params: { state: string; city: string } }) {
  try {
    const stateAbbr = (params.state || "").toUpperCase();
    const citySlug = params.city || "";
    const cityName = cityNameFromParam(citySlug);

    if (!stateAbbr || !cityName) notFound();

    // 1) Strict lookup: exact city within the state (no fallback that can “merge” cities)
    const { data: cityData, error } = await supabase
      .from("us_cities")
      .select("*")
      .eq("state_id", stateAbbr)
      .ilike("city_ascii", cityName) // exact (case-insensitive)
      .maybeSingle();

    if (error) console.warn("Supabase error (city lookup):", error.message);
    if (!cityData) notFound();

    // 2) Normalise JSON éventuels
    (["parks", "malls", "tourism_sites"] as const).forEach((f) => {
      const raw = (cityData as any)[f];
      if (typeof raw === "string") {
        try {
          (cityData as any)[f] = JSON.parse(raw);
        } catch {
          (cityData as any)[f] = [];
        }
      }
    });

    const title = cityData.static_title || `Lost something in ${cityData.city_ascii}?`;
    const text = cityData.static_content || "";
    const today = formatDate(new Date());

    // ====== Page enrichie dédiée à New York City ======
    // (n'affecte AUCUNE autre ville : contenu générique conservé partout ailleurs)
    const isNYC =
      stateAbbr === "NY" &&
      String(cityData.city_ascii || "").trim().toLowerCase() === "new york";
    const isLA =
      stateAbbr === "CA" &&
      String(cityData.city_ascii || "").trim().toLowerCase() === "los angeles";

    // ====== vrais signalements (≤ 3 jours) pour cette ville/État — via ADMIN ======
    let realReports: string[] = [];
    try {
      const admin = getSupabaseAdmin(); // peut être null si les vars d'env manquent
      if (admin) {
        const threeDaysAgoIso = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString();

        const { data: recentLost, error: realErr } = await admin
          .from("lost_items")
          .select("title, city, state_id, created_at")
          .eq("state_id", stateAbbr)
          .ilike("city", cityData.city_ascii) // stricter than %...%
          .gte("created_at", threeDaysAgoIso)
          .order("created_at", { ascending: false })
          .limit(3);

        if (!realErr && Array.isArray(recentLost) && recentLost.length) {
          realReports = recentLost.map((r) => {
            const label = (r?.title && String(r.title).trim()) || "Lost item";
            const when = r?.created_at ? formatMonthDay(new Date(r.created_at)) : formatMonthDay(new Date());
            const where =
              r?.city && r?.state_id ? `${r.city}, ${r.state_id}` : r?.city ? String(r.city) : cityData.city_ascii;
            return ` ${label} lost in ${where}, ${when}.`;
          });
        }
      }
    } catch {
      /* soft-fail */
    }
    // ===========================================================================

    // Exemples “fallback”
    const fakeReports = exampleReports(cityData);

    // Compose: on place les vrais d’abord, puis on complète avec des faux (max 3)
    const reports = (realReports.length ? [...realReports, ...fakeReports] : fakeReports).slice(0, 3);

    // 4) Nearby
    let nearbyCities: any[] = [];
    try {
      nearbyCities = await getNearbyCities(cityData.id, cityData.state_id);
    } catch {
      nearbyCities = [];
    }

    // 5) Image (dev only if missing) — import dynamique
    let cityImage = (cityData.image_url as string | null) || null;
    let cityImageAlt = cityData.image_alt || `View of ${cityName}`;
    let cityImageCredit = "";
    if (!cityImage && process.env.NODE_ENV !== "production") {
      try {
        const { default: fetchCityImageDirectly } = await import("@/lib/fetchCityImageDirectly");
        const img = await fetchCityImageDirectly(cityName, cityData.state_name);
        cityImage = img.url;
        cityImageAlt = img.alt;

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
      } catch {
        /* ignore */
      }
    }

    // 6) Postes de police via Overpass (helper robuste : "out center", ways/relations,
    //    timeout, miroirs de secours, logs). Corrige le bug "out tags center" qui
    //    supprimait les coordonnées des nodes.
    let policeStations: PoliceStation[] = [];
    try {
      policeStations = await fetchPoliceStations(Number(cityData.lat), Number(cityData.lng));
    } catch {
      policeStations = [];
    }

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
    const TitleSection = isNYC ? (
      <NycTitleSection />
    ) : isLA ? (
      <LaTitleSection />
    ) : (
      <section className="text-center py-10 px-4 bg-gradient-to-r from-blue-50 to-white rounded-t-xl shadow">
        <h1 className="text-3xl sm:text-4xl font-bold text-gray-900">{title}</h1>
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

    const ExtraBelowForm = isNYC ? (
      <NycExtraContent
        cityImage={cityImage}
        cityImageAlt={cityImageAlt}
        cityImageCredit={cityImageCredit}
      />
    ) : isLA ? (
      <LaExtraContent
        cityImage={cityImage}
        cityImageAlt={cityImageAlt}
        cityImageCredit={cityImageCredit}
      />
    ) : (
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
                  const cSlug = String(c.city_ascii || "")
                    .toLowerCase()
                    .replace(/\s+/g, "-")
                    .replace(/-+/g, "-")
                    .replace(/(^-|-$)/g, "");
                  return (
                    <li key={c.id ?? `${c.city_ascii}-${sidDisplay}`}>
                      <Link
                        prefetch={false}
                        href={`/lost-and-found/${String(sidForLink).toLowerCase()}/${encodeURIComponent(cSlug)}`}
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
                  {cityImageCredit && <p className="text-xs text-gray-500 mt-1 text-center">{cityImageCredit}</p>}
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
