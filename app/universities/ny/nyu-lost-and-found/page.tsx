import type { Metadata } from "next";
import Link from "next/link";
import ReportForm from "@/components/ReportForm";
import { createClient } from "@supabase/supabase-js"; // ✅ Nécessaire pour l'affichage des items

// --- CONFIGURATION SUPABASE (Serveur) ---
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
const SUPABASE_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

// Force le rendu dynamique pour avoir des objets frais à chaque chargement
export const dynamic = "force-dynamic";

// --- SEO METADATA ---
export const metadata: Metadata = {
  title: "NYU Lost & Found: The Unofficial Student Guide (Washington Sq. & Brooklyn)",
  description: "Lost something at New York University? Find locations for Bobst & Campus Safety, pickup hours, and post lost items (clothing, bottles) not accepted by security.",
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

// --- STRUCTURED DATA (FAQ SCHEMA) ---
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

// --- COMPOSANT PRINCIPAL (Async pour fetcher les données) ---
export default async function NyuLostFoundPage() {
  const currentYear = new Date().getFullYear();

  // ✅ 1. RÉCUPÉRATION DES ITEMS (Server Side)
  // On cherche les objets perdus contenant "New York" dans la ville
  let recentItems: any[] = [];
  try {
    const { data, error } = await supabase
      .from("lost_items")
      .select("id, title, date, city, category, image_url")
      .ilike("city", "%New York%") // Filtre large pour avoir du contenu
      .order("created_at", { ascending: false })
      .limit(6); // On prend les 6 derniers

    if (!error && data) {
      recentItems = data;
    }
  } catch (e) {
    console.error("Error fetching items:", e);
  }

  return (
    <main className="min-h-screen bg-[#f9fafb]">
      {/* Inject JSON-LD */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      {/* --- HERO SECTION --- */}
      <div className="bg-[#57068c] text-white pt-12 pb-24 px-4 relative overflow-hidden">
        {/* Pattern subtil en background */}
        <div className="absolute top-0 left-0 w-full h-full opacity-10 pointer-events-none" 
             style={{ backgroundImage: 'radial-gradient(circle, #ffffff 1px, transparent 1px)', backgroundSize: '30px 30px' }}>
        </div>

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
            <strong> rejected by Campus Safety</strong> (jackets, bottles, etc.).
          </p>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 -mt-16 relative z-20 pb-20">
        
        {/* --- SECTION 1: THE OFFICIAL MAP (Quick Info) --- */}
        <div className="bg-white rounded-2xl shadow-xl border border-gray-200 overflow-hidden mb-10">
          <div className="bg-gray-50 px-6 py-4 border-b border-gray-200 flex items-center gap-3">
            <span className="text-2xl">🏛️</span>
            <h2 className="text-xl font-bold text-gray-800">Official Campus Safety Locations</h2>
          </div>
          
          <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-8 divide-y md:divide-y-0 md:divide-x divide-gray-100">
            {/* Washington Square */}
            <div className="pt-2 md:pt-0">
              <h3 className="text-lg font-bold text-[#57068c] mb-1 flex items-center gap-2">
                Washington Square
                <span className="px-2 py-0.5 bg-gray-100 text-gray-600 text-xs rounded-full font-normal">Main</span>
              </h3>
              <p className="font-semibold text-gray-900 text-lg mb-1">7 Washington Place</p>
              <a href="tel:2129981305" className="text-blue-600 hover:underline text-sm font-medium">
                📞 (212) 998-1305
              </a>
              <p className="text-xs text-gray-500 mb-4">Weekdays 8 a.m. – 4 p.m.</p>
              
              <div className="bg-[#f3f4f6] p-4 rounded-lg text-sm space-y-2 border border-gray-200">
                <p className="font-bold text-gray-700 uppercase text-xs tracking-wide">Pickup Hours</p>
                <div className="grid grid-cols-[80px_1fr] gap-y-1">
                  <span className="text-gray-500 font-medium">Mon:</span> <span className="text-gray-900">12pm – 3pm</span>
                  <span className="text-gray-500 font-medium">Tue-Thu:</span> <span className="text-gray-900">11am – 2pm</span>
                  <span className="text-gray-500 font-medium">Fri:</span> <span className="text-gray-900">10am – 3pm</span>
                </div>
              </div>
            </div>

            {/* Brooklyn */}
            <div className="pt-6 md:pt-0 md:pl-8">
              <h3 className="text-lg font-bold text-[#57068c] mb-1">Brooklyn Campus</h3>
              <p className="font-semibold text-gray-900 text-lg mb-1">370 Jay Street</p>
              <p className="text-sm text-gray-500 mb-4">Pickup by appointment only</p>
              
              <div className="bg-[#f3f4f6] p-4 rounded-lg text-sm space-y-2 border border-gray-200">
                <p className="font-bold text-gray-700 uppercase text-xs tracking-wide">Pickup Times</p>
                <div className="grid grid-cols-[80px_1fr] gap-y-1">
                  <span className="text-gray-500 font-medium">Mon:</span> <span className="text-gray-900">12pm – 8pm</span>
                  <span className="text-gray-500 font-medium">Tue-Fri:</span> <span className="text-gray-900">8:30am – 3:30pm</span>
                </div>
              </div>
            </div>
          </div>
          
          <div className="bg-blue-50 px-6 py-3 border-t border-blue-100 text-sm text-blue-800 flex gap-3 items-start">
             <span className="text-lg mt-0.5">💡</span>
             <p>
               <strong>Note:</strong> Items are kept for <strong>30 days</strong>. If you lost an item at an <em>NYU Langone Health</em> facility, please call <a href="tel:2122630929" className="underline font-semibold">(212) 263-0929</a>.
             </p>
          </div>
        </div>

        {/* --- SECTION 2: THE PROBLEM (Why use ReportLost) --- */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-10">
          {/* Card: Not Accepted */}
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
               {["Clothing (Coats, Scarves)", "Water Bottles / Flasks", "Umbrellas", "Food containers", "Gym Gear", "Small Sports Items"].map((item) => (
                 <span key={item} className="px-3 py-1.5 bg-red-50 text-red-800 border border-red-100 rounded-md text-sm font-semibold">
                   {item}
                 </span>
               ))}
            </div>
            
            <div className="flex items-center gap-4 bg-gray-50 p-4 rounded-lg border border-gray-200">
               <div className="text-2xl">👇</div>
               <div>
                  <p className="font-bold text-gray-900 text-sm">What should I do?</p>
                  <p className="text-sm text-gray-600">Don't give up. Post a community alert below. Other students might have found it.</p>
               </div>
            </div>
          </div>

          {/* Card: Off Campus */}
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

        {/* --- SECTION 2.5: THE "CROSSROADS" (UX Improvement) --- */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-10">
           {/* OPTION 2 : STYLE SOFT VIOLET (Harmonieux avec NYU) */}
            <div className="bg-white rounded-2xl shadow-sm border-2 border-[#57068c]/20 p-6 flex flex-col justify-between relative overflow-hidden group hover:border-[#57068c]/40 transition-colors">
                
                <div>
                    <h3 className="text-2xl font-bold mb-2 text-[#57068c]">
                        I found an item 😇
                    </h3>
                    <p className="text-gray-600 mb-6">
                        Did you find a phone, keys, or a jacket? Help a fellow student get it back.
                    </p>
                </div>
                
                <Link 
                    href="/report?tab=found" 
                    className="inline-block text-center bg-[#57068c] text-white font-bold py-3 px-6 rounded-lg hover:bg-[#460570] transition shadow-md"
                >
                    Report a Found Item
                </Link>
            </div>

            {/* Carte "J'ai Perdu" (Blanc, orientation) */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 flex flex-col justify-center text-center md:text-left">
                 <h3 className="text-xl font-bold text-gray-800 mb-2">I lost an item 😢</h3>
                 <p className="text-gray-600 mb-4">
                    If Security doesn't have it, post a community alert below so other students can contact you.
                 </p>
                 <a href="#report-form" className="text-green-600 font-semibold hover:underline flex items-center justify-center md:justify-start gap-2">
                    Scroll to form ↓
                 </a>
            </div>
        </div>

        {/* --- SECTION 3: THE FORM (Embedded & Free) --- */}
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

        {/* --- SECTION 4: RECENT ITEMS (AFFICHAGE) --- */}
        {/* ✅ Nouvelle section: Affichage des objets perdus */}
        {recentItems.length > 0 && (
          <div className="mb-16">
            <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-2">
              <span className="text-blue-600">🔍</span> Recently Reported in New York
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
              {recentItems.map((item) => (
                <Link 
                  key={item.id} 
                  href={`/lost-item/${item.id}`} 
                  className="block bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow group"
                >
                  <div className="h-40 bg-gray-100 flex items-center justify-center relative overflow-hidden">
                    {item.image_url ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img 
                        src={item.image_url} 
                        alt={item.title || "Lost item"} 
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    ) : (
                      <span className="text-4xl opacity-30">📦</span>
                    )}
                    <div className="absolute bottom-2 right-2 bg-black/60 text-white text-xs px-2 py-1 rounded">
                      {/* On coupe le nom de la ville si trop long */}
                      {item.city?.split(',')[0]}
                    </div>
                  </div>
                  <div className="p-4">
                    <h3 className="font-bold text-gray-800 truncate mb-1">{item.title || "Unknown item"}</h3>
                    <p className="text-sm text-gray-500 mb-2">
                      {new Date(item.date).toLocaleDateString()} • {item.category || "General"}
                    </p>
                    <span className="text-sm text-blue-600 font-medium group-hover:underline">
                      See details →
                    </span>
                  </div>
                </Link>
              ))}
            </div>
            {/* Bouton Voir tout */}
            <div className="text-center mt-8">
               <Link href="/lost-and-found/ny/new-york" className="inline-block px-6 py-2 border border-gray-300 rounded-full text-gray-600 hover:bg-gray-50 font-medium text-sm">
                 View all New York reports
               </Link>
            </div>
          </div>
        )}

        {/* --- FAQ SEO SECTION --- */}
        <div className="mt-16 max-w-3xl mx-auto space-y-8">
            {/* --- COMPREHENSIVE FAQ SECTION --- */}
        <div className="mt-20 max-w-4xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold text-gray-900 mb-4">Complete Lost & Found FAQ</h2>
              <p className="text-gray-600">Everything you need to know about recovering items at NYU, categorized for speed.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                
                {/* COLUMN 1 */}
                <div className="space-y-8">
                    {/* Category: Essentials */}
                    <div>
                        <h3 className="text-lg font-bold text-[#57068c] uppercase tracking-wide mb-4 border-b border-gray-200 pb-2">
                            🆔 ID Cards & Keys
                        </h3>
                        <div className="space-y-6">
                            <div>
                                <h4 className="font-bold text-gray-900 mb-2">I lost my NYU ID Card. What now?</h4>
                                <p className="text-sm text-gray-600 leading-relaxed">
                                    This is the most common loss. If found, ID cards are almost always routed to the <strong>NYU Card Center</strong> (7 Washington Place).
                                    <br/><br/>
                                    <strong>Step 1:</strong> Call 212-443-CARD to check if it's there.
                                    <br/>
                                    <strong>Step 2:</strong> If not, you can deactivate it online to prevent misuse.
                                    <br/>
                                    <strong>Step 3:</strong> A replacement fee (usually around $25) will apply if you need a new one printed.
                                </p>
                            </div>
                            <div>
                                <h4 className="font-bold text-gray-900 mb-2">I lost my dorm keys / room key.</h4>
                                <p className="text-sm text-gray-600 leading-relaxed">
                                    For residence hall keys, contact your <strong>Residence Hall Resource Center</strong> immediately. For safety reasons, if a key is not found quickly, the lock core may need to be changed, which incurs a significantly higher fee than a simple key replacement.
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Category: Tech */}
                    <div>
                        <h3 className="text-lg font-bold text-[#57068c] uppercase tracking-wide mb-4 border-b border-gray-200 pb-2">
                            💻 Laptops & Electronics
                        </h3>
                        <div className="space-y-6">
                            <div>
                                <h4 className="font-bold text-gray-900 mb-2">Are laptops tracked?</h4>
                                <p className="text-sm text-gray-600 leading-relaxed">
                                    If you registered your device with NYU Public Safety (Operation ID), recovery is much faster. If not, you must provide the <strong>Serial Number</strong> to the lost and found office. They will not release an electronic device without proof of ownership (serial number match or detailed description/login capability).
                                </p>
                            </div>
                            <div>
                                <h4 className="font-bold text-gray-900 mb-2">I left my charger in a classroom.</h4>
                                <p className="text-sm text-gray-600 leading-relaxed">
                                    Chargers are often considered "low value" and might not make it to the central office immediately. Check the <strong>podium/desk of the classroom</strong> first, then the building's specific security guard desk before calling the main number.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* COLUMN 2 */}
                <div className="space-y-8">
                    {/* Category: Locations */}
                    <div>
                        <h3 className="text-lg font-bold text-[#57068c] uppercase tracking-wide mb-4 border-b border-gray-200 pb-2">
                            📍 Specific Locations
                        </h3>
                        <div className="space-y-6">
                            <div>
                                <h4 className="font-bold text-gray-900 mb-2">Bobst Library</h4>
                                <p className="text-sm text-gray-600 leading-relaxed">
                                    Items found on the floors of Bobst are typically brought down to the <strong>Lobby Security Desk</strong>. If they are valuable (wallets, phones), they are moved to 7 Washington Place within 24-48 hours. If it's a book or bottle, it might stay at the desk longer or be discarded.
                                </p>
                            </div>
                            <div>
                                <h4 className="font-bold text-gray-900 mb-2">Palladium & 404 Fitness</h4>
                                <p className="text-sm text-gray-600 leading-relaxed">
                                    Gyms have their own internal lost and found bins for clothing and bottles. Ask the front desk attendant. Valuable items (rings, watches) are usually secured in the manager's office before being sent to Public Safety.
                                </p>
                            </div>
                            <div>
                                <h4 className="font-bold text-gray-900 mb-2">NYU Shuttles / Safe Ride</h4>
                                <p className="text-sm text-gray-600 leading-relaxed">
                                    Drivers check buses at the end of shifts. Items are turned in to Public Safety. Call 212-998-1305. Do not try to flag down another bus to ask; they are on strict schedules.
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Category: The "Rejected" List */}
                    <div>
                        <h3 className="text-lg font-bold text-red-700 uppercase tracking-wide mb-4 border-b border-gray-200 pb-2">
                            ⚠️ Items often discarded
                        </h3>
                        <div className="bg-red-50 p-4 rounded-lg border border-red-100">
                            <h4 className="font-bold text-red-900 mb-2">Why didn't they take my water bottle?</h4>
                            <p className="text-sm text-red-800 leading-relaxed mb-3">
                                Due to hygiene and storage space, NYU (like most universities) does not inventory:
                            </p>
                            <ul className="list-disc list-inside text-sm text-red-800 space-y-1 mb-4">
                                <li>Water bottles & Mugs (Hydroflask, Yeti, etc.)</li>
                                <li>Tupperware / Food containers</li>
                                <li>Loose clothing (Jackets, scarves, hats)</li>
                                <li>Umbrellas</li>
                                <li>Toiletries</li>
                            </ul>
                            <p className="text-sm font-semibold text-red-900">
                                This is exactly why ReportLost exists. Post these items here so students can find each other directly, bypassing the official bin.
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
        </div>

        {/* --- FOOTER DISCLAIMER --- */}
        <div className="text-center text-gray-400 text-xs mt-20 mb-8 max-w-2xl mx-auto leading-normal">
           <p className="mb-2">ReportLost.org is a community-run initiative aimed at helping students.</p>
           <p>We are <strong>not affiliated</strong> with New York University or the Department of Public Safety. The &quot;Official Locations&quot; information is provided for convenience based on public data.</p>
           <p className="mt-4">© {currentYear} ReportLost.org</p>
        </div>

      </div>
    </main>
  );
}