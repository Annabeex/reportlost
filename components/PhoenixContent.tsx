// components/PhoenixContent.tsx
// Contenu enrichi, spécifique à Phoenix (formulation distincte des autres villes
// pour éviter le duplicate content). Rendu quand la ville est "Phoenix, AZ".

import Image from "next/image";
import Link from "next/link";

const L = {
  valleymetro: "https://www.valleymetro.org/lost-found",
  phxpd: "https://www.phoenix.gov/police/resources-information/unclaimed-property",
  skyharbor: "https://www.skyharbor.com/at-the-airport/services/lost-found/",
  maricopa: "https://www.maricopa.gov/162/Lost-Found-Pet",
  petcolove: "https://lost.petcolove.org/",
  azhumane: "https://www.azhumane.org/lost-a-pet/",
};

const ext = "text-blue-600 font-medium hover:underline";

const areas: { name: string; blurb: string }[] = [
  {
    name: "Downtown & the light rail corridor",
    blurb:
      "Sports arenas, ASU Downtown and the Valley Metro Rail line along Central Ave. Central Station is where many recovered transit items end up.",
  },
  {
    name: "Midtown & Uptown",
    blurb:
      "The museums, Park Central and the Camelback corridor. Venues and offices along the rail line keep their own lost & found.",
  },
  {
    name: "Camelback, Arcadia & Biltmore",
    blurb:
      "Resorts, golf and upscale shopping — hotels and clubs almost always log found items at the front desk, so start there.",
  },
  {
    name: "Sky Harbor & the airport area",
    blurb:
      "PHX, the Sky Train and the rental-car center. Items in the terminals or on the Sky Train go through Sky Harbor Lost & Found.",
  },
  {
    name: "North Phoenix, Deer Valley & Ahwatukee",
    blurb:
      "Spread-out residential areas and trailheads. Items lost on a hike are rarely handed in — a public alert is your best shot.",
  },
];

const nearby: { label: string; href: string }[] = [
  { label: "Tempe", href: "/lost-and-found/az/tempe" },
  { label: "Scottsdale", href: "/lost-and-found/az/scottsdale" },
  { label: "Mesa", href: "/lost-and-found/az/mesa" },
  { label: "Glendale", href: "/lost-and-found/az/glendale" },
  { label: "Chandler", href: "/lost-and-found/az/chandler" },
  { label: "Gilbert", href: "/lost-and-found/az/gilbert" },
  { label: "Peoria", href: "/lost-and-found/az/peoria" },
  { label: "Surprise", href: "/lost-and-found/az/surprise" },
];

const faq: { q: string; a: string }[] = [
  {
    q: "Where do I report an item left on Valley Metro rail or a bus?",
    a: "Items found on Valley Metro light rail and buses are handled by the City of Phoenix Public Transit team, usually at the Central Station office (302 N. 1st Ave). Call (602) 534-5053 first to confirm your item is there — some routes are held at a Tempe facility instead.",
  },
  {
    q: "How do I claim property held by the Phoenix Police?",
    a: "Contact the Phoenix Police Property Management Bureau at (602) 261-8371 (100 E. Elwood St). You'll need government ID and proof of ownership. For unclaimed items, you generally have 30 days from the date of publication to make a claim.",
  },
  {
    q: "I lost something at Sky Harbor (PHX).",
    a: "For terminals, the PHX Sky Train, buses or parking, call Sky Harbor Lost & Found at 602-273-3333 or email lostandfound@phoenix.gov. Items are held only about 10 days (keys 30). Checkpoint items go through TSA; anything left on the plane is held by your airline.",
  },
  {
    q: "What about a rideshare or taxi?",
    a: "Uber and Lyft both have an in-app 'I lost an item' option to reach your driver. For a taxi, call the company directly with your trip time and route.",
  },
  {
    q: "My pet is lost in the Phoenix area — what should I do?",
    a: "Report and search on Petco Love Lost, and check Maricopa County Animal Care & Control (602-506-7387; West shelter at 2500 S. 27th Ave). Note the county doesn't impound stray cats, but you can still list them online. The Arizona Humane Society can help; make sure the contact details on your pet's microchip registration are current.",
  },
  {
    q: "Is ReportLost.org an official government service?",
    a: "No. We're an independent service. We provide information about relevant official channels and offer optional team-assisted outreach. Official offices store and release found property.",
  },
];

export function PhoenixTitleSection() {
  return (
    <section className="text-center py-12 px-6 bg-gradient-to-r from-blue-50 to-white rounded-xl shadow border border-gray-100">
      <span className="inline-block px-3 py-1 mb-4 rounded-full text-xs font-bold uppercase tracking-wider bg-blue-100 text-blue-700">
        Phoenix, AZ · Lost &amp; Found
      </span>
      <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 tracking-tight leading-tight">
        Lost and found in Phoenix
      </h1>
      <p className="text-base md:text-lg text-gray-600 max-w-2xl mx-auto leading-relaxed mt-4">
        This guide lists lost-and-found contacts for the <strong>Phoenix Police property bureau</strong>,{" "}
        <strong>Valley Metro, Sky Harbor and rideshare providers</strong>, venues and local services. ReportLost is
        independent; the available report options are shown before submission.
      </p>
    </section>
  );
}

export function PhoenixExtraContent({
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
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      {/* Étapes */}
      <section className="bg-white p-6 rounded-xl shadow">
        <h2 className="text-2xl font-bold text-gray-900 text-center">
          How reporting works in the Valley
        </h2>
        <div className="grid md:grid-cols-3 gap-6 mt-8">
          <div className="text-center">
            <div className="w-12 h-12 mx-auto bg-blue-100 rounded-full flex items-center justify-center text-2xl">📝</div>
            <h3 className="font-bold mt-3 text-gray-900">1. Log what you lost</h3>
            <p className="text-sm text-gray-600 mt-2">
              A short description and the spot it went missing is enough for us to get moving.
            </p>
          </div>
          <div className="text-center">
            <div className="w-12 h-12 mx-auto bg-blue-100 rounded-full flex items-center justify-center text-2xl">📡</div>
            <h3 className="font-bold mt-3 text-gray-900">2. Choose a report option</h3>
            <p className="text-sm text-gray-600 mt-2">
              The free listing publishes your report. The $12 option adds six months of automatic monitoring, a ReportLost certificate, an anonymous case address, and printable QR stickers. The $25 option adds manual research, direct contact with relevant services, report submission, local social sharing, and 12 months of monitoring.
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
              Phoenix has separate lost-property processes for Valley Metro, Sky Harbor, venues and public agencies.
              Use the official links below to identify the channel relevant to where the item was lost. ReportLost
              is independent and offers three report options: a free listing, six-month automatic monitoring for $12,
              and $25 team-assisted search with manual research, direct contact with relevant services, local social sharing, and 12-month monitoring.
            </p>
            <p>
              Holding and collection policies vary by office. Contact the service responsible for the loss location
              to confirm its current process.
            </p>
          </div>
          {cityImage && (
            <div className="lg:w-2/5 w-full">
              <Image
                src={cityImage}
                alt={cityImageAlt || "View of Phoenix"}
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

      {/* Guide par lieu (titre reformulé) */}
      <section className="bg-white p-6 rounded-xl shadow">
        <h2 className="text-2xl font-bold text-gray-900 text-center">
          Pick the right lost &amp; found for your situation
        </h2>
        <p className="text-gray-600 mt-2 text-sm text-center max-w-3xl mx-auto">
          Phoenix&apos;s offices each cover different places. Start with the one below that fits, and you&apos;ll save
          yourself days of calls.
        </p>

        <div className="grid md:grid-cols-2 gap-5 mt-8">
          <div className="border border-gray-200 rounded-xl p-5">
            <div className="w-11 h-11 bg-blue-100 rounded-full flex items-center justify-center text-xl mb-3">🚈</div>
            <h3 className="font-bold text-lg text-gray-900">Valley Metro rail or bus</h3>
            <p className="text-sm text-gray-600 mt-2 leading-relaxed">
              Items are handled by City of Phoenix Public Transit. Call (602) 534-5053 to confirm before you go —
              most are at Central Station (302 N. 1st Ave), though some routes are held in Tempe.
            </p>
            <p className="mt-3 text-sm">
              <a href={L.valleymetro} target="_blank" rel="noopener noreferrer" className={ext}>Valley Metro Lost &amp; Found →</a>
            </p>
          </div>

          <div className="border border-gray-200 rounded-xl p-5">
            <div className="w-11 h-11 bg-yellow-100 rounded-full flex items-center justify-center text-xl mb-3">🚕</div>
            <h3 className="font-bold text-lg text-gray-900">Uber, Lyft or taxi</h3>
            <p className="text-sm text-gray-600 mt-2 leading-relaxed">
              Report the item and message your driver from the Uber or Lyft app. For a taxi, call the company with
              your pickup time and route. These details can help the company identify the relevant trip.
            </p>
          </div>

          <div className="border border-gray-200 rounded-xl p-5">
            <div className="w-11 h-11 bg-indigo-100 rounded-full flex items-center justify-center text-xl mb-3">👮</div>
            <h3 className="font-bold text-lg text-gray-900">Turned in to the police (Phoenix PD)</h3>
            <p className="text-sm text-gray-600 mt-2 leading-relaxed">
              Recovered property is held by the Phoenix Police Property Management Bureau (100 E. Elwood St). Bring
              ID and proof of ownership. For unclaimed items, you usually have <strong>30 days</strong> from
              publication to claim.
            </p>
            <p className="mt-3 text-sm">
              <a href={L.phxpd} target="_blank" rel="noopener noreferrer" className={ext}>Claim police property →</a>
            </p>
          </div>

          <div className="border border-gray-200 rounded-xl p-5">
            <div className="w-11 h-11 bg-sky-100 rounded-full flex items-center justify-center text-xl mb-3">✈️</div>
            <h3 className="font-bold text-lg text-gray-900">Sky Harbor (PHX)</h3>
            <p className="text-sm text-gray-600 mt-2 leading-relaxed">
              For terminals, the PHX Sky Train, buses or parking, contact Sky Harbor Lost &amp; Found. Items are held
              only about 10 days (keys 30). Checkpoint items go through TSA; anything on the plane is held by your
              airline.
            </p>
            <p className="mt-3 text-sm">
              <a href={L.skyharbor} target="_blank" rel="noopener noreferrer" className={ext}>Sky Harbor Lost &amp; Found →</a>
            </p>
          </div>

          <div className="border border-gray-200 rounded-xl p-5">
            <div className="w-11 h-11 bg-green-100 rounded-full flex items-center justify-center text-xl mb-3">🌵</div>
            <h3 className="font-bold text-lg text-gray-900">Street, trail, shop or venue</h3>
            <p className="text-sm text-gray-600 mt-2 leading-relaxed">
              Resorts, malls, stadiums and museums keep their own lost &amp; found, so ask the front desk first. For
              anything lost outdoors or on a trail, a public alert to Valley groups is often what brings it home.
            </p>
          </div>

          <div className="border border-gray-200 rounded-xl p-5">
            <div className="w-11 h-11 bg-rose-100 rounded-full flex items-center justify-center text-xl mb-3">🐾</div>
            <h3 className="font-bold text-lg text-gray-900">Lost pet (dog, cat, other)</h3>
            <p className="text-sm text-gray-600 mt-2 leading-relaxed">
              Report and search on Petco Love Lost, and check Maricopa County Animal Care &amp; Control (602-506-7387).
              Note the county doesn&apos;t impound stray cats, but you can still list them. Alert your microchip company
              and keep your details current.
            </p>
            <p className="mt-3 text-sm">
              <a href={L.maricopa} target="_blank" rel="noopener noreferrer" className={ext}>Maricopa County →</a>
              <span className="mx-2 text-gray-300">|</span>
              <a href={L.petcolove} target="_blank" rel="noopener noreferrer" className={ext}>Petco Love Lost</a>
              <span className="mx-2 text-gray-300">|</span>
              <a href={L.azhumane} target="_blank" rel="noopener noreferrer" className={ext}>AZ Humane</a>
            </p>
          </div>
        </div>
      </section>

      {/* CTA milieu */}
      <section className="bg-white rounded-xl border border-gray-200 p-6">
        <h2 className="text-xl font-semibold text-gray-900">Holding policies vary by office</h2>
        <p className="mt-2 text-gray-600">
          Some Phoenix offices report holding periods of about ten days. Contact the office responsible for the loss location to confirm its current policy.
        </p>
      </section>

      {/* Secteurs de Phoenix */}
      <section className="bg-white p-6 rounded-xl shadow">
        <h2 className="text-2xl font-bold text-gray-900">Which part of Phoenix did you lose it in?</h2>
        <p className="text-gray-600 mt-2 text-sm max-w-3xl">
          The Phoenix area is geographically large. Neighborhood details below can help identify a nearby transit office,
          police unit or venue.
        </p>
        <div className="mt-6 space-y-4">
          {areas.map((a) => (
            <div key={a.name} className="border-l-4 border-blue-500 pl-4">
              <h3 className="font-semibold text-gray-900">{a.name}</h3>
              <p className="text-sm text-gray-600 mt-1">{a.blurb}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Réseaux sociaux */}
      <section className="bg-white p-6 rounded-xl shadow">
        <h2 className="text-2xl font-bold text-gray-900">Phoenix community channels</h2>
        <p className="text-gray-600 mt-2 text-sm max-w-3xl">
          Local social channels provide another way to share a report. Examples of Phoenix-area community channels:
        </p>
        <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-4 mt-5 text-sm">
          {[
            ["Facebook groups", "Neighborhood & “Phoenix Lost & Found” groups"],
            ["Reddit", "r/phoenix, r/askphoenix"],
            ["Nextdoor", "Your neighborhood — great for pets"],
            ["X / Twitter", "Tag the Valley Metro line, station or venue"],
            ["Instagram", "Local lost-pet & community pages"],
            ["Campus & office boards", "ASU, downtown, Sky Harbor area"],
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
        <h2 className="text-2xl font-bold text-gray-900 mb-4">Phoenix lost &amp; found — common questions</h2>
        <div className="space-y-3 text-sm">
          {faq.map((f) => (
            <details key={f.q} className="border-b border-gray-100 pb-3">
              <summary className="font-semibold cursor-pointer text-gray-800">{f.q}</summary>
              <p className="text-gray-600 mt-2">{f.a}</p>
            </details>
          ))}
        </div>
      </section>

      {/* Nearby */}
      <section className="bg-white p-6 rounded-xl shadow">
        <h2 className="text-xl font-semibold text-gray-800 mb-4">Lost &amp; found in nearby cities</h2>
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

      {/* CTA final */}
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

      {/* Disclaimer */}
      <p className="text-xs text-gray-400 text-center max-w-3xl mx-auto">
        ReportLost.org is an independent service and is not affiliated with Valley Metro, the Phoenix Police
        Department, Phoenix Sky Harbor International Airport, Maricopa County Animal Care &amp; Control or the City of
        Phoenix. Official lost-and-found offices retain and release found property.
      </p>
    </>
  );
}
