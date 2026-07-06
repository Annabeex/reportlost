// components/HoustonContent.tsx
// Contenu enrichi, spécifique à Houston (formulation distincte des autres villes
// pour éviter le duplicate content). Rendu quand la ville est "Houston, TX".

import Image from "next/image";
import Link from "next/link";

const L = {
  metro: "https://www.ridemetro.org/riding-metro/lost-and-found",
  hpd: "https://www.houstontx.gov/police/divisions/property/found_abandoned_or_unclaimed_property.htm",
  iah: "https://www.fly2houston.com/iah/lost-and-found/",
  hou: "https://www.fly2houston.com/hou/lost-and-found/",
  barc: "https://www.houstontx.gov/barc/lost_pet.html",
  petcolove: "https://lost.petcolove.org/",
  houstonspca: "https://houstonspca.org/resources-programs/found-animals/",
};

const ext = "text-blue-600 font-medium hover:underline";

const areas: { name: string; blurb: string }[] = [
  {
    name: "Downtown & Midtown",
    blurb:
      "The theater district, sports venues and the METRORail Red Line. The METRO RideStore on Main Street is where recovered transit items are picked up.",
  },
  {
    name: "The Galleria & Uptown",
    blurb:
      "Houston's biggest shopping district — malls and hotels keep their own lost & found, so ask the front desk before anything else.",
  },
  {
    name: "Texas Medical Center & Museum District",
    blurb:
      "One of the busiest medical complexes in the world, plus Rice University and the museums. Campus and hospital desks handle their own found items.",
  },
  {
    name: "Montrose & The Heights",
    blurb:
      "Walkable, restaurant- and bar-heavy neighborhoods where items are most often left at venues — a quick call usually beats waiting.",
  },
  {
    name: "Energy Corridor & the west side",
    blurb:
      "Sprawling office parks and Park & Ride commuter routes. Items lost on a Park & Ride bus go through METRO Lost & Found.",
  },
];

const nearby: { label: string; href: string }[] = [
  { label: "Sugar Land", href: "/lost-and-found/tx/sugar-land" },
  { label: "Pearland", href: "/lost-and-found/tx/pearland" },
  { label: "Pasadena", href: "/lost-and-found/tx/pasadena" },
  { label: "Baytown", href: "/lost-and-found/tx/baytown" },
  { label: "Katy", href: "/lost-and-found/tx/katy" },
  { label: "The Woodlands", href: "/lost-and-found/tx/the-woodlands" },
  { label: "Galveston", href: "/lost-and-found/tx/galveston" },
  { label: "Spring", href: "/lost-and-found/tx/spring" },
];

const faq: { q: string; a: string }[] = [
  {
    q: "How do I get back something left on a METRO bus or train?",
    a: "Call METRO Lost & Found at 713-658-0854 or email LostAndFound@RideMETRO.org with a description and your route or vehicle number. If it's found, you'll get a claim number and can pick it up at the RideStore, 1900 Main Street. Items are held about 30 days.",
  },
  {
    q: "How does the Houston Police Department handle found property?",
    a: "Found and unclaimed property is managed by the HPD Property Division (1202 Washington Ave). To claim an item, email Property.Investigations@Houstontx.gov with a description and proof of ownership. Public notices of found property stay up for at least 90 days.",
  },
  {
    q: "I lost something at Bush Intercontinental (IAH) or Hobby (HOU).",
    a: "Each airport has its own Lost & Found with an online form — IAH and Hobby are handled separately. Security-checkpoint items go through TSA at that airport, and anything left on the plane is held by your airline.",
  },
  {
    q: "What about an Uber, Lyft or taxi ride?",
    a: "Use the app's lost-item feature to message your driver (both Uber and Lyft have one). For a taxi, call the company with your trip time and pickup/drop-off details.",
  },
  {
    q: "My pet is missing in Houston — where do I begin?",
    a: "Search and report on Petco Love Lost, and check BARC (the city shelter) at 3200 Carr St or call 832-395-9084. The Houston SPCA and Houston Humane Society can help too. If your pet is microchipped, alert the chip company right away.",
  },
  {
    q: "Are you the city's official lost and found?",
    a: "No. ReportLost.org is an independent service that helps you reach the right official channels faster and spread the word locally. The official offices are the ones that store and release recovered property.",
  },
];

export function HoustonTitleSection() {
  return (
    <section className="text-center py-12 px-6 bg-gradient-to-r from-blue-50 to-white rounded-xl shadow border border-gray-100">
      <span className="inline-block px-3 py-1 mb-4 rounded-full text-xs font-bold uppercase tracking-wider bg-blue-100 text-blue-700">
        Houston, TX · Lost &amp; Found
      </span>
      <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 tracking-tight leading-tight">
        Lost something in Houston? Report it and we&apos;ll route it to the right hands.
      </h1>
      <p className="text-base md:text-lg text-gray-600 max-w-2xl mx-auto leading-relaxed mt-4">
        Send one report and we&apos;ll connect you with the right <strong>HPD property channel</strong>, the relevant{" "}
        <strong>METRO, airport and rideshare lost &amp; found</strong>, and the local groups most likely to spot it.
      </p>
    </section>
  );
}

export function HoustonExtraContent({
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
          How ReportLost gets your item back in Houston
        </h2>
        <div className="grid md:grid-cols-3 gap-6 mt-8">
          <div className="text-center">
            <div className="w-12 h-12 mx-auto bg-blue-100 rounded-full flex items-center justify-center text-2xl">📝</div>
            <h3 className="font-bold mt-3 text-gray-900">1. Describe your loss</h3>
            <p className="text-sm text-gray-600 mt-2">
              Tell us the item and roughly where and when it went missing — details make the match.
            </p>
          </div>
          <div className="text-center">
            <div className="w-12 h-12 mx-auto bg-blue-100 rounded-full flex items-center justify-center text-2xl">📡</div>
            <h3 className="font-bold mt-3 text-gray-900">2. We send it to the right office</h3>
            <p className="text-sm text-gray-600 mt-2">
              METRO, the airport, the HPD property channel for that area, and the busiest Houston groups.
            </p>
          </div>
          <div className="text-center">
            <div className="w-12 h-12 mx-auto bg-green-100 rounded-full flex items-center justify-center text-2xl">🤝</div>
            <h3 className="font-bold mt-3 text-gray-900">3. You get the good news</h3>
            <p className="text-sm text-gray-600 mt-2">
              If it turns up, we let you know so you can arrange to collect it.
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
              As the largest city in Texas and one of the most spread-out in the country, Houston gives a lost
              phone, wallet or pet a lot of ground to disappear into — from the METRORail downtown to the Galleria,
              the Medical Center and two major airports. Each has its own lost-and-found process, and they work
              independently. Report it here and we&apos;ll steer you to the right one and the police area that covers
              where it happened.
            </p>
            <p>
              Whether it slipped away on a Park &amp; Ride bus, at IAH or Hobby, in a rideshare, or at a Montrose
              restaurant, don&apos;t sit on it — some offices only hold items for about a month.
            </p>
          </div>
          {cityImage && (
            <div className="lg:w-2/5 w-full">
              <Image
                src={cityImage}
                alt={cityImageAlt || "View of Houston"}
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
          The right place to report, by where it went missing
        </h2>
        <p className="text-gray-600 mt-2 text-sm text-center max-w-3xl mx-auto">
          Houston&apos;s lost-and-found offices don&apos;t overlap. Match your situation below and skip the runaround.
        </p>

        <div className="grid md:grid-cols-2 gap-5 mt-8">
          <div className="border border-gray-200 rounded-xl p-5">
            <div className="w-11 h-11 bg-blue-100 rounded-full flex items-center justify-center text-xl mb-3">🚈</div>
            <h3 className="font-bold text-lg text-gray-900">METRO bus, METRORail or Park &amp; Ride</h3>
            <p className="text-sm text-gray-600 mt-2 leading-relaxed">
              Call 713-658-0854 or email METRO with your item description and route or vehicle number. If it&apos;s
              found, you&apos;ll get a claim number and pick it up at the RideStore on Main Street. Items are held around
              30 days.
            </p>
            <p className="mt-3 text-sm">
              <a href={L.metro} target="_blank" rel="noopener noreferrer" className={ext}>METRO Lost &amp; Found →</a>
            </p>
          </div>

          <div className="border border-gray-200 rounded-xl p-5">
            <div className="w-11 h-11 bg-yellow-100 rounded-full flex items-center justify-center text-xl mb-3">🚕</div>
            <h3 className="font-bold text-lg text-gray-900">Uber, Lyft or taxi</h3>
            <p className="text-sm text-gray-600 mt-2 leading-relaxed">
              Both Uber and Lyft let you report a lost item and message your driver from the app. For a taxi, call
              the company directly with your pickup time and route. We help you assemble the details that speed it up.
            </p>
          </div>

          <div className="border border-gray-200 rounded-xl p-5">
            <div className="w-11 h-11 bg-indigo-100 rounded-full flex items-center justify-center text-xl mb-3">👮</div>
            <h3 className="font-bold text-lg text-gray-900">Turned in to the police (HPD)</h3>
            <p className="text-sm text-gray-600 mt-2 leading-relaxed">
              The HPD Property Division stores found and unclaimed property. To claim an item, email
              Property.Investigations@Houstontx.gov with a description and proof of ownership. Public notices stay up
              for at least 90 days.
            </p>
            <p className="mt-3 text-sm">
              <a href={L.hpd} target="_blank" rel="noopener noreferrer" className={ext}>HPD found property →</a>
            </p>
          </div>

          <div className="border border-gray-200 rounded-xl p-5">
            <div className="w-11 h-11 bg-sky-100 rounded-full flex items-center justify-center text-xl mb-3">✈️</div>
            <h3 className="font-bold text-lg text-gray-900">IAH or Hobby airport</h3>
            <p className="text-sm text-gray-600 mt-2 leading-relaxed">
              Bush Intercontinental (IAH) and Hobby (HOU) each run their own Lost &amp; Found with an online form.
              Checkpoint items go through TSA at that airport; anything left on board is held by your airline.
            </p>
            <p className="mt-3 text-sm">
              <a href={L.iah} target="_blank" rel="noopener noreferrer" className={ext}>IAH →</a>
              <span className="mx-2 text-gray-300">|</span>
              <a href={L.hou} target="_blank" rel="noopener noreferrer" className={ext}>Hobby</a>
            </p>
          </div>

          <div className="border border-gray-200 rounded-xl p-5">
            <div className="w-11 h-11 bg-green-100 rounded-full flex items-center justify-center text-xl mb-3">🤠</div>
            <h3 className="font-bold text-lg text-gray-900">Street, mall, shop or venue</h3>
            <p className="text-sm text-gray-600 mt-2 leading-relaxed">
              Front desks and security at malls, stadiums, museums and hotels keep their own lost &amp; found — always
              ask there first. For anything lost in public, a shareable alert to Houston groups widens the net fast.
            </p>
          </div>

          <div className="border border-gray-200 rounded-xl p-5">
            <div className="w-11 h-11 bg-rose-100 rounded-full flex items-center justify-center text-xl mb-3">🐾</div>
            <h3 className="font-bold text-lg text-gray-900">Lost pet (dog, cat, other)</h3>
            <p className="text-sm text-gray-600 mt-2 leading-relaxed">
              Report and search on Petco Love Lost, and check BARC (the city shelter) at 3200 Carr St. The Houston
              SPCA and Houston Humane Society help too. If your pet has a microchip, contact the chip company right
              away.
            </p>
            <p className="mt-3 text-sm">
              <a href={L.barc} target="_blank" rel="noopener noreferrer" className={ext}>BARC lost pets →</a>
              <span className="mx-2 text-gray-300">|</span>
              <a href={L.petcolove} target="_blank" rel="noopener noreferrer" className={ext}>Petco Love Lost</a>
              <span className="mx-2 text-gray-300">|</span>
              <a href={L.houstonspca} target="_blank" rel="noopener noreferrer" className={ext}>Houston SPCA</a>
            </p>
          </div>
        </div>
      </section>

      {/* CTA milieu */}
      <section className="bg-blue-50 rounded-xl border border-blue-100 p-8 text-center">
        <h2 className="text-2xl font-bold text-gray-900">Move quickly — most items don&apos;t wait around</h2>
        <p className="mt-2 text-gray-600">
          Several Houston offices hold unclaimed items for only weeks. File your report now.
        </p>
        <a
          href="#report-form"
          className="mt-5 inline-block bg-green-600 hover:bg-green-700 text-white font-bold px-8 py-3 rounded-lg shadow-md transition"
        >
          Report my lost item →
        </a>
      </section>

      {/* Secteurs de Houston */}
      <section className="bg-white p-6 rounded-xl shadow">
        <h2 className="text-2xl font-bold text-gray-900">Which part of Houston did you lose it in?</h2>
        <p className="text-gray-600 mt-2 text-sm max-w-3xl">
          Houston is enormous and car-centric. Knowing the district points you to the right transit hub, police
          station and the venues worth calling first.
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
        <h2 className="text-2xl font-bold text-gray-900">Spread the word across Houston</h2>
        <p className="text-gray-600 mt-2 text-sm max-w-3xl">
          More often than not, an honest neighbor is what reunites you with your item. We help you post a clean
          alert to the Houston communities that see the most traffic:
        </p>
        <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-4 mt-5 text-sm">
          {[
            ["Facebook groups", "Neighborhood & “Houston Lost & Found” groups"],
            ["Reddit", "r/houston, r/askhouston"],
            ["Nextdoor", "Your subdivision — great for pets"],
            ["X / Twitter", "Tag the METRO route, station or venue"],
            ["Instagram", "Local lost-pet & community pages"],
            ["Campus & office boards", "Rice, UH, TMC, Energy Corridor"],
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
        <h2 className="text-2xl font-bold text-gray-900 mb-4">Houston lost &amp; found — your questions answered</h2>
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
        <h2 className="text-2xl font-bold text-gray-900">Ready to get it back?</h2>
        <p className="text-gray-600 mt-2">One report covers every channel that counts in Houston.</p>
        <a
          href="#report-form"
          className="mt-5 inline-block bg-green-600 hover:bg-green-700 text-white font-bold px-8 py-3 rounded-lg shadow-md transition"
        >
          Start my report →
        </a>
      </section>

      {/* Disclaimer */}
      <p className="text-xs text-gray-400 text-center max-w-3xl mx-auto">
        ReportLost.org is an independent service and is not affiliated with METRO, the Houston Police Department,
        the Houston Airport System, BARC or the City of Houston. Official lost-and-found offices retain and release
        found property.
      </p>
    </>
  );
}
