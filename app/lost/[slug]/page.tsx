// app/lost/[slug]/page.tsx
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;

import { notFound, redirect } from "next/navigation";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";
import ShareButton from "@/components/ShareButton";
import { normalizePublicId, publicIdFromUuid } from "@/lib/reportId";

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

  // 4) ZIP lookup from us_cities.main_zip (robust matching)
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

  return (
    <main className="max-w-3xl mx-auto px-4 py-8 text-gray-800">
      {/* H1 — short title */}
      <h1 className="text-2xl md:text-3xl font-bold mb-2">
        {displayTitle} lost in {city}
        {stateId ? ` (${stateId})` : ""}{" "}
        {placeLabel && placeLabel !== "unspecified place" ? `at ${placeLabel}` : ""}
      </h1>

      {/* Lead — keep FULL title */}
      <p className="text-lg mb-6">
        <strong>Lost item:</strong> {fullTitle}. {description}
      </p>

      {/* Info block */}
      <div className="bg-blue-50 border border-blue-100 rounded-xl p-5 space-y-3">
        <p>
          <span className="font-bold">📅 Date of loss:</span>{" "}
          {date ? `${date}${timeSlot ? ` (estimated time: ${timeSlot})` : ""}` : "Not specified"}
        </p>

        <p>
          <span className="font-bold">
            {icon} {displayTitle} lost at{" "}
          </span>
          {placeLabel}
        </p>

        {/* Public email box */}
        <div className="mt-2 p-3 rounded-lg bg-green-50 border border-green-200">
          <p className="font-bold mb-1">✅ If you found it, please send an email:</p>
          <a href={`mailto:${publicAlias}`} className="text-green-700 underline font-mono text-lg">
            {publicAlias}
          </a>
        </div>

        <p className="mt-2">
          <span className="font-bold">🏙️ City:</span> {city || "—"} <br />
          <span className="font-bold">📮 ZIP code:</span> {effectiveZip || "—"} <br />
          <span className="font-bold">🗺️ State:</span> {stateId || "—"}
        </p>

        {Boolean(circumstances) && (
          <p>
            <span className="font-bold">ℹ️ Circumstances of loss:</span> {circumstances}
          </p>
        )}
      </div>

      {/* Photo */}
      {objectPhoto && (
        <div className="mt-6">
          <img src={objectPhoto} alt={fullTitle} className="rounded-lg border shadow-sm" />
        </div>
      )}

      {/* Share */}
      <div className="mt-8">
        <ShareButton title={fullTitle} />
      </div>
    </main>
  );
}
