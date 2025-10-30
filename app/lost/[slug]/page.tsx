// app/lost/[slug]/page.tsx — modern & trustworthy design
// - Bandeau LOST placé dans l'encadré (au-dessus du titre) + City/State à droite du bandeau
// - Bouton Facebook share prérempli (ShareButton rendu sans SSR pour éviter window côté serveur)
// - generateMetadata() pour Open Graph / Twitter
// - Fonctionnalités et contenu conservés

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;

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
    (data?.place_type_other?.trim?.() && { label: data.place_type_other.trim() }) ||
    (data?.place_type?.trim?.() && { label: data.place_type.trim() });

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

// ---------------- Metadata (OG/Twitter) ----------------

export async function generateMetadata(
  { params }: PageProps
): Promise<Metadata> {
  const supabase = getSupabaseAdmin();
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
  const place =
    data.transport_type_other?.trim?.() ||
    data.transport_type?.trim?.() ||
    data.place_type_other?.trim?.() ||
    data.place_type?.trim?.() ||
    undefined;

  // Titre/desc pour les aperçus
  const title = data.title
    ? `Lost: ${data.title}${city ? ` in ${city}` : ""}${data.state_id ? ` (${data.state_id})` : ""}`
    : `Lost report${city ? ` in ${city}` : ""}`;

  const descParts = [
    place ? `Possible location: ${place}` : null,
    data.description ? data.description : null,
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
  const supabase = getSupabaseAdmin();
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
  const fullTitle = data.title ?? "Item";
  const description = data.description ?? "";
  const cityRaw = data.city ?? "";
  const city = stripStateFromCity(cityRaw); // avoid “(OR) (OR)”
  const stateId = data.state_id ?? "";
  const date = data.date ?? "";
  const timeSlot = data.time_slot ?? "";
  const circumstances = data.circumstances ?? "";
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

  return (
    <main className="bg-white">
      {/* Top bar sobre (ZIP non affiché) */}
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-4xl items-center justify-between px-4 py-3">
          <div className="flex items-center gap-2 text-slate-800">
            <MapPin className="h-5 w-5 text-emerald-700" />
            <span className="text-sm font-medium text-slate-700">
              {city || "—"}{stateId ? `, ${stateId}` : ""}
            </span>
          </div>
          <div className="text-xs text-slate-500">Report ID · {shortId}</div>
        </div>
      </header>

      <section className="mx-auto max-w-4xl px-4 py-10">
        <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="px-6 pb-2 pt-7 md:px-8">
            {/* Ligne bandeau LOST + badges City/State à droite */}
            <div className="mb-4 flex items-center justify-between gap-3">
              <div className="inline-flex items-center rounded-md bg-orange-500/95 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-white">
                LOST
              </div>
              <div className="flex items-center gap-2">
                <span className="inline-flex items-center gap-2 rounded-md border border-slate-300 bg-slate-50 px-2.5 py-1 text-xs text-slate-800">
                  <span className="font-medium">City:</span> {city || "—"}
                </span>
                <span className="inline-flex items-center gap-2 rounded-md border border-slate-300 bg-slate-50 px-2.5 py-1 text-xs text-slate-800">
                  <span className="font-medium">State:</span> {stateId || "—"}
                </span>
              </div>
            </div>

            <h1 className="text-balance text-3xl font-semibold tracking-tight text-slate-900 md:text-4xl">
              {displayTitle} lost in {city}
              {stateId ? ` (${stateId})` : ""}{" "}
              {placeLabel && placeLabel !== "unspecified place" ? `at ${placeLabel}` : ""}
            </h1>

            {/* Lead — conserve le titre complet */}
            <p className="mt-3 max-w-2xl text-base leading-7 text-slate-700">
              <strong>Lost item:</strong> {fullTitle}. {description}
            </p>
          </div>

          <hr className="border-slate-200/80" />

          <div className="px-6 py-6 md:px-8">
            <div className="grid gap-6 md:grid-cols-2">
              <div className="space-y-3">
                <div className="flex items-start gap-3">
                  <div className="mt-0.5 flex h-6 w-6 items-center justify-center rounded-full border border-slate-300 text-sm text-slate-700">📅</div>
                  <p className="text-slate-800">
                    <span className="font-medium">Date of loss:</span>{" "}
                    {date ? `${date}${timeSlot ? ` (estimated time: ${timeSlot})` : ""}` : "Not specified"}
                  </p>
                </div>

                <div className="flex items-start gap-3">
                  <div className="mt-0.5 flex h-6 w-6 items-center justify-center rounded-full border border-slate-300 text-sm text-slate-700">
                    <MapPin className="h-4 w-4 text-emerald-700" />
                  </div>
                  <p className="text-slate-800">
                    <span className="font-medium">{displayTitle} lost at</span> {placeLabel}
                  </p>
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex flex-wrap gap-2">
                  <span className="inline-flex items-center gap-2 rounded-md border border-slate-300 bg-slate-50 px-2.5 py-1 text-sm text-slate-800"><span className="font-medium">City:</span> {city || "—"}</span>
                  <span className="inline-flex items-center gap-2 rounded-md border border-slate-300 bg-slate-50 px-2.5 py-1 text-sm text-slate-800"><span className="font-medium">State:</span> {stateId || "—"}</span>
                </div>
                {Boolean(circumstances) && (
                  <p className="text-slate-800"><span className="font-medium">ℹ️ Circumstances of loss:</span> {circumstances}</p>
                )}
              </div>
            </div>

            {/* Public email box */}
            <div className="mt-6 rounded-xl border border-emerald-200 bg-emerald-50 p-4">
              <p className="mb-1 font-medium text-slate-900">✅ If you found it, please send an email:</p>
              <a
                href={`mailto:${publicAlias}`}
                className="font-mono text-lg text-emerald-800 underline underline-offset-4 hover:text-emerald-900"
              >
                {publicAlias}
              </a>
              <p className="mt-1 text-sm text-emerald-900/80">
                This email is unique to this report and forwards directly to the owner.
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

            {/* Share */}
            <div className="mt-8 flex items-center justify-between gap-3">
              <div className="text-xs text-slate-500">Public report</div>
              <div className="flex items-center gap-2">
                <a
                  href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(pageUrl)}&quote=${encodeURIComponent(fullTitle)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="rounded-md border border-slate-300 px-3 py-1.5 text-sm text-slate-700 hover:bg-slate-50"
                >
                  Share on Facebook
                </a>
                <ShareButtonNoSSR title={fullTitle} />
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
