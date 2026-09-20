// app/lost-and-found/[state]/[city]/page.tsx
import "@/app/globals.css";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@supabase/supabase-js";
import type { Metadata } from "next";

import { getNearbyCities } from "@/lib/getNearbyCities";
import { holdingRule } from "@/lib/legalHolding";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";
import CityMapSection from "@/components/CityMapSection";
import { CityGuideTitle, CityGuideExtra } from "@/components/CityGuide";
import type { CityGuide as CityGuideType } from "@/lib/cityGuides";
import { NycTitleSection, NycExtraContent } from "@/components/NycContent";
import { LaTitleSection, LaExtraContent } from "@/components/LosAngelesContent";
import { ChicagoTitleSection, ChicagoExtraContent } from "@/components/ChicagoContent";
import { HoustonTitleSection, HoustonExtraContent } from "@/components/HoustonContent";
import { PhoenixTitleSection, PhoenixExtraContent } from "@/components/PhoenixContent";

const CANONICAL_BASE = "https://reportlost.org";
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
const SUPABASE_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

// ISR : la page est rendue puis mise en cache 24h — crawl rapide pour Google,
// et les nouveaux signalements apparaissent au plus tard le lendemain.
export const revalidate = 86400;
export const maxDuration = 60; // marge pour le premier rendu (données externes)

// ✅ Rendu SERVEUR du bloc ville (titre, récents, carte, guide) : indispensable
// pour le SEO (contenu dans le HTML initial) et le CLS (rien ne "pop" après coup).
// ⚠️ Ne JAMAIS repasser ce composant en dynamic ssr:false : ça vidait le HTML
// de tout le contenu de la page (CLS 0,9 mesuré + guides invisibles pour Google
// au premier passage). Le formulaire, lui, garde sa protection client interne.
import CityLostFormBlock from "@/components/CityLostFormBlock";

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

/**
 * Résolution robuste d'une ville : correspondance exacte d'abord, puis, pour les
 * noms à ponctuation perdue dans le slug ("st-louis" → "St Louis" ≠ "St. Louis",
 * "o-fallon" → "O Fallon" ≠ "O'Fallon"), nouvelle tentative avec jokers entre
 * les mots (la plus peuplée gagne en cas d'ambiguïté).
 */
async function findCityRow<T = any>(
  client: typeof supabase,
  stateAbbr: string,
  cityName: string,
  columns: string
): Promise<T | null> {
  const { data } = await client
    .from("us_cities")
    .select(columns)
    .eq("state_id", stateAbbr)
    .ilike("city_ascii", cityName)
    .maybeSingle();
  if (data) return data as T;

  const fuzzy = cityName.replace(/\s+/g, "%");
  if (fuzzy === cityName) return null;
  const { data: rows } = await client
    .from("us_cities")
    .select(columns)
    .eq("state_id", stateAbbr)
    .ilike("city_ascii", fuzzy)
    .order("population", { ascending: false })
    .limit(1);
  return (rows?.[0] as T) || null;
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
    // Exact d'abord, puis rattrapage ponctuation (St. Louis, O'Fallon...)
    const data: any = await findCityRow(
      supabase,
      stateAbbr,
      cityName,
      "city_ascii, state_name, state_id, static_title, image_url, static_content"
    );

    if (!data) {
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


export default async function Page({ params }: { params: { state: string; city: string } }) {
  try {
    const stateAbbr = (params.state || "").toUpperCase();
    const citySlug = params.city || "";
    const cityName = cityNameFromParam(citySlug);

    if (!stateAbbr || !cityName) notFound();

    // 1) Lookup exact, puis rattrapage ponctuation (St. Louis, O'Fallon...)
    const cityData: any = await findCityRow(supabase, stateAbbr, cityName, "*");

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

    // Certains static_title en base ciblent l'objet TROUVÉ (« Found Something
    // in X? ») alors que la page sert à déclarer une PERTE. On les remplace
    // pour coller à l'intention de recherche dominante.
    const rawTitle = String(cityData.static_title || "").trim();
    const title =
      !rawTitle || /^found something/i.test(rawTitle)
        ? `Lost something in ${cityData.city_ascii}?`
        : rawTitle;
    const text = cityData.static_content || "";
    const today = formatDate(new Date());
    let guideUpdatedAt: string | null = null;

    // ====== Page enrichie dédiée à New York City ======
    // (n'affecte AUCUNE autre ville : contenu générique conservé partout ailleurs)
    const isNYC =
      stateAbbr === "NY" &&
      String(cityData.city_ascii || "").trim().toLowerCase() === "new york";
    const isLA =
      stateAbbr === "CA" &&
      String(cityData.city_ascii || "").trim().toLowerCase() === "los angeles";
    const isChicago =
      stateAbbr === "IL" &&
      String(cityData.city_ascii || "").trim().toLowerCase() === "chicago";
    const isHouston =
      stateAbbr === "TX" &&
      String(cityData.city_ascii || "").trim().toLowerCase() === "houston";
    const isPhoenix =
      stateAbbr === "AZ" &&
      String(cityData.city_ascii || "").trim().toLowerCase() === "phoenix";

    // ====== Guide ville publié (table city_guides, validé dans /admin/city-guides) ======
    // Les 5 grandes villes gardent leurs composants dédiés ; partout ailleurs, un guide
    // publié remplace le contenu générique.
    let dbGuide: CityGuideType | null = null;
    if (!isNYC && !isLA && !isChicago && !isHouston && !isPhoenix) {
      try {
        const adminGuide = getSupabaseAdmin({ fresh: false }); // cacheable : page ISR
        if (adminGuide) {
          const { data: g } = await adminGuide
            .from("city_guides")
            .select("guide, updated_at")
            .eq("state_id", stateAbbr)
            .eq("city_slug", String(cityData.city_ascii || "").trim().toLowerCase())
            .eq("status", "published")
            .maybeSingle();
          dbGuide = (g?.guide as CityGuideType) || null;
          guideUpdatedAt = (g?.updated_at as string) || null;
        }
      } catch {
        dbGuide = null;
      }
    }

    // ====== vrais signalements (≤ 90 jours) pour cette ville/État — via ADMIN ======
    // Fenêtre longue : le contenu réel (unique, local) reste visible et chaque
    // signalement publié est LIÉ à sa page /lost/... (maillage interne SEO).
    type ReportLine = { label: string; meta: string; slug: string | null };
    let realReports: ReportLine[] = [];
    try {
      const admin = getSupabaseAdmin({ fresh: false }); // cacheable : page ISR
      if (admin) {
        const ninetyDaysAgoIso = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString();

        const { data: recentLost, error: realErr } = await admin
          .from("lost_items")
          .select("title, city, state_id, created_at, slug")
          .eq("state_id", stateAbbr)
          // Le formulaire stocke souvent "Tucson (AZ)" : préfixe requis, pas égalité
          .ilike("city", `${cityData.city_ascii}%`)
          .gte("created_at", ninetyDaysAgoIso)
          .order("created_at", { ascending: false })
          .limit(3);

        if (!realErr && Array.isArray(recentLost) && recentLost.length) {
          realReports = recentLost.map((r) => {
            const label = (r?.title && String(r.title).trim()) || "Lost item";
            const when = r?.created_at ? formatMonthDay(new Date(r.created_at)) : formatMonthDay(new Date());
            const cityClean = String(r?.city || cityData.city_ascii).replace(/\s*\([^)]*\)\s*$/, "").trim();
            const where = r?.state_id ? `${cityClean}, ${r.state_id}` : cityClean;
            return {
              label,
              // La ville est dans le titre de la page : la répéter est du bruit.
              meta: where === `${cityData.city_ascii}, ${stateAbbr}` ? when : `${where}, ${when}`,
              slug: r?.slug ? String(r.slug) : null,
            };
          });
        }
      }
    } catch {
      /* soft-fail */
    }
    // ===========================================================================

    // Plus aucun signalement inventé : on n'affiche que du réel.
    const reports: ReportLine[] = realReports.slice(0, 3);

    // ====== Activité réelle : compteurs + derniers signalements nationaux ======
    let totalReports = 0;
    let stateReports = 0;
    let latestNationwide: ReportLine[] = [];
    try {
      const adminStats = getSupabaseAdmin({ fresh: false });
      if (adminStats) {
        const [nat, st, latest] = await Promise.all([
          adminStats.from("lost_items").select("id", { count: "exact", head: true }),
          adminStats
            .from("lost_items")
            .select("id", { count: "exact", head: true })
            .eq("state_id", stateAbbr),
          adminStats
            .from("lost_items")
            .select("title, city, state_id, created_at, slug")
            .not("slug", "is", null)
            .order("created_at", { ascending: false })
            .limit(5),
        ]);
        totalReports = nat.count || 0;
        stateReports = st.count || 0;
        latestNationwide = (latest.data || []).map((r: any) => {
          const label = (r?.title && String(r.title).trim()) || "Lost item";
          const when = r?.created_at ? formatMonthDay(new Date(r.created_at)) : "";
          const cityClean = String(r?.city || "").replace(/\s*\([^)]*\)\s*$/, "").trim();
          const where = [cityClean, r?.state_id].filter(Boolean).join(", ");
          return {
            label,
            meta: `${where}${when ? `, ${when}` : ""}`,
            slug: r?.slug ? String(r.slug) : null,
          };
        });
      }
    } catch {
      /* soft-fail : on affiche simplement moins */
    }
    const isSmallTown = Number(cityData.population || 0) < 5000;
    const legal = holdingRule(stateAbbr);

    // 4) Nearby
    let nearbyCities: any[] = [];
    try {
      const candidates = await getNearbyCities(cityData.id, cityData.state_id, 40);
      // On ne lie que vers des villes possédant un guide publié : inutile d'envoyer
      // Google (et les visiteurs) vers des pages non enrichies.
      const adminNear = getSupabaseAdmin({ fresh: false });
      if (adminNear && candidates.length) {
        const slugs = candidates.map((c: any) => String(c.city_ascii || "").trim().toLowerCase());
        const { data: guided } = await adminNear
          .from("city_guides")
          .select("state_id, city_slug")
          .eq("status", "published")
          .in("city_slug", slugs);
        const allowed = new Set(
          (guided || []).map((g: any) => `${String(g.state_id).toUpperCase()}|${g.city_slug}`)
        );
        nearbyCities = candidates
          .filter((c: any) =>
            allowed.has(
              `${String(c.state_id || stateAbbr).toUpperCase()}|${String(c.city_ascii || "")
                .trim()
                .toLowerCase()}`
            )
          )
          .slice(0, 5);
      } else {
        nearbyCities = [];
      }
    } catch {
      nearbyCities = [];
    }

    // 5) Image : photo stockée (image_url) — générée par IA lors de la création
    //    du guide (unique par ville), plus de fetch Pexels à la volée.
    const cityImage = (cityData.image_url as string | null) || null;
    const cityImageAlt = cityData.image_alt || `View of ${cityName}`;
    const cityImageCredit = "";

    // 6) Postes de police : chargés côté NAVIGATEUR après le rendu
    //    (composant CityMapSection → /api/police-stations, cache CDN 7 jours).
    //    L'appel Overpass bloquait le rendu 10-15 s sur chaque page froide
    //    (LCP 15,9 s mesuré) : il ne doit plus JAMAIS être await ici.
    const mapLat = Number(cityData.lat);
    const mapLng = Number(cityData.lng);

    // 7) Texte enrichi
    const enrichedText = `<p>${(text || "")
      .replace(/(\n\n|\n)/g, "\n")
      .replace(/(?<!\n)\n(?!\n)/g, "\n\n")
      // Emojis : uniquement sur le mot générique en minuscules, une seule fois,
      // et en conservant le mot d'origine. Sans cela « Rotary Park » devenait
      // « Rotary 🌳 parks » sur des milliers de pages.
      .replace(/\b(hotels?)\b/, "🏨 $1")
      .replace(/\b(restaurants?)\b/, "🍽️ $1")
      .replace(/\b(malls?)\b/, "🛍️ $1")
      .replace(/\b(parks?)\b/, "🌳 $1")
      .replace(/\b(tourist attractions?)\b/, "🧭 $1")
      .replace(/\b(museums?)\b/, "🖼️ $1")
      .replace(/\b(staff)\b/, "👥 $1")
      .replace(/\n\n+/g, "</p><p>")
      .replace(/\n/g, " ")}</p>`;

    // 8) Blocs réutilisés (passés au composant client pour masquage à l’étape 3)
    const TitleSection = isNYC ? (
      <NycTitleSection />
    ) : isLA ? (
      <LaTitleSection />
    ) : isChicago ? (
      <ChicagoTitleSection />
    ) : isHouston ? (
      <HoustonTitleSection />
    ) : isPhoenix ? (
      <PhoenixTitleSection />
    ) : dbGuide ? (
      <CityGuideTitle guide={dbGuide} />
    ) : (
      <section className="text-center py-10 px-4 bg-gradient-to-r from-blue-50 to-white rounded-t-xl shadow">
        <h1 className="text-3xl sm:text-4xl font-bold text-gray-900">{title}</h1>
      </section>
    );

    const RecentAndMapSection = (
      <section className="bg-white p-6 rounded-b-xl shadow -mt-px">
        <div className="flex flex-col lg:flex-row gap-8">
          <div className="lg:w-1/2 w-full text-gray-800">
            <h2 className="text-xl font-semibold text-blue-900 mb-4 flex items-center gap-2">
              <span aria-hidden>📈</span> Recent activity
            </h2>

            {totalReports > 0 && (
              <div className="flex items-baseline gap-8 mb-5">
                <div>
                  <div className="text-2xl font-semibold text-gray-900 tabular-nums leading-none">
                    {totalReports.toLocaleString("en-US")}
                  </div>
                  <div className="mt-1 text-[11px] uppercase tracking-wide text-gray-500">
                    reports filed
                  </div>
                </div>
                {stateReports > 0 && (
                  <div>
                    <div className="text-2xl font-semibold text-gray-900 tabular-nums leading-none">
                      {stateReports.toLocaleString("en-US")}
                    </div>
                    <div className="mt-1 text-[11px] uppercase tracking-wide text-gray-500">
                      in {cityData.state_name}
                    </div>
                  </div>
                )}
              </div>
            )}

            {legal && (
              <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 mb-5">
                <p className="text-[13px] leading-relaxed text-amber-900">
                  <span className="font-semibold">{cityData.state_name} : </span>
                  {legal.note}
                  {legal.citation ? <span className="text-amber-700"> ({legal.citation})</span> : null}
                </p>
              </div>
            )}

            {reports.length > 0 ? (
              <div className="mb-6">
                <h3 className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-gray-400">
                  Reported in {cityData.city_ascii}
                </h3>
                <ul className="border-t border-gray-200 divide-y divide-gray-200">
                  {reports.map((r, i: number) => (
                    <li
                      key={i}
                      className="-mx-2 flex items-baseline justify-between gap-4 rounded px-2 py-2.5 transition-colors hover:bg-blue-50/60"
                    >
                      {r.slug ? (
                        <Link
                          href={`/lost/${r.slug}`}
                          className="text-[15.5px] font-medium text-blue-800 no-underline hover:underline"
                        >
                          {r.label}
                        </Link>
                      ) : (
                        <span className="text-[15.5px] font-medium text-gray-900">{r.label}</span>
                      )}
                      <span className="shrink-0 text-xs tabular-nums text-gray-500">{r.meta}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ) : isSmallTown ? (
              <p className="mb-6 text-sm leading-relaxed text-gray-600">
                No report has been filed in {cityData.city_ascii} yet. Yours would be the first, and it
                gets a public page that anyone who finds your item can search.
              </p>
            ) : null}

            {latestNationwide.length > 0 && (
              <div>
                <h3 className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-gray-400">
                  Across the United States
                </h3>
                <ul className="space-y-2">
                  {latestNationwide.map((r, i: number) => (
                    <li key={`us-${i}`} className="text-[13.5px] leading-snug">
                      {r.slug ? (
                        <Link
                          href={`/lost/${r.slug}`}
                          className="text-blue-700 no-underline hover:underline"
                        >
                          {r.label}
                        </Link>
                      ) : (
                        <span className="text-gray-800">{r.label}</span>
                      )}
                      <span className="text-gray-500"> · {r.meta}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {guideUpdatedAt && (
              <p className="mt-5 border-t border-gray-100 pt-3 text-[11px] text-gray-400">
                Local contact details reviewed on {formatDate(new Date(guideUpdatedAt))}.
              </p>
            )}
          </div>

          {/* La carte s'étire pour épouser la hauteur de la colonne de gauche
              (le conteneur flex est en items-stretch par défaut) : plus de
              bande blanche sous une carte figée à 300 px. Le positionnement
              absolu évite de dépendre de la résolution d'un h-full en % . */}
          <div className="relative w-full h-[300px] overflow-hidden rounded-lg shadow lg:h-auto lg:w-1/2 lg:min-h-[320px] lg:max-h-[560px]">
            <div className="absolute inset-0">
              <CityMapSection lat={mapLat} lng={mapLng} cityId={cityData.id} />
            </div>
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
    ) : isChicago ? (
      <ChicagoExtraContent
        cityImage={cityImage}
        cityImageAlt={cityImageAlt}
        cityImageCredit={cityImageCredit}
      />
    ) : isHouston ? (
      <HoustonExtraContent
        cityImage={cityImage}
        cityImageAlt={cityImageAlt}
        cityImageCredit={cityImageCredit}
      />
    ) : isPhoenix ? (
      <PhoenixExtraContent
        cityImage={cityImage}
        cityImageAlt={cityImageAlt}
        cityImageCredit={cityImageCredit}
      />
    ) : dbGuide ? (
      <CityGuideExtra
        guide={dbGuide}
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
              <p className="text-sm text-gray-700 mb-3">
                See the full{" "}
                <Link
                  href={`/lost-and-found/${String(stateAbbr).toLowerCase()}`}
                  className="text-blue-700 hover:underline font-medium"
                >
                  lost &amp; found guide for {cityData.state_name}
                </Link>
                , including the legal holding period and where unclaimed items end up.
              </p>
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

    // JSON-LD : fil d'Ariane (aide Google à comprendre la hiérarchie état > ville)
    const breadcrumbJsonLd = {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: "Lost & Found", item: `${CANONICAL_BASE}/lost-and-found` },
        {
          "@type": "ListItem",
          position: 2,
          name: cityData.state_name || stateAbbr,
          item: `${CANONICAL_BASE}/lost-and-found/${(cityData.state_id || stateAbbr).toLowerCase()}`,
        },
        {
          "@type": "ListItem",
          position: 3,
          name: `${cityData.city_ascii}, ${cityData.state_id || stateAbbr}`,
          item: canonicalUrl(cityData.state_id || stateAbbr, params.city),
        },
      ],
    };

    // 9) Render
    return (
      <main className="bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
        />
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
