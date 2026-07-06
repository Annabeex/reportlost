// components/ChicagoContent.tsx
// Contenu enrichi, spécifique à Chicago (formulation volontairement distincte
// de New York / Los Angeles pour éviter le duplicate content).
// Rendu uniquement quand la ville est "Chicago, IL" (voir page.tsx).

import Image from "next/image";
import Link from "next/link";

const L = {
  cta: "https://www.transitchicago.com/lostandfound/",
  metra: "https://metra.com/lost-and-found",
  cpd: "https://www.chicagopolice.org/police-records-procedures/notice-to-owners-of-property/",
  ord: "https://www.flychicago.com/ohare/ServicesAmenities/services/Pages/lostfound.aspx",
  mdw: "https://www.flychicago.com/midway/ServicesAmenities/services/Pages/lostfound.aspx",
  cacc: "https://www.chicago.gov/city/en/depts/cacc/provdrs/care/svcs/lost_pet_recovery.html",
  petcolove: "https://lost.petcolove.org/",
  chi311: "https://311.chicago.gov/",
};

const ext = "text-blue-600 font-medium hover:underline";

const areas: { name: string; blurb: string }[] = [
  {
    name: "The Loop & River North",
    blurb:
      "Downtown offices, Millennium Park, Union Station and the busiest CTA transfers. Rush-hour crowds mean plenty of phones and wallets left on the 'L'.",
  },
  {
    name: "North Side (Lincoln Park, Lakeview, Wrigleyville)",
    blurb:
      "Game days at Wrigley, lakefront paths and a dense bar scene — check the venue first, then CTA Lost & Found.",
  },
  {
    name: "Wicker Park & Logan Square",
    blurb:
      "The Blue Line to O'Hare runs through here, so items lost on the way to the airport often turn up on this corridor.",
  },
  {
    name: "South Side (Hyde Park, Bronzeville)",
    blurb:
      "The University of Chicago, Metra Electric and the Museum of Science and Industry. Campus and museum desks keep their own lost & found.",
  },
  {
    name: "West Loop & Pilsen",
    blurb:
      "Restaurant Row, the United Center and a growing transit hub. Venues and rideshares are the first places to check.",
  },
];

const nearby: { label: string; href: string }[] = [
  { label: "Evanston", href: "/lost-and-found/il/evanston" },
  { label: "Oak Park", href: "/lost-and-found/il/oak-park" },
  { label: "Cicero", href: "/lost-and-found/il/cicero" },
  { label: "Naperville", href: "/lost-and-found/il/naperville" },
  { label: "Aurora", href: "/lost-and-found/il/aurora" },
  { label: "Skokie", href: "/lost-and-found/il/skokie" },
  { label: "Schaumburg", href: "/lost-and-found/il/schaumburg" },
  { label: "Joliet", href: "/lost-and-found/il/joliet" },
];

// FAQ — questions reformulées (ton différent des autres villes)
const faq: { q: string; a: string }[] = [
  {
    q: "Where do I report an item left on a CTA bus or 'L' train?",
    a: "Submit a lost-item report to CTA online (via transitchicago.com/lostandfound), through the Ventra app, or by contacting Customer Service. If it happened on a Metra commuter train instead, use Metra's separate lost-and-found.",
  },
  {
    q: "Does the Chicago Police Department keep lost property?",
    a: "Recovered property is handled by the CPD's Evidence & Recovered Property Section (1011 S. Homan Ave). If your inventory receipt says the item is available for return, bring it with a photo ID. Claim it within 30 days — after that it can be sold, donated or destroyed under city code.",
  },
  {
    q: "I lost something at O'Hare or Midway.",
    a: "For O'Hare, contact the airport Lost & Found (Terminal 2, lower level). For Midway, call the Communication Center. Items left at a TSA checkpoint go through TSA, and anything left on the plane or at the gate is handled by your airline.",
  },
  {
    q: "What about an Uber, Lyft or taxi?",
    a: "Open the app's lost-item help to reach your driver (Uber and Lyft both offer this). For a metered cab, call the taxi company with your pickup time and route.",
  },
  {
    q: "My pet went missing in Chicago — what's the first step?",
    a: "Check the Chicago Animal Care & Control listings (petharbor.com/chicago), text LOST to 1-855-LOST312 for guidance, and post to Petco Love Lost. Have any shelter or vet scan for a microchip and keep your registration current.",
  },
  {
    q: "Is ReportLost.org an official city service?",
    a: "No — we're independent. We help you reach the correct official channels quickly and spread the word across local communities. The official lost-and-found offices are the ones that hold and release recovered items.",
  },
];

export function ChicagoTitleSection() {
  return (
    <section className="text-center py-12 px-6 bg-gradient-to-r from-blue-50 to-white rounded-xl shadow border border-gray-100">
      <span className="inline-block px-3 py-1 mb-4 rounded-full text-xs font-bold uppercase tracking-wider bg-blue-100 text-blue-700">
        Chicago, IL · Lost &amp; Found
      </span>
      <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 tracking-tight leading-tight">
        Left something behind in Chicago? Report it and start the search.
      </h1>
      <p className="text-base md:text-lg text-gray-600 max-w-2xl mx-auto leading-relaxed mt-4">
        File one report and we&apos;ll point you to the right <strong>Chicago Police district</strong>, the relevant{" "}
        <strong>CTA, airport and rideshare lost &amp; found</strong>, and the local groups that actually get items
        returned.
      </p>
    </section>
  );
}

export function ChicagoExtraContent({
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
          How ReportLost helps you recover it in Chicago
        </h2>
        <div className="grid md:grid-cols-3 gap-6 mt-8">
          <div className="text-center">
            <div className="w-12 h-12 mx-auto bg-blue-100 rounded-full flex items-center justify-center text-2xl">📝</div>
            <h3 className="font-bold mt-3 text-gray-900">1. Tell us what &amp; where</h3>
            <p className="text-sm text-gray-600 mt-2">
              A quick description of the item and the spot you lost it is all we need to get started.
            </p>
          </div>
          <div className="text-center">
            <div className="w-12 h-12 mx-auto bg-blue-100 rounded-full flex items-center justify-center text-2xl">📡</div>
            <h3 className="font-bold mt-3 text-gray-900">2. We match it to the right desk</h3>
            <p className="text-sm text-gray-600 mt-2">
              CTA, an airport office, the Chicago Police district for that block, and the busiest local groups.
            </p>
          </div>
          <div className="text-center">
            <div className="w-12 h-12 mx-auto bg-green-100 rounded-full flex items-center justify-center text-2xl">🤝</div>
            <h3 className="font-bold mt-3 text-gray-900">3. We alert you on a match</h3>
            <p className="text-sm text-gray-600 mt-2">
              When your item surfaces, you hear about it and can arrange to pick it up.
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
              From the 'L' platforms downtown to the lakefront and the neighborhoods, Chicago is a big, busy city
              where a phone, a wallet, a bag — or a pet — can slip away in a moment. The city runs several
              lost-and-found systems, but they don&apos;t talk to each other, so the trick is starting with the right
              one. Report it here and we&apos;ll send you to the correct channel and the police district that covers
              where it happened.
            </p>
            <p>
              On the CTA, at O&apos;Hare or Midway, in a rideshare, or at a Loop restaurant — the sooner you report,
              the better your odds. Several offices hold items for only a few weeks before moving them on.
            </p>
          </div>
          {cityImage && (
            <div className="lg:w-2/5 w-full">
              <Image
                src={cityImage}
                alt={cityImageAlt || "View of Chicago"}
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
          Where to report — depending on where you lost it
        </h2>
        <p className="text-gray-600 mt-2 text-sm text-center max-w-3xl mx-auto">
          Each part of Chicago&apos;s lost-and-found network handles different places. Start with the right one and you
          save days.
        </p>

        <div className="grid md:grid-cols-2 gap-5 mt-8">
          <div className="border border-gray-200 rounded-xl p-5">
            <div className="w-11 h-11 bg-blue-100 rounded-full flex items-center justify-center text-xl mb-3">🚆</div>
            <h3 className="font-bold text-lg text-gray-900">CTA bus or 'L' train (and Metra)</h3>
            <p className="text-sm text-gray-600 mt-2 leading-relaxed">
              Report your item to the CTA online or through the Ventra app. Left it on a Metra commuter train?
              That&apos;s a separate lost-and-found — use Metra&apos;s form instead.
            </p>
            <p className="mt-3 text-sm">
              <a href={L.cta} target="_blank" rel="noopener noreferrer" className={ext}>CTA Lost &amp; Found →</a>
              <span className="mx-2 text-gray-300">|</span>
              <a href={L.metra} target="_blank" rel="noopener noreferrer" className={ext}>Metra</a>
            </p>
          </div>

          <div className="border border-gray-200 rounded-xl p-5">
            <div className="w-11 h-11 bg-yellow-100 rounded-full flex items-center justify-center text-xl mb-3">🚕</div>
            <h3 className="font-bold text-lg text-gray-900">Rideshare or taxi</h3>
            <p className="text-sm text-gray-600 mt-2 leading-relaxed">
              Uber and Lyft both have an in-app &quot;I lost an item&quot; option that connects you to your driver. For a
              metered cab, phone the company with your trip time and route. We help you pull those details together.
            </p>
          </div>

          <div className="border border-gray-200 rounded-xl p-5">
            <div className="w-11 h-11 bg-indigo-100 rounded-full flex items-center justify-center text-xl mb-3">👮</div>
            <h3 className="font-bold text-lg text-gray-900">Turned in to the police (CPD)</h3>
            <p className="text-sm text-gray-600 mt-2 leading-relaxed">
              Recovered property is held by the CPD&apos;s Evidence &amp; Recovered Property Section. Bring your inventory
              receipt and a photo ID. Heads up: you generally have <strong>30 days</strong> to claim it before it can
              be disposed of.
            </p>
            <p className="mt-3 text-sm">
              <a href={L.cpd} target="_blank" rel="noopener noreferrer" className={ext}>How CPD property works →</a>
            </p>
          </div>

          <div className="border border-gray-200 rounded-xl p-5">
            <div className="w-11 h-11 bg-sky-100 rounded-full flex items-center justify-center text-xl mb-3">✈️</div>
            <h3 className="font-bold text-lg text-gray-900">O'Hare or Midway</h3>
            <p className="text-sm text-gray-600 mt-2 leading-relaxed">
              O&apos;Hare&apos;s Lost &amp; Found is in Terminal 2 (lower level); Midway has its own Communication Center.
              Security-checkpoint items go through TSA, and anything left on the plane or at the gate is handled by
              your airline.
            </p>
            <p className="mt-3 text-sm">
              <a href={L.ord} target="_blank" rel="noopener noreferrer" className={ext}>O'Hare →</a>
              <span className="mx-2 text-gray-300">|</span>
              <a href={L.mdw} target="_blank" rel="noopener noreferrer" className={ext}>Midway</a>
            </p>
          </div>

          <div className="border border-gray-200 rounded-xl p-5">
            <div className="w-11 h-11 bg-green-100 rounded-full flex items-center justify-center text-xl mb-3">🏙️</div>
            <h3 className="font-bold text-lg text-gray-900">Street, park, shop or venue</h3>
            <p className="text-sm text-gray-600 mt-2 leading-relaxed">
              Ask the front desk or security first — stadiums, museums, hotels and Union Station keep their own lost
              &amp; found. For anything lost outdoors, a public alert on Chicago groups is often what brings it back.
            </p>
            <p className="mt-3 text-sm">
              <a href={L.chi311} target="_blank" rel="noopener noreferrer" className={ext}>Chicago 311 →</a>
            </p>
          </div>

          <div className="border border-gray-200 rounded-xl p-5">
            <div className="w-11 h-11 bg-rose-100 rounded-full flex items-center justify-center text-xl mb-3">🐾</div>
            <h3 className="font-bold text-lg text-gray-900">Lost pet (dog, cat, other)</h3>
            <p className="text-sm text-gray-600 mt-2 leading-relaxed">
              Watch the Chicago Animal Care &amp; Control listings on petharbor.com/chicago, text LOST to
              1-855-LOST312 for step-by-step help, and post to Petco Love Lost. A microchip is the single best way to
              be reunited — keep yours up to date.
            </p>
            <p className="mt-3 text-sm">
              <a href={L.cacc} target="_blank" rel="noopener noreferrer" className={ext}>Chicago Animal Care →</a>
              <span className="mx-2 text-gray-300">|</span>
              <a href={L.petcolove} target="_blank" rel="noopener noreferrer" className={ext}>Petco Love Lost</a>
            </p>
          </div>
        </div>
      </section>

      {/* CTA milieu */}
      <section className="bg-blue-50 rounded-xl border border-blue-100 p-8 text-center">
        <h2 className="text-2xl font-bold text-gray-900">The clock is ticking — report it today</h2>
        <p className="mt-2 text-gray-600">
          Chicago offices clear unclaimed items on tight timelines. Get your report in the system now.
        </p>
        <a
          href="#report-form"
          className="mt-5 inline-block bg-green-600 hover:bg-green-700 text-white font-bold px-8 py-3 rounded-lg shadow-md transition"
        >
          Report my lost item →
        </a>
      </section>

      {/* Secteurs de Chicago */}
      <section className="bg-white p-6 rounded-xl shadow">
        <h2 className="text-2xl font-bold text-gray-900">Which Chicago neighborhood did you lose it in?</h2>
        <p className="text-gray-600 mt-2 text-sm max-w-3xl">
          Chicago is a city of neighborhoods, each with its own transit stops, police district and hotspots.
          Pinning down the area speeds everything up.
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
        <h2 className="text-2xl font-bold text-gray-900">Get more eyes on it across Chicago&apos;s communities</h2>
        <p className="text-gray-600 mt-2 text-sm max-w-3xl">
          A returned item usually comes from a helpful stranger, not an office. We help you write a clean, shareable
          post and aim it at the most active Chicago communities:
        </p>
        <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-4 mt-5 text-sm">
          {[
            ["Facebook groups", "Neighborhood & “Chicago Lost & Found” groups"],
            ["Reddit", "r/chicago, r/AskChicago"],
            ["Nextdoor", "Your block — especially useful for pets"],
            ["X / Twitter", "Tag the CTA line, station or venue"],
            ["Instagram", "Local lost-pet & community pages"],
            ["Campus & building boards", "UChicago, Loop offices, residential"],
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
        <h2 className="text-2xl font-bold text-gray-900 mb-4">Chicago lost &amp; found — quick answers</h2>
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
        <h2 className="text-2xl font-bold text-gray-900">Ready to track it down?</h2>
        <p className="text-gray-600 mt-2">One report reaches every channel that matters in Chicago.</p>
        <a
          href="#report-form"
          className="mt-5 inline-block bg-green-600 hover:bg-green-700 text-white font-bold px-8 py-3 rounded-lg shadow-md transition"
        >
          Start my report →
        </a>
      </section>

      {/* Disclaimer */}
      <p className="text-xs text-gray-400 text-center max-w-3xl mx-auto">
        ReportLost.org is an independent service and is not affiliated with the CTA, the Chicago Police Department,
        the Chicago Department of Aviation, Chicago Animal Care &amp; Control or the City of Chicago. Official
        lost-and-found offices retain and release found property.
      </p>
    </>
  );
}
