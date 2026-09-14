// app/lost/[slug]/page.tsx — modern & trustworthy design
// - Bandeau LOST placé dans l'encadré (au-dessus du titre) + City/State à droite du bandeau
// - Bouton Facebook share prérempli (ShareButton rendu sans SSR pour éviter window côté serveur)
// - generateMetadata() pour Open Graph / Twitter
// - Fonctionnalités et contenu conservés

export const runtime = "nodejs";
// ISR 1h : page publique cacheable (SEO), rafraîchie au plus tard toutes les heures.
export const revalidate = 3600;

import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";
// ShareButton sans SSR (évite "window is not defined" côté crawler Facebook)
// avant
// import dynamic from "next/dynamic";
// const ShareButtonNoSSR = dynamic(() => import("@/components/ShareButton"), { ssr: false });

// après
import NextDynamic from "next/dynamic";
const ShareButtonNoSSR = NextDynamic(() => import("@/components/ShareButton"), { ssr: false });

import { normalizePublicId, publicIdFromUuid } from "@/lib/reportId";
import Link from "next/link";
import { looksLikeObjectNotPlace, buildCityPath } from "@/lib/slugify";
import { redactPublic } from "@/lib/redactPublic";
import { holdingRule } from "@/lib/legalHolding";
import { stateNameFromAbbr } from "@/lib/utils";
import { MapPin } from "lucide-react";
import { headers as nextHeaders } from "next/headers";

type PageProps = { params: { slug: string } };

// ---------------- Utilities ----------------

// "City (OR)" -> "City"
function stripStateFromCity(city?: string | null) {
  if (!city) return "";
  return city.replace(/\s*\([A-Z]{2}\)\s*$/i, "").trim();
}

// Heuristic place inference from free text (fallback only)
function inferPlaceFromText(text: string) {
  const t = text.toLowerCase();

  const table: Array<{ match: RegExp; label: string; icon: string }> = [
    { match: /(airport|terminal|gate)/, label: "airport", icon: "✈️" },
    { match: /(subway|metro|underground)/, label: "subway", icon: "🚇" },
    { match: /(tram|streetcar)/, label: "tram", icon: "🚋" },
    { match: /(train|station)/, label: "train station", icon: "🚆" },
    { match: /(bus|coach)/, label: "bus", icon: "🚌" },
    { match: /(uber|lyft|taxi|cab|rideshare)/, label: "rideshare / taxi", icon: "🚗" },
    { match: /(street|road|avenue|boulevard|rue)/, label: "street", icon: "🛣️" },
    { match: /(park|playground)/, label: "park", icon: "🌳" },
    { match: /(beach|sand|shore)/, label: "beach", icon: "🏖️" },
    { match: /(river|bridge|pier)/, label: "river area", icon: "🌉" },
    { match: /(mall|shopping|store)/, label: "shopping area", icon: "🛍️" },
  ];

  for (const row of table) {
    if (row.match.test(t)) return { label: row.label, icon: row.icon };
  }
  return null;
}

// Choose a place label + icon from transport/place fields, otherwise infer from text
function pickPlace(data: any) {
  const src =
    (data?.transport_type_other?.trim?.() && { label: data.transport_type_other.trim() }) ||
    (data?.transport_type?.trim?.() && { label: data.transport_type.trim() }) ||
    (data?.place_type_other?.trim?.() && !looksLikeObjectNotPlace(data.place_type_other) && { label: data.place_type_other.trim() }) ||
    (data?.place_type?.trim?.() && !looksLikeObjectNotPlace(data.place_type) && { label: data.place_type.trim() });

  if (src?.label) {
    const val = (src.label || "").toLowerCase();
    const icon =
      val.includes("plane") || val.includes("airport")
        ? "✈️"
        : val.includes("metro") || val.includes("subway")
        ? "🚇"
        : val.includes("tram")
        ? "🚋"
        : val.includes("train")
        ? "🚆"
        : val.includes("bus")
        ? "🚌"
        : val.includes("taxi") ||
          val.includes("uber") ||
          val.includes("lyft") ||
          val.includes("vtc") ||
          val.includes("rideshare")
        ? "🚗"
        : val.includes("street") || val.includes("road") || val.includes("rue")
        ? "🛣️"
        : val.includes("park")
        ? "🌳"
        : val.includes("beach")
        ? "🏖️"
        : "📍";
    return { label: src.label, icon };
  }

  // Fallback: infer from title+description
  const inferred = inferPlaceFromText(
    `${data?.title || ""} ${data?.description || ""}`.trim()
  );
  if (inferred) return inferred;

  return { label: "unspecified place", icon: "📍" };
}

// --- Display short title (public page only) ---

const CATEGORY_MAP: Array<[RegExp, string]> = [
  [/passport/i, "Passport"],
  [/\b(id|identity)\b/i, "ID card"],
  [/wallet|purse|billfold/i, "Wallet"],
  [/keys?|keychain/i, "Keys"],
  [/phone|iphone|samsung|cell(\s|-)?phone/i, "Phone"],
  [/laptop|macbook|notebook/i, "Laptop"],
  [/tablet|ipad/i, "Tablet"],
  [/earpods?|ear ?buds|headphones?|airpods?/i, "Headphones"],
  [/glasses|sunglasses|spectacles/i, "Glasses"],
  [/bag|backpack|rucksack|handbag|suitcase|luggage/i, "Bag"],
  [/ring/i, "Ring"],
  [/necklace|pendant/i, "Necklace"],
  [/watch/i, "Watch"],
  [/camera|gopro|nikon|canon|sony\s*alpha/i, "Camera"],
];

const STOPWORDS = new Set([
  "i","we","my","our","the","a","an","with","and","in","on","at","to","for","of","from",
  "lost","misplaced","left","found","stolen","personal"
]);

function detectCategoryLabel(title: string): string | null {
  for (const [re, label] of CATEGORY_MAP) if (re.test(title)) return label;
  return null;
}

function shortenTitleForDisplay(title: string): string {
  if (!title) return "Item";
  const cat = detectCategoryLabel(title);
  if (cat) return cat;
  const words = title
    .replace(/[.,!?;:()"]/g, " ")
    .split(/\s+/)
    .map((w) => w.trim())
    .filter(Boolean)
    .filter((w) => !STOPWORDS.has(w.toLowerCase()));
  const take = words.slice(0, 4).join(" ");
  const pretty = take || title;
  return pretty.charAt(0).toUpperCase() + pretty.slice(1);
}

// "2025-12-29" ou un ISO -> "December 29, 2025". UTC forcé : sinon la date
// affichée peut reculer d'un jour selon le fuseau du serveur de rendu.
function formatLongDate(v?: string | null) {
  if (!v) return "";
  const d = new Date(String(v).length <= 10 ? `${v}T12:00:00Z` : v);
  if (isNaN(d.getTime())) return String(v);
  return d.toLocaleDateString("en-US", {
    year: "numeric", month: "long", day: "numeric", timeZone: "UTC",
  });
}

// ---------------- Metadata (OG/Twitter) ----------------

export async function generateMetadata(
  { params }: PageProps
): Promise<Metadata> {
  const supabase = getSupabaseAdmin({ fresh: false }); // cacheable : page ISR
  if (!supabase) return {};

  const { data } = await supabase
    .from("lost_items")
    .select(`
      slug, title, description, city, state_id, object_photo, place_type, place_type_other,
      transport_type, transport_type_other
    `)
    .eq("slug", params.slug)
    .maybeSingle();

  if (!data) return {};

  // ✅ URL absolue fiable (prod & preview) via headers aliasé
  const h = nextHeaders();
  const proto = h.get("x-forwarded-proto") ?? "https";
  const host = h.get("host") ?? "localhost:3000";
  const baseUrl =
    process.env.NEXT_PUBLIC_SITE_URL && process.env.NEXT_PUBLIC_SITE_URL.startsWith("http")
      ? process.env.NEXT_PUBLIC_SITE_URL
      : `${proto}://${host}`;

  const url = `${baseUrl}/lost/${params.slug}`;

  const city = stripStateFromCity(data.city ?? "");
  const placeFiltered = [data.place_type_other, data.place_type].find(
    (p: any) => p?.trim?.() && !looksLikeObjectNotPlace(p)
  );
  const place =
    data.transport_type_other?.trim?.() ||
    data.transport_type?.trim?.() ||
    placeFiltered?.trim() ||
    undefined;

  // Titre/desc pour les aperçus
  // Les aperçus sortent du site : ils passent par le même filtre que la page.
  const safeTitle = redactPublic(data.title ?? "");
  const safeDescription = redactPublic(data.description ?? "");

  const title = safeTitle
    ? `Lost: ${safeTitle}${city ? ` in ${city}` : ""}${data.state_id ? ` (${data.state_id})` : ""}`
    : `Lost report${city ? ` in ${city}` : ""}`;

  const descParts = [
    place ? `Possible location: ${place}` : null,
    safeDescription ? safeDescription : null,
  ].filter(Boolean);
  const description = descParts.join(" — ") || "Lost item report";

  // Image OG dynamique (endpoint /api/og/lost/[slug])
  const image = `${baseUrl}/api/og/lost/${params.slug}`;

  return {
    title,
    description,
    alternates: { canonical: url },
    openGraph: {
      type: "article",
      url,
      title,
      description,
      siteName: "ReportLost",
      images: [{ url: image, width: 1200, height: 630 }],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [image],
    },
  };
}

// ---------------- Page ----------------

export default async function LostReportPage({ params }: PageProps) {
  const supabase = getSupabaseAdmin({ fresh: false }); // cacheable : page ISR
  if (!supabase) notFound();

  const wantedSlug = params.slug;

  // 1) Load the report by slug
  let { data, error } = await supabase
    .from("lost_items")
    .select(
      `
      id, slug, public_id,
      title, description, circumstances,
      city, state_id,
      date, time_slot,
      transport_type, transport_type_other,
      place_type, place_type_other,
      loss_neighborhood, loss_street,
      object_photo, email, created_at
    `
    )
    .eq("slug", wantedSlug)
    .maybeSingle();

  if (error) {
    console.error("Supabase error:", error);
    notFound();
  }

  // 2) Fallback if slug got truncated to 120 chars
  if (!data) {
    const truncated = wantedSlug.slice(0, 120).replace(/-+$/, "");
    if (truncated !== wantedSlug) {
      const { data: d2 } = await supabase
        .from("lost_items")
        .select("slug")
        .eq("slug", truncated)
        .maybeSingle();
      if (d2) redirect(`/lost/${d2.slug}`);
    }
  }
  if (!data) notFound();

  // 3) Canonical redirect if slug differs
  if (data.slug !== wantedSlug) redirect(`/lost/${data.slug}`);

  // 4) ZIP lookup from us_cities.main_zip (robust matching) — conservé même si non affiché
  let effectiveZip: string | null = null;
  if (data.city && data.state_id) {
    const raw = String(data.city || "");
    const cityKey = raw.replace(/\s*\([A-Z]{2}\)\s*$/i, "").trim(); // strip "(XX)"

    // 1) exact on city_ascii
    const q1 = await supabase
      .from("us_cities")
      .select("main_zip")
      .eq("state_id", data.state_id)
      .eq("city_ascii", cityKey)
      .maybeSingle();
    effectiveZip = q1.data?.main_zip ?? null;

    // 2) ILIKE on city_ascii
    if (!effectiveZip) {
      const q2 = await supabase
        .from("us_cities")
        .select("main_zip")
        .eq("state_id", data.state_id)
        .ilike("city_ascii", cityKey)
        .maybeSingle();
      effectiveZip = q2.data?.main_zip ?? null;
    }

    // 3) exact on city (if dataset has it)
    if (!effectiveZip) {
      const q3 = await supabase
        .from("us_cities")
        .select("main_zip")
        .eq("state_id", data.state_id)
        .eq("city", cityKey)
        .maybeSingle();
      effectiveZip = q3.data?.main_zip ?? null;
    }

    // 4) ILIKE on city
    if (!effectiveZip) {
      const q4 = await supabase
        .from("us_cities")
        .select("main_zip")
        .eq("state_id", data.state_id)
        .ilike("city", cityKey)
        .maybeSingle();
      effectiveZip = q4.data?.main_zip ?? null;
    }
  }

  const { icon, label: placeLabel } = pickPlace(data);

  // Public alias: ALWAYS 5-char code
  const shortId =
    normalizePublicId(String(data.public_id || "")) ||
    publicIdFromUuid(String(data.id));
  const publicAlias = `item${shortId}@reportlost.org`;

  // Prepare fields for display
  // Filtre de publication : identifiants masqués, nature de l'objet conservée.
  const fullTitle = redactPublic(data.title) || "Item";
  const description = redactPublic(data.description);
  const cityRaw = data.city ?? "";
  const city = stripStateFromCity(cityRaw); // avoid “(OR) (OR)”
  const stateId = data.state_id ?? "";
  const date = data.date ?? "";
  const timeSlot = data.time_slot ?? "";
  const circumstances = redactPublic(data.circumstances);
  const objectPhoto = data.object_photo ?? "";

  // Short title for H1 + icon line
  const displayTitle = shortenTitleForDisplay(fullTitle);

  // Canonical URL pour partage Facebook (via headers aliasé)
  const h = nextHeaders();
  const proto = h.get("x-forwarded-proto") ?? "https";
  const host = h.get("host") ?? "localhost:3000";
  const baseUrl =
    process.env.NEXT_PUBLIC_SITE_URL && process.env.NEXT_PUBLIC_SITE_URL.startsWith("http")
      ? process.env.NEXT_PUBLIC_SITE_URL
      : `${proto}://${host}`;
  const pageUrl = `${baseUrl}/lost/${data.slug}`;

  // ---- Contexte local : règle légale vérifiée + liens descendants ----------
  // Ces trois liens sont la raison d'être du bloc : les pages /lost/ portent
  // l'essentiel de l'index du site et ne transmettaient rien aux guides.
  const legal = holdingRule(stateId);
  const stateName = stateNameFromAbbr(stateId);
  const cityPath = city && stateId ? buildCityPath(stateId, city) : null;
  const statePath = stateName && stateId ? `/lost-and-found/${stateId.toLowerCase()}` : null;

  // ---- Signalements voisins : même ville d'abord, complétés par l'État -----
  type NearbyRow = {
    slug: string;
    title: string | null;
    city: string | null;
    state_id: string | null;
    created_at: string | null;
  };
  let nearby: NearbyRow[] = [];
  if (stateId) {
    try {
      const cols = "slug, title, city, state_id, created_at";
      if (city) {
        const { data: sameCity } = await supabase
          .from("lost_items")
          .select(cols)
          .eq("state_id", stateId)
          .not("slug", "is", null)
          .neq("slug", data.slug)
          .ilike("city", `${city}%`)
          .order("created_at", { ascending: false })
          .limit(5);
        nearby = (sameCity || []) as NearbyRow[];
      }
      if (nearby.length < 5) {
        const { data: sameState } = await supabase
          .from("lost_items")
          .select(cols)
          .eq("state_id", stateId)
          .not("slug", "is", null)
          .neq("slug", data.slug)
          .order("created_at", { ascending: false })
          .limit(12);
        const seen = new Set(nearby.map((r) => r.slug));
        for (const r of (sameState || []) as NearbyRow[]) {
          if (nearby.length >= 5) break;
          if (r.slug && !seen.has(r.slug)) {
            nearby.push(r);
            seen.add(r.slug);
          }
        }
      }
    } catch {
      /* non bloquant : le bloc disparaît, la page reste */
    }
  }

  const reportedOn = formatLongDate(data.created_at);
  const lossOn = formatLongDate(date);

  // Fil d'Ariane : rendu en liens ET en JSON-LD (rich result + chemin de crawl).
  const crumbs = [
    { name: "Home", url: `${baseUrl}/` },
    { name: "Lost & found", url: `${baseUrl}/lost-and-found` },
    ...(statePath && stateName ? [{ name: stateName, url: `${baseUrl}${statePath}` }] : []),
    ...(cityPath && city ? [{ name: city, url: `${baseUrl}${cityPath}` }] : []),
    { name: displayTitle, url: pageUrl },
  ];
  const breadcrumbJsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: crumbs.map((c, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: c.name,
      item: c.url,
    })),
  };

  return (
    <main className="bg-white">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />

      {/* Fil d'Ariane : remplace l'ancienne barre grise « ville + Report ID ».
          Même information, plus compacte, et surtout cliquable. */}
      <nav aria-label="Breadcrumb" className="border-b border-slate-200 bg-white">
        <ol className="mx-auto flex max-w-4xl flex-wrap items-center gap-x-1.5 gap-y-1 px-4 py-3 text-[12.5px] text-slate-500">
          {crumbs.map((c, i) => {
            const last = i === crumbs.length - 1;
            return (
              <li key={c.url + i} className="flex items-center gap-1.5">
                {i > 0 && <span className="text-slate-300">›</span>}
                {last ? (
                  <span className="text-slate-600">{c.name}</span>
                ) : (
                  <Link
                    href={c.url.replace(baseUrl, "") || "/"}
                    prefetch={false}
                    className="text-blue-700 hover:underline"
                  >
                    {c.name}
                  </Link>
                )}
              </li>
            );
          })}
        </ol>
      </nav>

      <section className="mx-auto max-w-4xl px-4 py-10">
        <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="px-6 pb-2 pt-7 md:px-8">
            <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
              <div className="inline-flex items-center rounded-md bg-orange-500/95 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-white">
                LOST
              </div>
              <div className="text-xs text-slate-500">
                {reportedOn ? (
                  <>Reported <span className="font-medium text-slate-700">{reportedOn}</span> · </>
                ) : null}
                ID {shortId}
              </div>
            </div>

            <h1 className="text-balance text-3xl font-semibold tracking-tight text-slate-900 md:text-4xl">
              {displayTitle} lost in {city}
              {stateId ? ` (${stateId})` : ""}{" "}
              {placeLabel && placeLabel !== "unspecified place" ? `at ${placeLabel}` : ""}
            </h1>

            <p className="mt-3 max-w-2xl text-base leading-7 text-slate-700">
              <strong>{fullTitle}.</strong> {description}
            </p>
          </div>

          <hr className="border-slate-200/80" />

          {/* Faits : les badges City/State en double ont disparu, la ville est
              déjà dans le fil d'Ariane et dans le titre. */}
          <div className="px-6 py-6 md:px-8">
            <div className="grid gap-3 md:grid-cols-2 md:gap-x-8">
              <div className="flex items-start gap-3">
                <div className="mt-0.5 flex h-6 w-6 flex-none items-center justify-center rounded-full border border-slate-300 text-sm text-slate-700">📅</div>
                <p className="text-slate-800">
                  <span className="font-medium">Date of loss:</span>{" "}
                  {lossOn ? `${lossOn}${timeSlot ? `, ${timeSlot}` : ""}` : "Not specified"}
                </p>
              </div>

              <div className="flex items-start gap-3">
                <div className="mt-0.5 flex h-6 w-6 flex-none items-center justify-center rounded-full border border-slate-300 text-sm text-slate-700">
                  <MapPin className="h-4 w-4 text-emerald-700" />
                </div>
                <p className="text-slate-800">
                  <span className="font-medium">Where:</span> {placeLabel}
                  {city ? ` — ${city}${stateId ? `, ${stateId}` : ""}` : ""}
                </p>
              </div>

              {Boolean(circumstances) && (
                <p className="text-slate-800 md:col-span-2">
                  <span className="font-medium">ℹ️ Circumstances of loss:</span> {circumstances}
                </p>
              )}
            </div>

            {/* Boîte inventeur */}
            <div className="mt-6 rounded-xl border border-emerald-200 bg-emerald-50 p-4">
              <p className="mb-1 font-medium text-slate-900">
                ✅ Found this {displayTitle.toLowerCase()}? Write to the owner:
              </p>
              <a
                href={`mailto:${publicAlias}`}
                className="font-mono text-lg text-emerald-800 underline underline-offset-4 hover:text-emerald-900"
              >
                {publicAlias}
              </a>
              <p className="mt-1 text-sm text-emerald-900/80">
                This address belongs to this report only and forwards straight to the owner. No
                personal address is published.
              </p>
            </div>

            {/* Photo */}
            {objectPhoto && (
              <div className="mt-6">
                <figure className="overflow-hidden rounded-xl border border-slate-200">
                  <img src={objectPhoto} alt={fullTitle} className="block max-h-[520px] w-full object-cover" />
                </figure>
              </div>
            )}

            {/* Conversion : la page ne parlait qu'à l'inventeur. Sur Google,
                « lost <objet> <ville> » est tapé par quelqu'un qui a perdu. */}
            <div className="mt-6 rounded-xl bg-gradient-to-r from-[#26723e] to-[#2ea052] px-6 py-5">
              <p className="text-[17px] font-semibold text-white">
                Lost something in {city || "your area"} too?
              </p>
              <p className="mt-1.5 max-w-2xl text-sm leading-relaxed text-emerald-50">
                File your own report in a few minutes. Publishing it is free. The $25 Active search
                adds the filing with the local lost-property service, outreach to the places likely
                to hold your item, a published visual notice and twelve months of web monitoring.
              </p>
              <Link
                href="/report"
                className="mt-4 inline-block rounded-lg bg-white px-5 py-2.5 text-sm font-semibold text-[#1f6b3a] shadow hover:bg-emerald-50"
              >
                Report my lost item →
              </Link>
            </div>

            {/* Contexte local + liens descendants vers ville et État */}
            {(legal || cityPath || statePath) && (
              <div className="mt-6 overflow-hidden rounded-xl border border-slate-200">
                <div className="border-b border-slate-200 bg-slate-50/70 px-4 py-3 text-[11px] font-semibold uppercase tracking-wide text-slate-400">
                  Lost &amp; found in {city ? `${city}, ` : ""}{stateName || stateId}
                </div>
                <div className="px-4 py-4">
                  {legal && (
                    <div className="mb-4 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3">
                      <p className="text-sm leading-relaxed text-amber-900">
                        <span className="font-semibold">In {stateName || stateId}, </span>
                        {legal.note}
                        {legal.citation ? (
                          <span className="text-amber-700"> {legal.citation}</span>
                        ) : null}
                      </p>
                    </div>
                  )}
                  <div className="flex flex-col gap-2">
                    {cityPath && (
                      <Link prefetch={false} href={cityPath} className="text-[15px] font-medium text-blue-800 hover:underline">
                        Lost &amp; found desks and contacts in {city}{" "}
                        <span className="font-normal text-slate-500">
                          — local police, venues, transit
                        </span>
                      </Link>
                    )}
                    {statePath && (
                      <Link prefetch={false} href={statePath} className="text-[15px] font-medium text-blue-800 hover:underline">
                        The full {stateName} lost &amp; found guide{" "}
                        <span className="font-normal text-slate-500">
                          — finder duties, deadlines, where unclaimed items end up
                        </span>
                      </Link>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Signalements voisins : relie entre elles des pages qui n'étaient
                connectées que par le sitemap. */}
            {nearby.length > 0 && (
              <div className="mt-6">
                <h2 className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-slate-400">
                  Other reports nearby
                </h2>
                <ul className="border-t border-slate-200">
                  {nearby.map((r) => {
                    const label = redactPublic(r.title) || "Lost item";
                    const where = [
                      stripStateFromCity(r.city || ""),
                      r.state_id || "",
                    ].filter(Boolean).join(", ");
                    return (
                      <li
                        key={r.slug}
                        className="-mx-2 flex items-baseline justify-between gap-4 rounded border-b border-slate-200 px-2 py-2.5 hover:bg-slate-50"
                      >
                        <Link
                          prefetch={false}
                          href={`/lost/${r.slug}`}
                          className="text-[15px] font-medium text-blue-800 hover:underline"
                        >
                          {label}
                          {where ? <span className="font-normal text-slate-500"> — {where}</span> : null}
                        </Link>
                        <span className="flex-none text-xs tabular-nums text-slate-500">
                          {formatLongDate(r.created_at)}
                        </span>
                      </li>
                    );
                  })}
                </ul>
              </div>
            )}

            {/* Partage : le lien Facebook autonome faisait doublon, il est déjà
                dans le menu de ShareButton. */}
            <div className="mt-8 flex flex-wrap items-center justify-between gap-3 border-t border-slate-200 pt-5">
              <div className="text-xs text-slate-500">Public report · ID {shortId}</div>
              <ShareButtonNoSSR title={fullTitle} />
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
