// app/lost-and-found/[state]/county/[county]/page.tsx
//
// Page comté : couche intermédiaire entre la page État (qui distribue jusqu'à
// 682 liens et n'en transmet donc aucun) et les pages ville. Elle n'existe que
// pour les comtés comptant au moins MIN_CITIES villes à guide publié, afin de
// ne pas fabriquer des milliers de pages vides.
//
// Aucune URL existante n'est modifiée : /lost-and-found/fl et
// /lost-and-found/fl/madeira-beach restent inchangées.
//
// Déploiement progressif : seuls les États listés dans COUNTY_STATES rendent
// ces pages. Les autres renvoient 404, le temps de mesurer l'effet.
import { notFound } from "next/navigation";
import Link from "next/link";

import { stateNameFromAbbr } from "@/lib/utils";
import { buildCityPath } from "@/lib/slugify";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";
import { holdingRule } from "@/lib/legalHolding";

export const revalidate = 86400; // ISR 24h

/** États où les pages comté sont actives. Élargir après mesure. */
const COUNTY_STATES = new Set(["FL"]);

/** En dessous, le comté n'a pas assez de substance pour mériter une page. */
const MIN_CITIES = 3;

type CityRow = { city_ascii: string; county_name: string | null; population: number | null };

export function countyToSlug(name: string) {
  return String(name)
    .toLowerCase()
    .normalize("NFD").replace(/[̀-ͯ]/g, "")
    .replace(/&/g, "and")
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

/** Villes de l'État qui ont un guide publié, indexées par slug de comté. */
async function getCountyCities(stateAbbr: string) {
  const sb = getSupabaseAdmin({ fresh: false });
  if (!sb) return null;

  // 1) villes de l'État avec leur comté
  const cities: CityRow[] = [];
  for (let from = 0; ; from += 1000) {
    const { data, error } = await sb
      .from("us_cities")
      .select("city_ascii, county_name, population")
      .eq("state_id", stateAbbr)
      .order("population", { ascending: false })
      .range(from, from + 999);
    if (error || !data?.length) break;
    cities.push(...(data as CityRow[]));
    if (data.length < 1000) break;
  }
  if (!cities.length) return null;

  // 2) celles qui ont un guide publié
  const published = new Set<string>();
  for (let from = 0; ; from += 1000) {
    const { data, error } = await sb
      .from("city_guides")
      .select("city_slug")
      .eq("state_id", stateAbbr)
      .eq("status", "published")
      .range(from, from + 999);
    if (error || !data?.length) break;
    for (const g of data) if (g.city_slug) published.add(String(g.city_slug));
    if (data.length < 1000) break;
  }

  // 3) regroupement par comté, villes à guide publié uniquement
  const byCounty = new Map<string, { name: string; cities: CityRow[] }>();
  for (const c of cities) {
    if (!c.county_name) continue;
    if (!published.has(String(c.city_ascii || "").trim().toLowerCase())) continue;
    const slug = countyToSlug(c.county_name);
    if (!byCounty.has(slug)) byCounty.set(slug, { name: c.county_name, cities: [] });
    byCounty.get(slug)!.cities.push(c);
  }
  return byCounty;
}

type Props = { params: { state: string; county: string } };

export async function generateMetadata({ params }: Props) {
  const stateSlug = (params.state || "").toLowerCase();
  const stateName = stateNameFromAbbr(stateSlug);
  const countySlug = (params.county || "").toLowerCase();
  if (!stateName) return { title: "Lost & Found in the USA" };

  const byCounty = await getCountyCities(stateSlug.toUpperCase());
  const entry = byCounty?.get(countySlug);
  const countyName = entry?.name || countySlug.replace(/-/g, " ");

  return {
    title: `Lost and found in ${countyName} County, ${stateName}: where to report`,
    description:
      `Where to report a lost item in ${countyName} County, ${stateName}: the sheriff's office, ` +
      `city police departments, and the lost and found desk of each town in the county.`,
    alternates: {
      canonical: `https://reportlost.org/lost-and-found/${stateSlug}/county/${countySlug}`,
    },
  };
}

export default async function CountyPage({ params }: Props) {
  const stateSlug = (params.state || "").toLowerCase();
  const stateAbbr = stateSlug.toUpperCase();
  const countySlug = (params.county || "").toLowerCase();

  if (!COUNTY_STATES.has(stateAbbr)) return notFound();

  const stateName = stateNameFromAbbr(stateSlug);
  if (!stateName) return notFound();

  const byCounty = await getCountyCities(stateAbbr);
  const entry = byCounty?.get(countySlug);
  if (!entry || entry.cities.length < MIN_CITIES) return notFound();

  const countyName = entry.name;
  const cities = entry.cities;
  const legal = holdingRule(stateAbbr);

  // comtés voisins au sens du maillage : les autres comtés de l'État, par taille
  const others = Array.from(byCounty!.entries())
    .filter(([slug, v]) => slug !== countySlug && v.cities.length >= MIN_CITIES)
    .sort((a, b) => b[1].cities.length - a[1].cities.length)
    .slice(0, 12);

  return (
    <main className="mx-auto w-full max-w-4xl px-4 py-8">
      <nav className="mb-4 text-sm text-gray-600">
        <Link href="/lost-and-found" className="hover:underline">
          Lost &amp; found
        </Link>{" "}
        ›{" "}
        <Link href={`/lost-and-found/${stateSlug}`} className="hover:underline">
          {stateName}
        </Link>{" "}
        › <span className="text-gray-800">{countyName} County</span>
      </nav>

      <h1 className="mb-3 text-2xl font-semibold text-gray-900 sm:text-3xl">
        Lost and found in {countyName} County, {stateName}: where to report
      </h1>

      <p className="mb-4 text-gray-700">
        There is no single lost and found office for {countyName} County. An item handed in
        inside a town usually stays with that town&apos;s police department, while something
        found on a county road, in a county park or in an unincorporated area is more likely
        to reach the {countyName} County Sheriff&apos;s Office. Transit operators, airports and
        venues keep their own separate records, and none of these offices checks the others.
      </p>

      <p className="mb-6 text-gray-700">
        The list below gives the reporting route for each town in the county that we cover.
        Start with the place where you think the item was lost, then widen to the neighbouring
        towns: property is often handed in a short distance from where it was dropped.
      </p>

      {legal ? (
        <section className="mb-8 rounded-xl border border-gray-200 bg-gray-50 p-4">
          <h2 className="mb-2 text-lg font-semibold text-gray-900">
            Holding period in {stateName}
          </h2>
          <p className="text-sm text-gray-700">
            In {stateName}, {legal.note}
            {legal.citation ? (
              <span className="ml-1 text-gray-500">({legal.citation})</span>
            ) : null}
          </p>
          <p className="mt-2 text-sm text-gray-600">
            See the{" "}
            <Link href={`/lost-and-found/${stateSlug}`} className="text-blue-700 hover:underline">
              full {stateName} lost &amp; found rules
            </Link>
            .
          </p>
        </section>
      ) : null}

      <section className="mb-8">
        <h2 className="mb-3 text-lg font-semibold text-gray-900">
          Towns covered in {countyName} County ({cities.length})
        </h2>
        <ul className="grid grid-cols-1 gap-x-6 gap-y-1 sm:grid-cols-2">
          {cities.map((c) => (
            <li key={c.city_ascii}>
              <Link
                href={buildCityPath(stateAbbr, c.city_ascii)}
                prefetch={false}
                className="text-blue-600 hover:underline"
              >
                {c.city_ascii}
              </Link>
              {c.population ? (
                <span className="ml-2 text-xs text-gray-500">
                  {Number(c.population).toLocaleString("en-US")}
                </span>
              ) : null}
            </li>
          ))}
        </ul>
      </section>

      <section className="mb-8 rounded-xl bg-white p-5 shadow">
        <h2 className="mb-2 text-lg font-semibold text-gray-900">Report a lost item</h2>
        <p className="mb-3 text-sm text-gray-700">
          ReportLost is an independent service. We file your report with the offices that accept
          third-party reports, give you the exact desk and steps for those that do not, and keep
          the report active for 12 months so new found listings are matched against your
          description.
        </p>
        <Link
          href="/report"
          className="inline-block rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
        >
          File a lost item report →
        </Link>
      </section>

      {others.length > 0 && (
        <section>
          <h2 className="mb-3 text-lg font-semibold text-gray-900">
            Other counties in {stateName}
          </h2>
          <ul className="flex flex-wrap gap-x-4 gap-y-1 text-sm">
            {others.map(([slug, v]) => (
              <li key={slug}>
                <Link
                  href={`/lost-and-found/${stateSlug}/county/${slug}`}
                  prefetch={false}
                  className="text-blue-600 hover:underline"
                >
                  {v.name} County
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}
    </main>
  );
}
