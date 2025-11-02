// app/lost-and-found/category/[category]/page.tsx
export const revalidate = 0; // fresh data on every request

import Image from "next/image";
import { notFound } from "next/navigation";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import Link from "next/link";
import phrasesRaw from "@/lib/category-phrases.json";
import { categoryContent } from "@/lib/category-content";
import { buildCityPath } from "@/lib/slugify";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";

type Props = { params: { category: string } };
type Report = {
  id: string;
  title: string;
  category: string;        // category slug of the page (for local image)
  city?: string | null;
  state_id?: string | null;
  image?: string | null;   // absolute URL if present
  status: "lost" | "found";
  // ➕ champs utiles pour popup mail + date
  public_id?: string | number | null;
  created_at?: string | null;
  date?: string | null;
  isFake?: boolean;        // pour distinguer les seeds
};

// ---------- Supabase ----------
function getSupabase(): SupabaseClient {
  // 1) Essaie le client admin (service role) si dispo — lecture sans RLS bloquants
  const admin = getSupabaseAdmin();
  if (admin) return admin as unknown as SupabaseClient;

  // 2) Sinon, fallback sur les variables publiques
  const url =
    process.env.SUPABASE_URL ||
    process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key =
    process.env.SUPABASE_ANON_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !key) throw new Error("Missing SUPABASE_URL/_ANON_KEY (or NEXT_PUBLIC_*)");
  return createClient(url, key);
}

// ---------- helpers ----------
function slugify(s: string) {
  return String(s)
    .toLowerCase()
    .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
    .replace(/&/g, "and")
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

function formatMonthDayYear(d: Date) {
  return d.toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });
}

// --- aliases pour les sacs/valises (bag/purse/handbag/backpack/luggage) ---
const BAG_ALIASES = new Set([
  "bag-or-suitcase","bag","purse","handbag",
  "backpack","backpack-or-suitcase","luggage","suitcase"
]);
function normalizeCategory(cat: string) {
  const s = (cat || "").toLowerCase();
  return BAG_ALIASES.has(s) ? "bag" : s;
}

// Local category images
const KNOWN = new Set([
  "pets","glasses","bag","bag-suitcase","keys","jewelry","wallet",
  "electronics","documents","clothes","other",
]);

// 🔧 Slugs alternatifs “bag-like” → image bag-suitcase.jpg
const CATEGORY_IMAGE_ALIAS: Record<string, string> = {
  "bag": "bag-suitcase",
  "bag-or-suitcase": "bag-suitcase",
  "backpack-or-suitcase": "bag-suitcase",
  "purse-handbag": "bag-suitcase",
  "handbag": "bag-suitcase",
  "backpack": "bag-suitcase",
  "suitcase": "bag-suitcase",
};
function categoryImage(categorySlug: string) {
  const key = CATEGORY_IMAGE_ALIAS[categorySlug] || categorySlug;
  return KNOWN.has(key)
    ? `/images/categories/${key}.jpg`
    : "/images/categories/default.jpg";
}
function computeReportImage(r: Report) {
  return r.image && /^https?:\/\//.test(r.image) ? r.image : categoryImage(r.category);
}

const phrases: Record<string, string[]> = phrasesRaw as any;

// ---------- EN-only synonyms (avec 2 exceptions utiles : pull→clothes, bague→jewelry) ----------
const KEYWORDS: Record<string, string[]> = {
  keys: [
    "keys","key","keychain","fob","car key","house key","apartment key","office key",
  ],
  wallet: [
    "wallet","cardholder","card holder","billfold",
  ],
  electronics: [
    "phone","iphone","android","tablet","ipad","laptop","macbook","notebook pc",
    "earbuds","airpods","headphones","charger","power bank","smartwatch","apple watch",
  ],
  glasses: [
    "glasses","sunglasses","spectacles","eyeglasses","shades","frame","goggles","ray-ban",
  ],
  documents: [
    "passport","id","id card","driver license","license","permit","document","paperwork","papers","envelope","visa",
  ],
  jewelry: [
    "ring","bracelet","necklace","earring","earrings","watch","pendant","wedding band",
    "bague",
  ],
  clothes: [
    "jacket","coat","hoodie","sweater","jumper","scarf","cap","hat","beanie","gloves","raincoat","vest",
    "t-shirt","shirt","jeans",
    "pull",
  ],
  bag: [
    "bag","backpack","rucksack","suitcase","carry-on","handbag","tote","duffel","messenger bag","purse","briefcase",
  ],
  pets: [
    "cat","dog","kitten","puppy","bird","parrot","tortoise","rabbit","bunny","hamster","ferret",
  ],
  other: [
    "umbrella","bottle","water bottle","notebook","book","sketchbook","tripod","speaker","camera strap","accessory",
  ],
};

// Build OR filter for PostgREST: title.ilike.%kw%,description.ilike.%kw%
function buildOrFilter(keywords: string[], cols: string[]) {
  const parts: string[] = [];
  for (const kw of keywords) {
    const safe = kw.replace(/[%(),]/g, ""); // basic sanitization
    for (const c of cols) parts.push(`${c}.ilike.%${safe}%`);
  }
  return parts.join(",");
}

// ---------- DB search (title/description only, no tags) ----------
// ➕ filtre 30 jours et récupère public_id/date/created_at
async function searchTable(
  sb: SupabaseClient,
  table: "lost_items" | "found_items",
  keywords: string[],
  limit = 10
) {
  const cols1 = ["title","description"];
  const or1 = buildOrFilter(keywords, cols1);

  const sel =
    table === "lost_items"
      ? "id,title,city,state_id,object_photo,public_id,date,created_at"
      : "id,title,city,state_id,image_url,date,created_at";

  const thirtyDaysAgoIso = new Date(Date.now() - 30*24*60*60*1000).toISOString();

  let q = sb.from(table)
    .select(sel)
    .or(or1)
    .gte("created_at", thirtyDaysAgoIso) // ← vrais items (30 jours)
    .order("created_at", { ascending: false })
    .limit(limit);

  let { data, error } = await q;

  // fallback si la colonne description n'existe pas
  if (error) {
    const or2 = buildOrFilter(keywords, ["title"]);
    q = sb.from(table)
      .select(sel)
      .or(or2)
      .gte("created_at", thirtyDaysAgoIso)
      .order("created_at", { ascending: false })
      .limit(limit);
    ({ data, error } = await q);
  }
  if (error) return [];

  return (data ?? []).map((r: any) => {
    const base = {
      id: String(r.id),
      title: r.title || (table === "lost_items" ? "Lost item" : "Found item"),
      city: r.city ?? null,
      state_id: r.state_id ?? null,
      created_at: r.created_at ?? null,
      date: r.date ?? null,
      public_id: r.public_id ?? null,
      isFake: false,
    };
    return table === "lost_items"
      ? { ...base, image: r.object_photo || null, status: "lost" as const }
      : { ...base, image: r.image_url || null, status: "found" as const };
  });
}

// --------- Extra filtres “pets” (évite CAT™ & co) ----------
const ANIMAL_RE = /\b(cat|dog|kitten|puppy|bird|parrot|tortoise|rabbit|bunny|hamster|ferret)s?\b/i;
const NON_PET_RE = /\b(battery|jumper|cables?|charger|terminal|ids?|passport|wallet|phone|laptop|computer|tool|equipment|generator|power\s*bank|brand|caterpillar)\b/i;

function isPetReportLike(r: Report): boolean {
  // Besoin d'une image réelle
  if (!r.image) return false;

  const text = (r.title || "").toLowerCase();
  // Exclure "CAT" en majuscules (marque) ou tout indice non animal
  if (/\bCAT\b/.test(r.title || "")) return false;
  if (NON_PET_RE.test(text)) return false;

  // Doit contenir un vrai mot d’animal
  return ANIMAL_RE.test(text);
}

async function fetchReportsByKeyword(categorySlug: string): Promise<{ lost: Report[]; found: Report[] }> {
  const sb = getSupabase();
  const base = normalizeCategory(categorySlug);
  const kws = KEYWORDS[base] ?? [base];

  const [lostRaw, foundRaw] = await Promise.all([
    searchTable(sb, "lost_items", kws, 10),
    searchTable(sb, "found_items", kws, 10),
  ]);

  let lost: Report[] = (lostRaw as any[]).map((r) => ({ ...r, category: categorySlug }));
  let found: Report[] = (foundRaw as any[]).map((r) => ({ ...r, category: categorySlug }));

  // ✅ Spécifique à "pets" : image obligatoire + heuristique “animal”
  if (categorySlug === "pets") {
    lost = lost.filter(isPetReportLike);
    found = found.filter(isPetReportLike);
  }

  return { lost, found };
}

// ---------- Seeds (~20 cards) with 85% cats/dogs for pets ----------
function pick<T>(arr: T[]) { return Math.floor(Math.random()*arr.length) in arr ? arr[Math.floor(Math.random()*arr.length)] : arr[0]; }
const DEMO_CITIES = [
  { city: "Seattle", state_id: "WA" }, { city: "Portland", state_id: "OR" },
  { city: "San Francisco", state_id: "CA" }, { city: "Los Angeles", state_id: "CA" },
  { city: "Denver", state_id: "CO" }, { city: "Austin", state_id: "TX" },
  { city: "Chicago", state_id: "IL" }, { city: "Miami", state_id: "FL" },
  { city: "Boston", state_id: "MA" }, { city: "New York", state_id: "NY" },
];

const SEED_TITLES: Record<string, { lost: string[]; found: string[] }> = {
  keys: { lost: ["Key ring with car fob","Apartment keys with blue tag","Office keys on ring","House keys red cover","Single car key – Toyota","Keys with supermarket tag"],
          found: ["Keys found near metro","Car key in parking lot","Key ring on park bench","Keys turned in at reception","House key by playground","Keys found at café"] },
  wallet: { lost: ["Black leather wallet","Small brown card holder","Wallet with zip pouch","Travel wallet (passport)","Minimalist wallet – charcoal","Blue canvas wallet"],
            found: ["Wallet found in bus","Card holder at counter","Wallet near ATM","Travel wallet left in taxi","Wallet at gym locker","Wallet in library"] },
  electronics: { lost: ["iPhone black case","Android phone cracked","iPad in gray sleeve","Wireless earbuds in case","Laptop charger USB-C","Smartwatch dark strap"],
                 found: ["Phone found in rideshare","Tablet at museum","Earbuds on path","Power bank on bench","Charger in lounge","Headphones in gym"] },
  glasses: { lost: ["Reading glasses in case","Black prescription glasses","Sunglasses round brown","Blue frame glasses","Tortoiseshell glasses","Aviator sunglasses"],
             found: ["Glasses near fountain","Sunglasses at desk","Reading glasses in café","On tram seat","Glasses case in park","Sunglasses on beach"] },
  documents: { lost: ["ID card holder","Passport cover – navy","Envelope with papers","Folder with receipts","Student ID card","Work badge"],
               found: ["Passport at station","ID card on sidewalk","Paper folder in lobby","Badge at office entrance","Envelope near mailbox","Docs at info desk"] },
  jewelry: { lost: ["Gold ring small stone","Silver bracelet","Necklace heart pendant","Single stud earring","Watch leather strap","Charm bracelet"],
             found: ["Ring near fountain","Bracelet at pool","Necklace on steps","Earring in parking","Watch in locker room","Pendant on trail"] },
  clothes: { lost: ["Black hoodie","Denim jacket","Gray wool scarf","Navy baseball cap","Yellow raincoat","Beige sweater"],
             found: ["Jacket on bench","Scarf at café","Cap near field","Coat in theater","Hoodie at gym","Sweater in library"] },
  bag: { lost: ["Backpack dark gray","Small handbag black","Carry-on suitcase blue","Tote bag with logo","Canvas messenger bag","Red gym bag"],
         found: ["Backpack on bus","Suitcase at airport","Tote in bookstore","Handbag in restroom","Messenger bag at café","Gym bag by court"] },
  // pets: handled specially (85% cats/dogs)
  pets: { lost: ["Missing cat with collar","Lost dog black harness","Parrot green","Tortoise in garden","White rabbit","Brown ferret"],
          found: ["Cat found in courtyard","Dog near park","Bird on balcony","Puppy turned in","Rabbit near school","Kitten by river"] },
  other: { lost: ["Umbrella black","Water bottle","Dotted notebook","Sketchbook","Portable speaker","Camera strap"],
           found: ["Umbrella in lobby","Bottle in gym","Notebook turned in","Speaker on lawn","Tripod found","Book on bench"] },
};

function seedPets(count: number, status: "lost" | "found") {
  const catsDogsTitles =
    status === "lost"
      ? ["Missing cat with collar","Lost dog black harness","Lost puppy","Lost kitten","Small dog – blue leash","Black cat with bell"]
      : ["Cat found near park","Dog found by river","Puppy turned in","Kitten found near café","Dog found in courtyard","Cat found on steps"];

  const othersTitles =
    status === "lost"
      ? ["Lost parrot","Lost rabbit","Lost tortoise","Lost ferret","Missing hamster"]
      : ["Parrot found on balcony","Rabbit found near school","Tortoise found in garden","Ferret found by trail","Hamster found in yard"];

  const nCatsDogs = Math.round(count * 0.85);
  const nOthers = count - nCatsDogs;

  const items: { title: string }[] = [];
  for (let i = 0; i < nCatsDogs; i++) items.push({ title: catsDogsTitles[i % catsDogsTitles.length] });
  for (let i = 0; i < nOthers; i++) items.push({ title: othersTitles[i % othersTitles.length] });

  return items.map((it, i) => {
    const loc = pick(DEMO_CITIES);
    return {
      id: `seed-${status}-pets-${i}`,
      title: it.title,
      category: "pets",
      city: loc.city,
      state_id: loc.state_id,
      image: null,
      status,
      isFake: true,
    } as Report;
  });
}

// ---------- ✅ dates pour les faux items + banque basée sur la catégorie normalisée ----------
function seedReports(categorySlug: string, status: "lost" | "found", count: number): Report[] {
  if (count <= 0) return [];
  if (categorySlug === "pets") return seedPets(count, status);

  const base = normalizeCategory(categorySlug);
  const bank = SEED_TITLES[base] || SEED_TITLES.other;
  const titles = bank[status] as string[];
  const items: Report[] = [];
  for (let i = 0; i < count; i++) {
    const t = titles[i % titles.length] || `${status === "lost" ? "Lost" : "Found"} item`;
    const loc = pick(DEMO_CITIES);
    const iso = new Date(Date.now() - i * 24 * 60 * 60 * 1000).toISOString(); // ← date synthétique récente
    items.push({
      id: `seed-${status}-${categorySlug}-${i}`,
      title: t,
      category: categorySlug,
      city: loc.city,
      state_id: loc.state_id,
      image: null,
      status,
      isFake: true,
      // ➕ pour afficher la date sur les faux items
      created_at: iso,
      date: iso,
    });
  }
  return items;
}

function ensureTwenty(lost: Report[], found: Report[], categorySlug: string) {
  const needLost = Math.max(0, 10 - lost.length);
  const needFound = Math.max(0, 10 - found.length);
  return {
    lost: lost.concat(seedReports(categorySlug, "lost", needLost)),
    found: found.concat(seedReports(categorySlug, "found", needFound)),
  };
}

// ---------- SEO ----------
export async function generateMetadata({ params }: Props) {
  const raw = decodeURIComponent(params.category);
  const category = slugify(raw);
  const title = `Lost & Found: ${category[0]?.toUpperCase()}${category.slice(1)}`;
  return {
    title,
    description: `View recent lost and found reports for ${category}. Submit your own report and increase your chances of recovery.`,
    alternates: { canonical: `https://reportlost.org/lost-and-found/category/${category}` },
  };
}

// ---------- Page ----------
export default async function CategoryPage({ params }: Props) {
  const raw = decodeURIComponent(params.category || "");
  const categorySlug = slugify(raw);
  if (!categorySlug) return notFound();

  const phrasePool = (phrases as any)[categorySlug] ?? [];
  const phrase = phrasePool.length ? phrasePool[Math.floor(Math.random() * phrasePool.length)] : "";
  const staticPhrase = categoryContent[categorySlug] ?? "";

  // fetch by EN-only keywords (title/description) sur 30 jours
  const { lost, found } = await fetchReportsByKeyword(categorySlug);
  const filled = ensureTwenty(lost, found, categorySlug);

  return (
    <section className="max-w-6xl mx-auto px-4 py-10">
      <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-3 text-center">
        Lost &amp; Found: {categorySlug.charAt(0).toUpperCase() + categorySlug.slice(1)}
      </h1>

      {phrase && <p className="text-center text-gray-700 mb-2 max-w-2xl mx-auto italic">{phrase}</p>}
      {staticPhrase && <p className="text-center text-gray-700 mb-8 max-w-2xl mx-auto">{staticPhrase}</p>}

      <div className="flex justify-center mb-8">
        <Link
          prefetch={false}
          href={`https://reportlost.org/report?tab=lost&category=${encodeURIComponent(categorySlug)}`}
          className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-md font-semibold transition"
          aria-label={`Report a lost ${categorySlug}`}
        >
          Report a Lost {categorySlug.charAt(0).toUpperCase() + categorySlug.slice(1)}
        </Link>
      </div>

      <div className="grid md:grid-cols-2 gap-8">
        <div>
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Recently Found {categorySlug.charAt(0).toUpperCase() + categorySlug.slice(1)}
          </h2>
          <div className="space-y-4">
            {filled.found.map((r) => <ReportCard key={r.id} report={r} />)}
          </div>
        </div>
        <div>
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Recently Reported Lost {categorySlug.charAt(0).toUpperCase() + categorySlug.slice(1)}
          </h2>
          <div className="space-y-4">
            {filled.lost.map((r) => <ReportCard key={r.id} report={r} />)}
          </div>
        </div>
      </div>
    </section>
  );
}

// ---------- Card ----------

// ✅ formate l’emplacement sans doublonner l’état (p.ex. “Manhattan (NY), NY” → “Manhattan, NY”)
function formatLocation(city?: string | null, state?: string | null) {
  const cleanCity = (city || "").replace(/\s*\(([A-Z]{2})\)\s*$/i, "").trim();
  if (cleanCity && state) return `${cleanCity}, ${state}`;
  return cleanCity || "—";
}

// ✅ formate la date : priorité à "date" (si fournie), sinon "created_at"
function formatLossDate(report: Report) {
  const d =
    (report.date && new Date(report.date)) ||
    (report.created_at && new Date(report.created_at)) ||
    null;
  return d ? formatMonthDayYear(d) : "—";
}

// ✅ email pour contact (vrai = item{public_id}@..., faux = item94351@...)
function emailForReport(r: Report) {
  if (!r.isFake && r.public_id != null && String(r.public_id).trim() !== "") {
    return `item${String(r.public_id)}@reportlost.org`;
  }
  return "item94351@reportlost.org";
}

// ✅ construit un lien mailto avec subject/body préremplis (owner claim)
function mailtoHref(r: Report) {
  const email = emailForReport(r);
  const subject = encodeURIComponent(`Possible owner — ${r.title || "ReportLost.org"}`);
  const loc = formatLocation(r.city, r.state_id);
  const when = formatLossDate(r);
  const body =
    `Hello,%0D%0A%0D%0AI believe this item may be mine.%0D%0A` +
    `Title: ${encodeURIComponent(r.title || "—")}%0D%0A` +
    (loc !== "—" ? `Location: ${encodeURIComponent(loc)}%0D%0A` : "") +
    (when !== "—" ? `Date: ${encodeURIComponent(when)}%0D%0A` : "") +
    (r.public_id ? `Reference: ${encodeURIComponent(String(r.public_id))}%0D%0A` : "") +
    `%0D%0ATo help verify ownership, I can provide evidence (photos, unique identifiers/serial numbers, distinguishing marks, or the last known location). Please let me know what proof you require and how to proceed.%0D%0A%0D%0AThank you.`;
  return `mailto:${email}?subject=${subject}&body=${body}`;
}

function ReportCard({ report }: { report: Report }) {
  const imgSrc = computeReportImage(report);
  const location = formatLocation(report.city, report.state_id);
  const when = formatLossDate(report);

  const cardInner = (
    <div className="flex gap-4 p-4 bg-white rounded-xl shadow-sm border border-gray-200 group-hover:shadow-md transition">
      <div className="relative w-24 h-24 shrink-0 rounded-lg overflow-hidden bg-gray-100">
        <Image src={imgSrc} alt={report.title} fill className="object-cover" />
      </div>
      <div className="flex-1">
        <h3 className="font-semibold text-gray-900 leading-snug">{report.title}</h3>
        <div className="mt-2 flex flex-wrap items-center gap-2 text-sm text-gray-600">
          <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium ${report.status === "found" ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-700"}`}>
            {report.status === "found" ? "Found" : "Lost"}
          </span>
          {location !== "—" && (
            <span className="inline-flex items-center gap-1 text-gray-500">
              <span aria-hidden>📍</span>{location}
            </span>
          )}
          {/* ⤵️ Retour à la ligne systématique avant la date */}
          {when !== "—" && <span className="basis-full" aria-hidden></span>}
          {when !== "—" && (
            <span className="inline-flex items-center gap-1 text-gray-500">
              <span aria-hidden>🗓️</span>{when}
            </span>
          )}
        </div>
      </div>
    </div>
  );

  // 🔗 lien mailto (réel) plutôt qu’une 404 ou un alert
  return (
    <a href={mailtoHref(report)} className="block group" title="Contact by email">
      {cardInner}
    </a>
  );
}
