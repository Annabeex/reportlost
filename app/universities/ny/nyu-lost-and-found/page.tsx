import type { Metadata } from "next";
import ReportForm from "@/components/ReportForm";

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
        url: "/images/universities/nyu-guide-og.jpg", // Assure-toi d'avoir une image ou supprime cette ligne
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
      "name": "Where is the NYU Lost and Found?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "The main repository is at 7 Washington Place for the Washington Square campus, and 370 Jay Street for the Brooklyn campus."
      }
    },
    {
      "@type": "Question",
      "name": "Does NYU security keep lost water bottles or clothes?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "No. According to official policy, Campus Safety does not accept clothing, water bottles, umbrellas, or perishable food. Use ReportLost.org to signal these items."
      }
    }
  ]
};

export default function NyuLostFoundPage() {
  const currentYear = new Date().getFullYear();

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
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-12">
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

        {/* --- SECTION 3: THE FORM (Embedded & Free) --- */}
        <div id="report-form" className="scroll-mt-6">
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
            
            {/* FORM CONFIGURATION:
               - defaultCity: "New York, NY" (pour sauver en base)
               - universityName: "New York University (NYU)" (Active l'affichage spécial)
               - forceFreeMode: true (Saute le paiement)
            */}
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

        {/* --- FAQ SEO SECTION --- */}
        <div className="mt-16 max-w-3xl mx-auto space-y-8">
            <h2 className="text-2xl font-bold text-gray-900 text-center">Frequently Asked Questions</h2>
            <div className="space-y-4">
                <div className="bg-white p-5 rounded-lg border border-gray-200 shadow-sm">
                    <h3 className="font-bold text-gray-800 mb-2">Where do lost items go at Bobst Library?</h3>
                    <p className="text-gray-600 text-sm">
                        Items found within Bobst Library are typically turned in to the Lost & Found desk located on the <strong>Main Floor (Lobby)</strong> security desk. Valuable items are transferred to the central Department of Public Safety (7 Washington Place) after a short period.
                    </p>
                </div>
                <div className="bg-white p-5 rounded-lg border border-gray-200 shadow-sm">
                    <h3 className="font-bold text-gray-800 mb-2">How do I find a lost NYU ID card?</h3>
                    <p className="text-gray-600 text-sm">
                        Lost ID cards are almost always sent to the NYU Card Center (7 Washington Place). You can check if yours has been turned in by calling 212-443-CARD. If not, you will need to pay a replacement fee.
                    </p>
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