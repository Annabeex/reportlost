import type { Metadata } from "next";
import Link from "next/link";
import ReportForm from "@/components/ReportForm";
import { createClient } from "@supabase/supabase-js";

// --- CONFIGURATION SUPABASE ---
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
const SUPABASE_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "NYU Lost & Found: The Unofficial Student Guide",
  description: "Lost something at New York University? Find locations for Bobst & Campus Safety, pickup hours, and search lost & found items.",
  alternates: {
    canonical: "https://reportlost.org/universities/ny/nyu-lost-and-found",
  },
  openGraph: {
    title: "NYU Lost & Found Survival Guide",
    description: "Locations, hours, and the community tool for items refused by Campus Safety.",
    url: "https://reportlost.org/universities/ny/nyu-lost-and-found",
    siteName: "ReportLost.org",
    type: "article",
    images: [
      {
        url: "/images/universities/nyu-guide-og.jpg",
        width: 1200,
        height: 630,
        alt: "NYU Lost and Found Guide",
      },
    ],
  },
};

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  "mainEntity": [
    {
      "@type": "Question",
      "name": "Where is the main NYU Lost and Found office?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "The central Department of Public Safety Lost & Found is located at 7 Washington Place (for the Washington Square campus). For the Brooklyn campus, it is located at 370 Jay Street."
      }
    },
    {
      "@type": "Question",
      "name": "What happens if I lost my NYU ID card?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "Lost ID cards found on campus are sent to the NYU Card Center at 7 Washington Place. You can contact them at 212-443-CARD. If it hasn't been found, a replacement fee (typically $25) applies."
      }
    },
    {
      "@type": "Question",
      "name": "Does NYU security keep lost water bottles or clothes?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "No. Official policy states that sanitary items (water bottles, food containers) and clothing (jackets, scarves, gym gear) are not kept in the central inventory. They are often discarded or donated. We recommend posting these items on ReportLost.org."
      }
    },
    {
      "@type": "Question",
      "name": "I lost something in the Bobst Library, where do I go?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "Items found in Bobst Library are usually held at the main security desk in the lobby for a short period before being transferred to the central repository at 7 Washington Place."
      }
    },
    {
      "@type": "Question",
      "name": "How long does NYU keep lost items?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "Valuable items are held for 30 days. After this period, they are removed from inventory and either auctioned, donated to charity, or discarded."
      }
    },
    {
      "@type": "Question",
      "name": "Who do I contact for items lost on an NYU Shuttle?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "For items lost on university transportation, contact the Department of Public Safety immediately at 212-998-1305. Drivers often turn items in at the end of their shift."
      }
    }
  ]
};

// --- HELPER: Construction du filtre Supabase pour NYC ---
const NYC_FILTER = "city.ilike.%New York%,city.ilike.%Manhattan%,city.ilike.%Brooklyn%,city.ilike.%Queens%,city.ilike.%Bronx%";

export default async function NyuLostFoundPage() {
  const currentYear = new Date().getFullYear();

  // 1. Récupération des OBJETS PERDUS (Lost)
  let lostData: any[] = [];
  try {
    const { data } = await supabase
      .from("lost_items")
      .select("id, title, date, city, category, image_url, created_at")
      .or(NYC_FILTER)
      .order("created_at", { ascending: false })
      .limit(20); // Limite augmentée pour avoir de l'historique
    if (data) lostData = data;
  } catch (e) {
    console.error("Error fetching lost items:", e);
  }

  // 2. Récupération des OBJETS TROUVÉS (Found)
  let foundData: any[] = [];
  try {
    const { data } = await supabase
      .from("found_items")
      .select("id, title, date, city, image_url, created_at")
      .or(NYC_FILTER)
      .order("created_at", { ascending: false })
      .limit(20);
    if (data) foundData = data;
  } catch (e) {
    console.error("Error fetching found items:", e);
  }

  // 3. Fusion et Tri des listes
  const allItems = [
    ...lostData.map((i) => ({ ...i, type: "lost" })),
    ...foundData.map((i) => ({ ...i, type: "found" })),
  ]
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    .slice(0, 12); // On affiche les 12 plus pertinents

  return (
    <main className="min-h-screen bg-[#f9fafb]">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      {/* --- HERO SECTION --- */}
      <div className="bg-[#57068c] text-white pt-12 pb-24 px-4 relative overflow-hidden">
        <div
          className="absolute top-0 left-0 w-full h-full opacity-10 pointer-events-none"
          style={{
            backgroundImage: "radial-gradient(circle, #ffffff 1px, transparent 1px)",
            backgroundSize: "30px 30px",
          }}
        ></div>
        <div className="max-w-4xl mx-auto text-center relative z-10">
          <div className="inline-block px-3 py-1 mb-6 border border-white/30 rounded-full text-xs font-bold uppercase tracking-wider bg-white/10 backdrop-blur-sm">
            Unofficial Student Resource
          </div>
          <h1 className="text-3xl md:text-5xl font-extrabold mb-6 tracking-tight">
            NYU Lost & Found <br className="hidden sm:block" />
            <span className="text-[#cba4ff]">Survival Guide</span>
          </h1>
          <p className="text-lg md:text-xl text-white/90 max-w-2xl mx-auto leading-relaxed">
            Where to go, pickup hours, and the community solution for items
            <strong> rejected by Campus Safety</strong>.
          </p>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 -mt-16 relative z-20 pb-20">
        
        {/* --- SECTION 1: MAP --- */}
        <div className="bg-white rounded-2xl shadow-xl border border-gray-200 overflow-hidden mb-10">
          <div className="bg-gray-50 px-6 py-4 border-b border-gray-200 flex items-center gap-3">
            <span className="text-2xl">🏛️</span>
            <h2 className="text-xl font-bold text-gray-800">Official Campus Safety Locations</h2>
          </div>
          <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-8 divide-y md:divide-y-0 md:divide-x divide-gray-100">
            <div className="pt-2 md:pt-0">
              <h3 className="text-lg font-bold text-[#57068c] mb-1">Washington Square</h3>
              <p className="font-semibold text-gray-900 text-lg mb-1">7 Washington Place</p>
              <a href="tel:2129981305" className="text-blue-600 hover:underline text-sm font-medium">
                📞 (212) 998-1305
              </a>
              <p className="text-xs text-gray-500 mb-4">Weekdays 8 a.m. – 4 p.m.</p>
            </div>
            <div className="pt-6 md:pt-0 md:pl-8">
              <h3 className="text-lg font-bold text-[#57068c] mb-1">Brooklyn Campus</h3>
              <p className="font-semibold text-gray-900 text-lg mb-1">370 Jay Street</p>
              <p className="text-sm text-gray-500 mb-4">Pickup by appointment only</p>
            </div>
          </div>
        </div>

        {/* --- SECTION 2: THE PROBLEM (Rejected Items) --- */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-10">
          <div className="lg:col-span-2 bg-white rounded-2xl shadow-sm border border-red-100 p-6 md:p-8 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-24 h-24 bg-red-50 rounded-bl-full -mr-10 -mt-10"></div>
            <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2 relative z-10">
              <span className="flex items-center justify-center w-8 h-8 bg-red-100 text-red-600 rounded-full text-sm">✕</span>
              Items NOT Accepted by Security
            </h2>
            <p className="text-gray-700 mb-6 leading-relaxed">
              Did you know? NYU Campus Safety <strong className="text-gray-900">does not keep</strong> low-value or hygienic items. They are often discarded immediately. Do not go to 7 Washington Place for these:
            </p>
            <div className="flex flex-wrap gap-3 mb-6">
              {[
                "Clothing (Coats, Scarves)",
                "Water Bottles / Flasks",
                "Umbrellas",
                "Food containers",
                "Gym Gear",
                "Small Sports Items",
              ].map((item) => (
                <span
                  key={item}
                  className="px-3 py-1.5 bg-red-50 text-red-800 border border-red-100 rounded-md text-sm font-semibold"
                >
                  {item}
                </span>
              ))}
            </div>
            <div className="flex items-center gap-4 bg-gray-50 p-4 rounded-lg border border-gray-200">
              <div className="text-2xl">👇</div>
              <div>
                <p className="font-bold text-gray-900 text-sm">What should I do?</p>
                <p className="text-sm text-gray-600">
                  Don't give up. Post a community alert below. Other students might have found it.
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 flex flex-col justify-center">
            <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center text-2xl mb-4">📍</div>
            <h3 className="font-bold text-gray-900 text-lg mb-2">Lost Off-Campus?</h3>
            <p className="text-sm text-gray-600 mb-6 leading-relaxed">
              The University cannot help with items lost in public spaces.
            </p>
            <ul className="space-y-3 text-sm text-gray-700 mb-6">
              <li className="flex gap-2">
                <span>🌳</span> <span><strong>Washington Sq Park:</strong> NYPD 6th Precinct</span>
              </li>
              <li className="flex gap-2">
                <span>🚇</span> <span><strong>Subway / Bus:</strong> MTA Lost & Found</span>
              </li>
            </ul>
            <p className="text-xs font-semibold text-green-700 bg-green-50 p-2 rounded text-center">
              ReportLost covers all these locations.
            </p>
          </div>
        </div>

        {/* --- SECTION 2.5: THE "CROSSROADS" --- */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-10">
          {/* Green Card (Found) */}
          <div
            className="rounded-2xl shadow-lg p-6 text-white flex flex-col justify-between relative overflow-hidden group"
            style={{ background: "linear-gradient(135deg, #26723e 0%, #2ea052 100%)" }}
          >
            <div className="absolute right-0 top-0 opacity-10 transform translate-x-4 -translate-y-4">
              <svg width="120" height="120" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 15h-2v-6h2v6zm0-8h-2V7h2v2z" />
              </svg>
            </div>
            <div className="relative z-10">
              <h3 className="text-2xl font-bold mb-2 flex items-center gap-2">
                I found an item <span className="text-2xl">😇</span>
              </h3>
              <p className="text-green-50 mb-6 font-medium">
                Did you find a phone, keys, or a jacket on campus? Help a fellow student get it back quickly.
              </p>
            </div>
            <Link
              href="/report?tab=found"
              className="relative z-10 inline-block text-center bg-white text-[#1f6b3a] font-bold py-3 px-6 rounded-lg hover:bg-green-50 transition shadow-md"
            >
              Report a Found Item
            </Link>
          </div>

          {/* White Card (Lost) */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 flex flex-col justify-center text-center md:text-left">
            <h3 className="text-xl font-bold text-gray-800 mb-2">I lost an item 😢</h3>
            <p className="text-gray-600 mb-4">
              If Security doesn't have it, post a community alert below so other students can contact you directly.
            </p>
            <a
              href="#report-form"
              className="text-[#26723e] font-semibold hover:underline flex items-center justify-center md:justify-start gap-2"
            >
              Scroll to form ↓
            </a>
          </div>
        </div>

        {/* --- SECTION 3: THE FORM --- */}
        <div id="report-form" className="scroll-mt-6 mb-16">
          <div className="bg-white rounded-2xl shadow-xl border border-gray-200 overflow-hidden">
            <div className="bg-gradient-to-r from-gray-900 to-gray-800 text-white px-6 py-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div>
                <h2 className="text-xl sm:text-2xl font-bold flex items-center gap-2">
                  📢 Post a Student Alert
                </h2>
                <p className="text-gray-300 text-sm mt-1">
                  Maximum visibility among students & staff.
                </p>
              </div>
              <div className="bg-green-500/20 border border-green-500/50 rounded-full px-4 py-1 text-green-300 text-xs font-bold uppercase tracking-wide">
                Free University Access
              </div>
            </div>
            <div className="p-0 sm:p-2 bg-gray-50">
              <ReportForm
                defaultCity="New York, NY"
                universityName="New York University (NYU)"
                initialCategory="clothing"
                forceFreeMode={true}
              />
            </div>
          </div>
        </div>

        {/* --- SECTION 4: ITEMS LIST (MIXTE & LIVE) --- */}
        {allItems.length > 0 ? (
          <div className="mb-20">
            <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-2">
              <span className="text-[#26723e]">🔍</span> Reports in New York / NYU
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {allItems.map((item) => (
                <Link
                  key={`${item.type}-${item.id}`}
                  href={`/lost-item/${item.id}`}
                  className="block bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow group relative"
                >
                  {/* Badge Type */}
                  <div
                    className={`absolute top-2 left-2 z-10 px-2 py-1 text-[10px] font-bold uppercase tracking-wider rounded text-white ${
                      item.type === "found" ? "bg-[#26723e]" : "bg-red-500"
                    }`}
                  >
                    {item.type === "found" ? "Found" : "Lost"}
                  </div>

                  <div className="h-40 bg-gray-100 flex items-center justify-center relative overflow-hidden">
                    {item.image_url ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={item.image_url}
                        alt={item.title || "Item"}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    ) : (
                      <span className="text-4xl opacity-30">
                        {item.type === "found" ? "🎁" : "📦"}
                      </span>
                    )}
                    <div className="absolute bottom-2 right-2 bg-black/60 text-white text-[10px] px-2 py-1 rounded backdrop-blur-sm">
                      {item.city?.split(",")[0]}
                    </div>
                  </div>
                  <div className="p-4">
                    <h3 className="font-bold text-gray-800 truncate mb-1 text-sm">
                      {item.title || "Unnamed item"}
                    </h3>
                    <p className="text-xs text-gray-500 mb-2">
                      {new Date(item.created_at).toLocaleDateString()}
                    </p>
                    <span className="text-xs text-blue-600 font-bold group-hover:underline">
                      See details →
                    </span>
                  </div>
                </Link>
              ))}
            </div>
            <div className="text-center mt-8">
              <Link
                href="/lost-and-found/ny/new-york"
                className="inline-block px-6 py-2 border border-gray-300 rounded-full text-gray-600 hover:bg-gray-50 font-medium text-sm"
              >
                View full list
              </Link>
            </div>
          </div>
        ) : (
          <div className="mb-20 text-center py-10 bg-gray-50 rounded-xl border border-dashed border-gray-300">
            <p className="text-gray-500">No reports found matching NYU.</p>
            <p className="text-xs text-gray-400 mt-1">
              (Be the first to report something!)
            </p>
          </div>
        )}

        {/* --- FAQ SEO SECTION (Vertical Linear Layout) --- */}
        <div className="mt-20 max-w-3xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Complete Lost & Found FAQ</h2>
            <p className="text-gray-600">
              Everything you need to know about recovering items at NYU.
            </p>
          </div>

          <div className="space-y-12"> {/* ✅ Layout Vertical : Sections l'une après l'autre */}
            
            {/* 1. Essentials */}
            <div className="border-b border-gray-200 pb-10 last:border-0">
              <h3 className="flex items-center gap-3 text-xl font-bold text-[#57068c] uppercase tracking-wide mb-6">
                <span className="text-2xl">🆔</span> ID Cards & Keys
              </h3>
              <div className="space-y-6">
                <article>
                  <h4 className="font-bold text-gray-900 mb-2 text-lg">I lost my NYU ID Card. What now?</h4>
                  <p className="text-gray-600 leading-relaxed">
                    This is the most common loss. If found, ID cards are almost always routed to the{" "}
                    <strong>NYU Card Center</strong> (7 Washington Place).
                    <br />
                    Call 212-443-CARD to check if it's there. A replacement fee (usually around $25) will apply if you need a new one printed.
                  </p>
                </article>
                <article>
                  <h4 className="font-bold text-gray-900 mb-2 text-lg">I lost my dorm keys / room key.</h4>
                  <p className="text-gray-600 leading-relaxed">
                    For residence hall keys, contact your <strong>Residence Hall Resource Center</strong>{" "}
                    immediately. For safety reasons, if a key is not found quickly, the lock core may need
                    to be changed.
                  </p>
                </article>
              </div>
            </div>

            {/* 2. Tech */}
            <div className="border-b border-gray-200 pb-10 last:border-0">
              <h3 className="flex items-center gap-3 text-xl font-bold text-[#57068c] uppercase tracking-wide mb-6">
                <span className="text-2xl">💻</span> Laptops & Electronics
              </h3>
              <div className="space-y-6">
                <article>
                  <h4 className="font-bold text-gray-900 mb-2 text-lg">Are laptops tracked?</h4>
                  <p className="text-gray-600 leading-relaxed">
                    If you registered your device with NYU Public Safety (Operation ID), recovery is much faster.
                    If not, you must provide the <strong>Serial Number</strong> to the lost and found office.
                    They will not release an electronic device without proof of ownership.
                  </p>
                </article>
                <article>
                  <h4 className="font-bold text-gray-900 mb-2 text-lg">I left my charger in a classroom.</h4>
                  <p className="text-gray-600 leading-relaxed">
                    Chargers are often considered "low value". Check the <strong>podium/desk of the classroom</strong> first, then the
                    building's specific security guard desk before calling the main number.
                  </p>
                </article>
              </div>
            </div>

            {/* 3. Locations */}
            <div className="border-b border-gray-200 pb-10 last:border-0">
              <h3 className="flex items-center gap-3 text-xl font-bold text-[#57068c] uppercase tracking-wide mb-6">
                <span className="text-2xl">📍</span> Specific Locations
              </h3>
              <div className="space-y-6">
                <article>
                  <h4 className="font-bold text-gray-900 mb-2 text-lg">Bobst Library</h4>
                  <p className="text-gray-600 leading-relaxed">
                    Items found on the floors of Bobst are typically brought down to the{" "}
                    <strong>Lobby Security Desk</strong>. If valuable, they move to 7 Washington Place within 48h.
                  </p>
                </article>
                <article>
                  <h4 className="font-bold text-gray-900 mb-2 text-lg">Palladium & 404 Fitness</h4>
                  <p className="text-gray-600 leading-relaxed">
                    Gyms have their own internal bins for clothing/bottles. Ask the front desk. Valuable items are secured in the manager's office.
                  </p>
                </article>
              </div>
            </div>

            {/* 4. Rejected */}
            <div>
              <h3 className="flex items-center gap-3 text-xl font-bold text-red-700 uppercase tracking-wide mb-6">
                <span className="text-2xl">⚠️</span> Items often discarded
              </h3>
              <div className="bg-red-50 p-6 rounded-xl border border-red-100">
                <h4 className="font-bold text-red-900 mb-3 text-lg">Why didn't they take my water bottle?</h4>
                <p className="text-red-800 leading-relaxed mb-4">
                  Due to hygiene and storage space, NYU (like most universities) does not inventory:
                </p>
                <ul className="list-disc list-inside text-red-800 space-y-2 mb-6 ml-2">
                  <li>Water bottles & Mugs (Hydroflask, Yeti, etc.)</li>
                  <li>Tupperware / Food containers</li>
                  <li>Loose clothing (Jackets, scarves, hats)</li>
                  <li>Umbrellas</li>
                </ul>
                <p className="font-semibold text-red-900">
                  This is exactly why ReportLost exists. Post these items here so students can find each
                  other directly.
                </p>
              </div>
            </div>

          </div>
        </div>

        {/* --- FOOTER DISCLAIMER --- */}
        <div className="text-center text-gray-400 text-xs mt-24 mb-8 max-w-2xl mx-auto leading-normal px-4">
          <p className="mb-2">ReportLost.org is a community-run initiative aimed at helping students.</p>
          <p>
            We are <strong>not affiliated</strong> with New York University or the Department of Public Safety. The
            "Official Locations" information is provided for convenience based on public data.
          </p>
          <p className="mt-4">© {currentYear} ReportLost.org</p>
        </div>
      </div>
    </main>
  );
}