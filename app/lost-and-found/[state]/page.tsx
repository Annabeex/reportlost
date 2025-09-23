// app/lost-and-found/[state]/page.tsx
import { notFound } from "next/navigation";
import Image from "next/image";
import Link from "next/link";

import { getPopularCitiesByState } from "@/lib/getPopularCitiesByState";
import { stateNameFromAbbr } from "@/lib/utils";
import { buildCityPath } from "@/lib/slugify";
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
    description: `Submit or find lost items in ${stateName}. Our platform helps reconnect lost belongings with their owners through a combination of AI and local networks.`,
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
