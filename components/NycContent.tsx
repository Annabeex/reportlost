// components/NycContent.tsx
// Contenu enrichi, spécifique à New York City.
// Rendu uniquement quand la ville est "New York, NY" (voir page.tsx).
// Server component (pas de "use client") — compatible SSR/SEO.

import Image from "next/image";
import Link from "next/link";

// --- Liens externes officiels (vérifiés) ---
const L = {
  mta: "https://www.mta.info/lost-and-found",
  mtaClaim: "https://lostandfound.mta.info/",
  nypd: "https://www.nyc.gov/site/nypd/services/vehicles-property/property-clerk.page",
  taxi311: "https://portal.311.nyc.gov/article/?kanumber=KA-01045",
  tlc: "https://www.nyc.gov/site/tlc/passengers/report-lost-property.page",
  panynj: "https://www.panynj.gov/port-authority/en/help-center/lost-and-found.html",
  tsa: "https://www.tsa.gov/contact-center/travelers",
  acc: "https://www.nycacc.org/services/lost-and-found/",
  petcolove: "https://lost.petcolove.org/",
  nyc311: "https://portal.311.nyc.gov/",
};

const ext =
  "text-blue-600 font-medium hover:underline";

// Quartiers / arrondissements → maillage interne
const boroughs: { name: string; slug: string; blurb: string }[] = [
  {
    name: "Manhattan",
    slug: "new-york",
    blurb:
      "Midtown, Times Square, the Financial District, SoHo, Greenwich Village, the Upper East & West Sides, Harlem and Chelsea. Highest density of taxis, subway lines and tourist sites — and the most lost phones and wallets.",
  },
  {
    name: "Brooklyn",
    slug: "brooklyn",
    blurb:
      "Williamsburg, DUMBO, Park Slope, Bushwick and Downtown Brooklyn. Busy nightlife and transit hubs like Atlantic Terminal mean plenty of items left on trains and in bars.",
  },
  {
    name: "Queens",
    slug: "queens",
    blurb:
      "Astoria, Long Island City, Flushing and Jamaica — plus both JFK and LaGuardia airports, so a large share of luggage and travel-document losses happen here.",
  },
  {
    name: "The Bronx",
    slug: "bronx",
    blurb:
      "Yankee Stadium, the Bronx Zoo, Fordham and the Grand Concourse. Event days and the 4/B/D lines are common spots for misplaced belongings.",
  },
  {
    name: "Staten Island",
    slug: "staten-island",
    blurb:
      "The Staten Island Ferry and the SIR railway. Items lost on the ferry or railway go through the MTA / Staten Island Railway lost & found.",
  },
];

const nearby: { label: string; href: string }[] = [
  { label: "Brooklyn", href: "/lost-and-found/ny/brooklyn" },
  { label: "Queens", href: "/lost-and-found/ny/queens" },
  { label: "The Bronx", href: "/lost-and-found/ny/bronx" },
  { label: "Staten Island", href: "/lost-and-found/ny/staten-island" },
  { label: "Yonkers, NY", href: "/lost-and-found/ny/yonkers" },
  { label: "Jersey City, NJ", href: "/lost-and-found/nj/jersey-city" },
  { label: "Newark, NJ", href: "/lost-and-found/nj/newark" },
  { label: "Hoboken, NJ", href: "/lost-and-found/nj/hoboken" },
];

// --- FAQ (affichée + JSON-LD pour les rich results Google) ---
const faq: { q: string; a: string }[] = [
  {
    q: "How do I report something lost on the NYC subway?",
    a: "Tell the nearest station booth agent, then file a claim with NYC Transit Lost & Found online at lostandfound.mta.info or by calling 511. Items are held for at least three months.",
  },
  {
    q: "I left something in a New York taxi — what now?",
    a: "Call 311 with the medallion number from your receipt. If you paid by card, your bank statement often shows the medallion number. For Uber or Lyft, use the in-app 'I lost an item' flow to contact the driver.",
  },
  {
    q: "How long does the NYPD hold found property?",
    a: "It depends on the value, but for non-evidence property you should claim it within 120 days of it being vouchered by the Property Clerk, or it may be disposed of.",
  },
  {
    q: "My pet is lost in New York City — where do I start?",
    a: "File a lost-pet report with Animal Care Centers of NYC (ACC), search their found database daily, and use the linked Petco Love Lost facial-recognition search. Make sure your microchip contact details are up to date.",
  },
  {
    q: "Is ReportLost.org official or does it replace the police?",
    a: "No. ReportLost.org is an independent service. We provide information about relevant official channels and offer optional team-assisted outreach. Official lost-and-found offices retain and release found property.",
  },
];

export function NycTitleSection() {
  return (
    <section className="text-center py-12 px-6 bg-gradient-to-r from-blue-50 to-white rounded-xl shadow border border-gray-100">
      <span className="inline-block px-3 py-1 mb-4 rounded-full text-xs font-bold uppercase tracking-wider bg-blue-100 text-blue-700">
        New York City, NY · Lost &amp; Found
      </span>
      <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 tracking-tight leading-tight">
        Lost something in New York City? Review your report options.
      </h1>
      <p className="text-base md:text-lg text-gray-600 max-w-2xl mx-auto leading-relaxed mt-4">
        Create a free public listing, add automatic public-web monitoring for $12 (six months), or choose team-assisted
        search for $25 (12 months of monitoring plus relevant local outreach).
      </p>
    </section>
  );
}

export function NycExtraContent({
  cityImage,
  cityImageAlt,
  cityImageCredit,
}: {
  cityImage?: string | null;
  cityImageAlt?: string | null;
  cityImageCredit?: string | null;
}) {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faq.map((f) => ({
      "@type": "Question",
      name: f.q,
      acceptedAnswer: { "@type": "Answer", text: f.a },
    })),
  };

  return (
    <>
      {/* JSON-LD FAQ pour les rich results */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      {/* Comment ça marche — 3 étapes (explique le process) */}
      <section className="bg-white p-6 rounded-xl shadow">
        <h2 className="text-2xl font-bold text-gray-900 text-center">
          How reporting works in New York City
        </h2>
        <div className="grid md:grid-cols-3 gap-6 mt-8">
          <div className="text-center">
            <div className="w-12 h-12 mx-auto bg-blue-100 rounded-full flex items-center justify-center text-2xl">📝</div>
            <h3 className="font-bold mt-3 text-gray-900">1. You report the loss</h3>
            <p className="text-sm text-gray-600 mt-2">
              Describe the item and where you lost it. The more detail, the better the match.
            </p>
          </div>
          <div className="text-center">
            <div className="w-12 h-12 mx-auto bg-blue-100 rounded-full flex items-center justify-center text-2xl">📡</div>
            <h3 className="font-bold mt-3 text-gray-900">2. Choose a report option</h3>
            <p className="text-sm text-gray-600 mt-2">
              The free listing publishes your report. Automatic search costs $12 for six months of public-web monitoring. Team-assisted search costs $25 and includes 12 months of monitoring and relevant local outreach. Some offices require the owner to file directly.
            </p>
          </div>
          <div className="text-center">
            <div className="w-12 h-12 mx-auto bg-green-100 rounded-full flex items-center justify-center text-2xl">🤝</div>
            <h3 className="font-bold mt-3 text-gray-900">3. Search and review possible matches</h3>
            <p className="text-sm text-gray-600 mt-2">
              The paid option includes 12 months of public-web monitoring. Potential matches are reviewed before notification.
            </p>
          </div>
        </div>
        <div className="text-center mt-8">
          <a
            href="#report-form"
            className="inline-block bg-green-600 hover:bg-green-700 text-white font-bold px-8 py-3 rounded-lg shadow-md transition"
          >
            Report my lost item →
          </a>
        </div>
      </section>

      {/* Intro + image */}
      <section className="bg-white p-6 rounded-xl shadow">
        <div className="flex flex-col lg:flex-row gap-8 items-start">
          <div className="lg:w-3/5 w-full text-gray-800 leading-relaxed space-y-4">
            <p>
              New York City has separate lost-property systems for transit, airports, venues and public agencies.
              Use the official links below to identify the channel relevant to where the item was lost. ReportLost
              is independent and offers three report options: a free listing, six-month automatic monitoring for $12,
              and team-assisted search with 12-month monitoring and relevant local outreach for $25.
            </p>
            <p>
              The right contact depends on where the item was lost. The links and guidance below identify the
              relevant transit, airport, venue and city reporting channels.
            </p>
          </div>
          {cityImage && (
            <div className="lg:w-2/5 w-full">
              <Image
                src={cityImage}
                alt={cityImageAlt || "View of New York City"}
                width={600}
                height={400}
                className="w-full h-[240px] object-cover rounded-lg shadow"
              />
              {cityImageCredit && (
                <p className="text-xs text-gray-500 mt-1 text-center">{cityImageCredit}</p>
              )}
            </div>
          )}
        </div>
      </section>

      {/* Guide : selon où tu as perdu — avec liens réels */}
      <section className="bg-white p-6 rounded-xl shadow">
        <h2 className="text-2xl font-bold text-gray-900 text-center">
          Lost-and-found contacts by location type
        </h2>
        <p className="text-gray-600 mt-2 text-sm text-center max-w-3xl mx-auto">
          New York has separate lost-and-found systems for transit, airports, agencies and venues. The links below list
          contact details for common situations.
        </p>

        <div className="grid md:grid-cols-2 gap-5 mt-8">
          <div className="border border-gray-200 rounded-xl p-5">
            <div className="w-11 h-11 bg-blue-100 rounded-full flex items-center justify-center text-xl mb-3">🚇</div>
            <h3 className="font-bold text-lg text-gray-900">Subway, bus or Staten Island Railway (MTA)</h3>
            <p className="text-sm text-gray-600 mt-2 leading-relaxed">
              Tell the nearest station booth agent, or file a claim with NYC Transit Lost &amp; Found. Items are
              held at least 3 months; the central office is by appointment only, after they contact you.
            </p>
            <p className="mt-3 text-sm">
              <a href={L.mtaClaim} target="_blank" rel="noopener noreferrer" className={ext}>File an MTA claim →</a>
              <span className="mx-2 text-gray-300">|</span>
              <a href={L.mta} target="_blank" rel="noopener noreferrer" className={ext}>How it works</a>
            </p>
          </div>

          <div className="border border-gray-200 rounded-xl p-5">
            <div className="w-11 h-11 bg-yellow-100 rounded-full flex items-center justify-center text-xl mb-3">🚕</div>
            <h3 className="font-bold text-lg text-gray-900">Yellow/green cab, Uber or Lyft</h3>
            <p className="text-sm text-gray-600 mt-2 leading-relaxed">
              For taxis, report to 311 with the medallion number from your receipt. No receipt? A card statement
              often shows it (e.g. “NYCTAXI AB123”). For Uber/Lyft, use the in-app lost-item flow.
            </p>
            <p className="mt-3 text-sm">
              <a href={L.taxi311} target="_blank" rel="noopener noreferrer" className={ext}>Report a taxi loss (311) →</a>
              <span className="mx-2 text-gray-300">|</span>
              <a href={L.tlc} target="_blank" rel="noopener noreferrer" className={ext}>TLC lost property</a>
            </p>
          </div>

          <div className="border border-gray-200 rounded-xl p-5">
            <div className="w-11 h-11 bg-indigo-100 rounded-full flex items-center justify-center text-xl mb-3">👮</div>
            <h3 className="font-bold text-lg text-gray-900">Handed to the police (NYPD Property Clerk)</h3>
            <p className="text-sm text-gray-600 mt-2 leading-relaxed">
              Found valuables are often vouchered by the NYPD Property Clerk in the borough where they were turned
              in. Bring ID. <strong>Important:</strong> for non-evidence property, claim it within 120 days or it
              may be disposed of.
            </p>
            <p className="mt-3 text-sm">
              <a href={L.nypd} target="_blank" rel="noopener noreferrer" className={ext}>NYPD Property Clerk →</a>
            </p>
          </div>

          <div className="border border-gray-200 rounded-xl p-5">
            <div className="w-11 h-11 bg-sky-100 rounded-full flex items-center justify-center text-xl mb-3">✈️</div>
            <h3 className="font-bold text-lg text-gray-900">JFK, LaGuardia or Newark</h3>
            <p className="text-sm text-gray-600 mt-2 leading-relaxed">
              Lost it at security? Contact TSA for that airport. On the plane or at the gate? Contact your airline.
              Elsewhere in the terminal, the Port Authority lost &amp; found handles it.
            </p>
            <p className="mt-3 text-sm">
              <a href={L.panynj} target="_blank" rel="noopener noreferrer" className={ext}>Port Authority lost &amp; found →</a>
              <span className="mx-2 text-gray-300">|</span>
              <a href={L.tsa} target="_blank" rel="noopener noreferrer" className={ext}>Contact TSA</a>
            </p>
          </div>

          <div className="border border-gray-200 rounded-xl p-5">
            <div className="w-11 h-11 bg-green-100 rounded-full flex items-center justify-center text-xl mb-3">🌳</div>
            <h3 className="font-bold text-lg text-gray-900">Street, park, shop or venue</h3>
            <p className="text-sm text-gray-600 mt-2 leading-relaxed">
              Ask the venue’s front desk or security first (museums, malls, stadiums and hotels keep their own lost
              &amp; found). For items lost on the street, check with the relevant NYPD precinct or NYC311. Local
              community groups are another place to share a public notice.
            </p>
            <p className="mt-3 text-sm">
              <a href={L.nyc311} target="_blank" rel="noopener noreferrer" className={ext}>NYC311 lost &amp; found →</a>
            </p>
          </div>

          <div className="border border-gray-200 rounded-xl p-5">
            <div className="w-11 h-11 bg-rose-100 rounded-full flex items-center justify-center text-xl mb-3">🐾</div>
            <h3 className="font-bold text-lg text-gray-900">Lost pet (dog, cat, other)</h3>
            <p className="text-sm text-gray-600 mt-2 leading-relaxed">
              File a lost-pet report with Animal Care Centers of NYC (ACC) and search their found database daily.
              It links to Petco Love Lost, which uses facial recognition. Any shelter or vet scans for a microchip,
              so keep your details current.
            </p>
            <p className="mt-3 text-sm">
              <a href={L.acc} target="_blank" rel="noopener noreferrer" className={ext}>ACC lost &amp; found →</a>
              <span className="mx-2 text-gray-300">|</span>
              <a href={L.petcolove} target="_blank" rel="noopener noreferrer" className={ext}>Petco Love Lost</a>
            </p>
          </div>
        </div>
      </section>

      {/* CTA milieu de page vers le formulaire */}
      <section className="bg-blue-50 rounded-xl border border-blue-100 p-8 text-center">
        <h2 className="text-2xl font-bold text-gray-900">Create a New York lost-item report</h2>
        <p className="mt-2 text-gray-600">
          Document the item and review the relevant local reporting channels.
        </p>
        <a
          href="#report-form"
          className="mt-5 inline-block bg-green-600 hover:bg-green-700 text-white font-bold px-8 py-3 rounded-lg shadow-md transition"
        >
          Create a report
        </a>
      </section>

      {/* Quartiers / arrondissements — maillage interne */}
      <section className="bg-white p-6 rounded-xl shadow">
        <h2 className="text-2xl font-bold text-gray-900">Lost something in a specific NYC neighborhood?</h2>
        <p className="text-gray-600 mt-2 text-sm max-w-3xl">
          New York City spans five boroughs and hundreds of neighborhoods. Pick the area closest to where you lost
          your item — each has its own transit hubs, precincts and hotspots.
        </p>
        <div className="mt-6 space-y-4">
          {boroughs.map((b) => (
            <div key={b.slug} className="border-l-4 border-blue-500 pl-4">
              <h3 className="font-semibold text-gray-900">
                <Link href={`/lost-and-found/ny/${b.slug}`} className="text-blue-700 hover:underline">
                  {b.name}
                </Link>
              </h3>
              <p className="text-sm text-gray-600 mt-1">{b.blurb}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Réseaux sociaux */}
      <section className="bg-white p-6 rounded-xl shadow">
        <h2 className="text-2xl font-bold text-gray-900">New York community channels</h2>
        <p className="text-gray-600 mt-2 text-sm max-w-3xl">
          Local social channels provide another way to share a report. Examples of NYC community channels:
        </p>
        <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-4 mt-5 text-sm">
          {[
            ["Facebook groups", "“NYC Lost & Found”, borough & neighborhood groups"],
            ["Reddit", "r/nyc, r/AskNYC, borough subreddits"],
            ["Nextdoor", "Your exact neighborhood — great for pets"],
            ["X / Twitter", "Tag the subway line, station or venue"],
            ["Instagram", "Local lost-pet & community pages"],
            ["Building / campus boards", "Universities, coworking, residential"],
          ].map(([t, d]) => (
            <div key={t} className="border border-gray-200 rounded-xl p-4">
              <strong>{t}</strong>
              <br />
              <span className="text-gray-500">{d}</span>
            </div>
          ))}
        </div>
      </section>

      {/* FAQ */}
      <section className="bg-white p-6 rounded-xl shadow">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">
          New York lost &amp; found — frequently asked questions
        </h2>
        <div className="space-y-3 text-sm">
          {faq.map((f) => (
            <details key={f.q} className="border-b border-gray-100 pb-3">
              <summary className="font-semibold cursor-pointer text-gray-800">{f.q}</summary>
              <p className="text-gray-600 mt-2">{f.a}</p>
            </details>
          ))}
        </div>
      </section>

      {/* Nearby / maillage interne */}
      <section className="bg-white p-6 rounded-xl shadow">
        <h2 className="text-xl font-semibold text-gray-800 mb-4">Lost &amp; found in nearby areas</h2>
        <div className="flex flex-wrap gap-2 text-sm">
          {nearby.map((n) => (
            <Link
              key={n.href}
              href={n.href}
              className="px-3 py-1.5 bg-gray-100 rounded-full text-blue-600 hover:bg-blue-50 font-medium"
            >
              {n.label}
            </Link>
          ))}
        </div>
      </section>

      {/* CTA final vers le formulaire */}
      <section className="text-center py-6">
        <h2 className="text-2xl font-bold text-gray-900">Choose a report option</h2>
        <p className="text-gray-600 mt-2">Free listing, $12 automatic search, or $25 team-assisted search.</p>
        <a
          href="#report-form"
          className="mt-5 inline-block bg-green-600 hover:bg-green-700 text-white font-bold px-8 py-3 rounded-lg shadow-md transition"
        >
          Start my report →
        </a>
      </section>

      {/* Disclaimer (E-E-A-T) */}
      <p className="text-xs text-gray-400 text-center max-w-3xl mx-auto">
        ReportLost.org is an independent service and is not affiliated with the MTA, NYPD, TLC, the Port Authority
        or the City of New York. Official lost-and-found offices retain and release found property.
      </p>
    </>
  );
}
