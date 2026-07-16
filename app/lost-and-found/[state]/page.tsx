// app/lost-and-found/[state]/page.tsx
import { notFound } from "next/navigation";
import Image from "next/image";
import Link from "next/link";

import { getPopularCitiesByState } from "@/lib/getPopularCitiesByState";
import { stateNameFromAbbr } from "@/lib/utils";
import { buildCityPath } from "@/lib/slugify";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";
import MaintenanceNotice from "@/components/MaintenanceNotice";
import cityImages from "@/data/cityImages.json";

export const revalidate = 86400; // ISR 24h

type CityRow = {
  city_ascii: string;
  state_id?: string | null;
  population?: number | null;
};

// --- utils images locales ----------------------------------------------------
function cityToSlug(name: string) {
  return String(name)
    .toLowerCase()
    .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
    .replace(/&/g, "and")
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

function getCityImage(stateAbbr: string, cityName: string) {
  const slug = cityToSlug(cityName);
  const byState: Record<string, string[]> | undefined = (cityImages as any).byState;
  const available: string[] | undefined = (cityImages as any).available;
  const planned = byState?.[stateAbbr]?.includes(slug) || available?.includes(slug);
  return planned ? `/images/cities/${slug}.jpg` : "/images/cities/default.jpg";
}

function titleCaseCity(slug: string) {
  return String(slug)
    .split(/\s+/)
    .map((w) => (w ? w.charAt(0).toUpperCase() + w.slice(1) : w))
    .join(" ");
}

// Villes historiques à page dédiée codée en dur (hors city_guides)
const LEGACY_BY_STATE: Record<string, string[]> = {
  NY: ["new york"],
  CA: ["los angeles"],
  IL: ["chicago"],
  TX: ["houston"],
  AZ: ["phoenix"],
};

// Toutes les villes de l'état couvertes par un guide publié : c'est le hub
// qui donne à chaque guide au moins un lien interne stable (sinon les pages
// enrichies restent orphelines et Google ne les indexe pas).
async function getCoveredCities(stateAbbr: string): Promise<string[]> {
  const out = new Set<string>(LEGACY_BY_STATE[stateAbbr] || []);
  try {
    const sb = getSupabaseAdmin({ fresh: false });
    if (sb) {
      const PAGE = 1000;
      for (let from = 0; ; from += PAGE) {
        const { data, error } = await sb
          .from("city_guides")
          .select("city_slug")
          .eq("state_id", stateAbbr)
          .eq("status", "published")
          .order("city_slug", { ascending: true })
          .range(from, from + PAGE - 1);
        if (error || !data?.length) break;
        for (const g of data) if (g.city_slug) out.add(String(g.city_slug));
        if (data.length < PAGE) break;
      }
    }
  } catch {
    /* non bloquant : la section est simplement omise */
  }
  return Array.from(out).sort();
}

// --- metadata ---------------------------------------------------------------
type Props = { params: { state: string } };

export async function generateMetadata({ params }: Props) {
  const stateSlug = (params.state || "").toLowerCase();
  const stateName = stateNameFromAbbr(stateSlug);

  if (!stateName) {
    return {
      title: "Lost & Found in the USA",
      description: "Report and recover lost items in the United States.",
      alternates: { canonical: "https://reportlost.org/lost-and-found" },
    };
  }

  return {
    title: `Lost & Found in ${stateName} - ReportLost.org`,
    description: `Submit or find lost items in ${stateName}. One report and we route it to the right local services, with an active match search for the full duration of your plan.`,
    alternates: { canonical: `https://reportlost.org/lost-and-found/${stateSlug}` },
  };
}

// --- page -------------------------------------------------------------------
export default async function StatePage({ params }: Props) {
  try {
    const stateSlug = (params.state || "").toLowerCase();
    if (!stateSlug) return notFound();

    const stateName = stateNameFromAbbr(stateSlug);
    if (!stateName) return notFound();

    const stateAbbr = stateSlug.toUpperCase();

    // Récupère les villes populaires (format plat/serialisable)
    let cities: CityRow[] = [];
    try {
      const result = await getPopularCitiesByState(stateAbbr);
      cities = (Array.isArray(result) ? result : [])
        .filter((c: any) => c && typeof c.city_ascii === "string")
        .map((c: any) => ({
          city_ascii: c.city_ascii,
          state_id: typeof c.state_id === "string" ? c.state_id : null,
          population: typeof c.population === "number" ? c.population : null,
        }));
    } catch {
      cities = [];
    }

    const coveredCities = await getCoveredCities(stateAbbr);

    return (
      <div className="bg-white px-6 py-10 max-w-5xl mx-auto">
        <h1 className="text-2xl md:text-3xl font-bold text-gray-900 text-center mb-6">
          Lost &amp; Found Services in {stateName}
        </h1>

        <p className="text-gray-700 text-center max-w-2xl mx-auto mb-10">
          Discover how to report or find lost items across major cities in {stateName}. We help you connect with local services, transportation hubs, and more.
        </p>

        <h2 className="text-xl font-semibold text-gray-800 mb-4 text-center">
          Most Populated Cities in {stateName}
        </h2>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-6 justify-items-center">
          {cities.map((city) => {
            const sid = city.state_id ?? stateAbbr; // fallback si manquant
            const imgSrc = getCityImage(stateAbbr, city.city_ascii);

            return (
              <Link
                key={`${city.city_ascii}-${sid}`}
                href={buildCityPath(sid, city.city_ascii)}
                prefetch={false} // ← évite les préchargements automatiques
                className="text-center group transition-transform transform hover:scale-105"
              >
                <Image
                  src={imgSrc}
                  alt={city.city_ascii}
                  width={120}
                  height={120}
                  className="rounded-full object-cover mx-auto shadow w-[120px] h-[120px]"
                  loading="lazy"
                />
                <p className="text-sm font-medium mt-2 text-gray-700 group-hover:text-blue-600">
                  {city.city_ascii}
                </p>
              </Link>
            );
          })}
        </div>

        {cities.length === 0 && (
          <MaintenanceNotice
            message={`We're still working on listing lost & found services for all cities in ${stateName}. Please check back soon!`}
          />
        )}

        {/* Hub interne : toutes les villes couvertes de l'état (guides publiés).
            Chaque guide reçoit ainsi au moins un lien interne stable. */}
        {coveredCities.length > 0 && (
          <section className="mt-14">
            <h2 className="text-xl font-semibold text-gray-800 mb-2 text-center">
              All Cities We Cover in {stateName}
            </h2>
            <p className="text-gray-600 text-center max-w-2xl mx-auto mb-6 text-sm">
              Each city page lists the local lost &amp; found contacts and how to report a loss there.
            </p>
            <ul className="columns-2 sm:columns-3 md:columns-4 gap-6 [&>li]:mb-1.5">
              {coveredCities.map((slug) => (
                <li key={slug} className="break-inside-avoid">
                  <Link
                    prefetch={false}
                    href={buildCityPath(stateAbbr, slug)}
                    className="text-sm text-blue-700 hover:underline"
                  >
                    {titleCaseCity(slug)}
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        )}
      </div>
    );
  } catch (e: any) {
    if (e?.digest === "NEXT_NOT_FOUND") throw e;
    console.error("💥 Unexpected error in state page:", e);
    // ts-expect-error: Response est OK dans l’App Router
    return new Response("Service temporarily unavailable", {
      status: 503,
      headers: { "Retry-After": "60" },
    });
  }
}
