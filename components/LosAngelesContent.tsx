// components/LosAngelesContent.tsx
// Contenu enrichi, spécifique à Los Angeles.
// Rendu uniquement quand la ville est "Los Angeles, CA" (voir page.tsx).
// Server component (pas de "use client") — compatible SSR/SEO.

import Image from "next/image";
import Link from "next/link";

// --- Liens externes officiels (vérifiés) ---
const L = {
  metro: "https://www.metro.net/about/lostandfound/",
  metroClaim: "https://lostandfound.metro.net/",
  metrolink: "https://metrolinktrains.com/customer-service/lost--found/",
  lapd: "https://www.lapdonline.org/file-a-police-report/",
  lapdInfo:
    "https://www.lapdonline.org/does-the-los-angeles-police-department-have-a-lost-and-found-section/",
  lax: "https://www.flylax.com/lax-comments-and-contact-us/lost-and-found",
  laAnimal: "https://www.laanimalservices.com/lost-pet",
  laCountyAnimal: "https://animalcare.lacounty.gov/if-you-lost-your-pet/",
  spcala: "https://spcala.com/pet-library/general-articles/finding-your-lost-pet/",
  petcolove: "https://lost.petcolove.org/",
};

const ext = "text-blue-600 font-medium hover:underline";

// Quartiers / secteurs de LA (informational — pas de pages dédiées, mais utile SEO)
const areas: { name: string; blurb: string }[] = [
  {
    name: "Downtown LA (DTLA)",
    blurb:
      "Union Station, the Financial District, the Arts District and LA Live. Union Station has its own lost & found, and Metro's A/B/D/E lines converge here.",
  },
  {
    name: "Hollywood & Los Feliz",
    blurb:
      "Hollywood Blvd, the Walk of Fame, Griffith Observatory and Los Feliz. High foot traffic and nightlife mean lots of phones and wallets left behind.",
  },
  {
    name: "Westside (Westwood, UCLA, Brentwood)",
    blurb:
      "UCLA has its own campus lost & found; for items lost off-campus, LAPD's West LA area and rideshare lost-item flows are your best bet.",
  },
  {
    name: "Venice & the coast",
    blurb:
      "The Venice Boardwalk, Abbot Kinney and the beaches. Items lost on the sand are rarely recovered — post a public alert fast.",
  },
  {
    name: "The San Fernando Valley",
    blurb:
      "Sherman Oaks, Van Nuys, North Hollywood and Studio City. Metro's B/G lines and Hollywood Burbank Airport serve the Valley.",
  },
  {
    name: "Koreatown, Silver Lake & Echo Park",
    blurb:
      "Dense, transit-heavy neighborhoods with busy bars and restaurants — check the venue first, then Metro Lost & Found.",
  },
];

const nearby: { label: string; href: string }[] = [
  { label: "Long Beach", href: "/lost-and-found/ca/long-beach" },
  { label: "Santa Monica", href: "/lost-and-found/ca/santa-monica" },
  { label: "Pasadena", href: "/lost-and-found/ca/pasadena" },
  { label: "Glendale", href: "/lost-and-found/ca/glendale" },
  { label: "Burbank", href: "/lost-and-found/ca/burbank" },
  { label: "Inglewood", href: "/lost-and-found/ca/inglewood" },
  { label: "Beverly Hills", href: "/lost-and-found/ca/beverly-hills" },
  { label: "Anaheim", href: "/lost-and-found/ca/anaheim" },
];

// --- FAQ (affichée + JSON-LD pour les rich results Google) ---
const faq: { q: string; a: string }[] = [
  {
    q: "How do I report something lost on LA Metro (bus or train)?",
    a: "File a Lost Item Report online at lostandfound.metro.net or in person at the Metro Lost & Found office (3571 Pasadena Ave). You'll get a reference number by email; wait 3 business days before checking. Items are held for 90 days.",
  },
  {
    q: "Does the LAPD have a lost and found?",
    a: "No. The LAPD does not run a lost and found. Found property goes into their Property System and is held for 90 days. You can still file a lost-property report through the LAPD's online reporting service or by calling 1-877-ASK-LAPD.",
  },
  {
    q: "I lost something at LAX — what do I do?",
    a: "For items lost in public areas of the airport, submit a claim to LAX Airport Police Lost & Found (they use the Crowdfind system). Property is held about 97 days and is mailed to you at your expense. For items left on a plane or at the gate, contact your airline; for a rideshare or taxi, contact that company directly.",
  },
  {
    q: "I left something in an Uber, Lyft or taxi in LA.",
    a: "Use the app's 'I lost an item' flow to contact your driver (Uber and Lyft both have one). For a traditional taxi, call the taxi company directly with your trip details.",
  },
  {
    q: "My pet is lost in Los Angeles — where do I start?",
    a: "File a report with LA Animal Services and use Petco Love Lost — LA shelters use it as the main lost-and-found tool through the LA Lost Pet Coalition. Contact your microchip company too, and make sure your details are current.",
  },
  {
    q: "Is ReportLost.org official or does it replace the police?",
    a: "No. ReportLost.org is an independent service that helps you report to the right official channels faster and amplify your search across local social communities. The official offices retain and release the items.",
  },
];

export function LaTitleSection() {
  return (
    <section className="text-center py-12 px-6 bg-gradient-to-r from-blue-50 to-white rounded-xl shadow border border-gray-100">
      <span className="inline-block px-3 py-1 mb-4 rounded-full text-xs font-bold uppercase tracking-wider bg-blue-100 text-blue-700">
        Los Angeles, CA · Lost &amp; Found
      </span>
      <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 tracking-tight leading-tight">
        Lost something in Los Angeles? Report it and get it back.
      </h1>
      <p className="text-base md:text-lg text-gray-600 max-w-2xl mx-auto leading-relaxed mt-4">
        One report and we route it to the right <strong>LAPD area</strong>, the relevant{" "}
        <strong>Metro, LAX and rideshare lost &amp; found</strong>, and active{" "}
        <strong>local social channels</strong>.
      </p>
    </section>
  );
}

export function LaExtraContent({
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

      {/* Comment ça marche — 3 étapes */}
      <section className="bg-white p-6 rounded-xl shadow">
        <h2 className="text-2xl font-bold text-gray-900 text-center">
          How we help you recover it in Los Angeles
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
            <h3 className="font-bold mt-3 text-gray-900">2. We route it to the right places</h3>
            <p className="text-sm text-gray-600 mt-2">
              The LAPD area covering that spot, plus Metro / LAX / rideshare lost &amp; found and the right social groups.
            </p>
          </div>
          <div className="text-center">
            <div className="w-12 h-12 mx-auto bg-green-100 rounded-full flex items-center justify-center text-2xl">🤝</div>
            <h3 className="font-bold mt-3 text-gray-900">3. You get matched &amp; notified</h3>
            <p className="text-sm text-gray-600 mt-2">
              If someone finds or turns in your item, you&apos;re alerted to arrange pickup.
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
              Spread across roughly 500 square miles, Los Angeles is a city where losing a phone, a wallet, a set
              of keys — or a pet — can happen anywhere from a Metro train to a beach in Venice. The good news is
              that LA has several dedicated lost-and-found systems. The hard part is knowing which one handles your
              case. Report it here and we point you to the right channel and the LAPD area that covers exactly
              where you lost it.
            </p>
            <p>
              Whether it happened on the Metro, at LAX, in a rideshare, at a Hollywood venue or on the Westside,
              acting fast matters — most lost-and-found offices hold items on strict deadlines.
            </p>
          </div>
          {cityImage && (
            <div className="lg:w-2/5 w-full">
              <Image
                src={cityImage}
                alt={cityImageAlt || "View of Los Angeles"}
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
          Exactly what to do, based on where you lost it
        </h2>
        <p className="text-gray-600 mt-2 text-sm text-center max-w-3xl mx-auto">
          Los Angeles has many separate lost-and-found systems. Reporting to the wrong one wastes days — here is
          the right channel for each.
        </p>

        <div className="grid md:grid-cols-2 gap-5 mt-8">
          <div className="border border-gray-200 rounded-xl p-5">
            <div className="w-11 h-11 bg-blue-100 rounded-full flex items-center justify-center text-xl mb-3">🚇</div>
            <h3 className="font-bold text-lg text-gray-900">Metro bus or train (and Metrolink)</h3>
            <p className="text-sm text-gray-600 mt-2 leading-relaxed">
              File a Lost Item Report online with Metro. You&apos;ll get a reference number by email; wait 3 business
              days, then verify at the Lost &amp; Found office. Items are held 90 days. Lost it on a Metrolink train?
              Call or text 800-371-5465.
            </p>
            <p className="mt-3 text-sm">
              <a href={L.metroClaim} target="_blank" rel="noopener noreferrer" className={ext}>File a Metro report →</a>
              <span className="mx-2 text-gray-300">|</span>
              <a href={L.metrolink} target="_blank" rel="noopener noreferrer" className={ext}>Metrolink</a>
            </p>
          </div>

          <div className="border border-gray-200 rounded-xl p-5">
            <div className="w-11 h-11 bg-yellow-100 rounded-full flex items-center justify-center text-xl mb-3">🚕</div>
            <h3 className="font-bold text-lg text-gray-900">Uber, Lyft or taxi</h3>
            <p className="text-sm text-gray-600 mt-2 leading-relaxed">
              Use the app&apos;s &quot;I lost an item&quot; flow to contact your driver (Uber and Lyft both have one).
              For a traditional taxi, call the company directly with your trip time, pickup and drop-off. We help
              you gather the exact details.
            </p>
          </div>

          <div className="border border-gray-200 rounded-xl p-5">
            <div className="w-11 h-11 bg-indigo-100 rounded-full flex items-center justify-center text-xl mb-3">👮</div>
            <h3 className="font-bold text-lg text-gray-900">Handed to the police (LAPD)</h3>
            <p className="text-sm text-gray-600 mt-2 leading-relaxed">
              The LAPD doesn&apos;t run a lost &amp; found, but found property goes into its Property System and is held
              for 90 days. File a lost-property report through the LAPD&apos;s online reporting service, or call
              1-877-ASK-LAPD. We tell you which LAPD area covers your loss location.
            </p>
            <p className="mt-3 text-sm">
              <a href={L.lapd} target="_blank" rel="noopener noreferrer" className={ext}>File an LAPD report →</a>
              <span className="mx-2 text-gray-300">|</span>
              <a href={L.lapdInfo} target="_blank" rel="noopener noreferrer" className={ext}>How LAPD property works</a>
            </p>
          </div>

          <div className="border border-gray-200 rounded-xl p-5">
            <div className="w-11 h-11 bg-sky-100 rounded-full flex items-center justify-center text-xl mb-3">✈️</div>
            <h3 className="font-bold text-lg text-gray-900">LAX airport</h3>
            <p className="text-sm text-gray-600 mt-2 leading-relaxed">
              For items lost in public areas (gates, baggage, curbside, LAX-IT), submit a claim to LAX Airport
              Police Lost &amp; Found. Property is held about 97 days and mailed to you. On a plane or at the gate?
              Contact your airline instead.
            </p>
            <p className="mt-3 text-sm">
              <a href={L.lax} target="_blank" rel="noopener noreferrer" className={ext}>LAX Lost &amp; Found →</a>
            </p>
          </div>

          <div className="border border-gray-200 rounded-xl p-5">
            <div className="w-11 h-11 bg-green-100 rounded-full flex items-center justify-center text-xl mb-3">🌴</div>
            <h3 className="font-bold text-lg text-gray-900">Street, beach, shop or venue</h3>
            <p className="text-sm text-gray-600 mt-2 leading-relaxed">
              Ask the venue&apos;s front desk or security first (malls, museums, stadiums, hotels and Union Station
              keep their own lost &amp; found). For items lost outdoors, a public alert on local groups is often what
              gets an honest finder to reach you.
            </p>
          </div>

          <div className="border border-gray-200 rounded-xl p-5">
            <div className="w-11 h-11 bg-rose-100 rounded-full flex items-center justify-center text-xl mb-3">🐾</div>
            <h3 className="font-bold text-lg text-gray-900">Lost pet (dog, cat, other)</h3>
            <p className="text-sm text-gray-600 mt-2 leading-relaxed">
              File a report with LA Animal Services and search Petco Love Lost — LA shelters use it as the main
              lost-and-found tool through the LA Lost Pet Coalition. Contact your microchip company, and keep your
              details current. In county areas, use LA County Animal Care.
            </p>
            <p className="mt-3 text-sm">
              <a href={L.laAnimal} target="_blank" rel="noopener noreferrer" className={ext}>LA Animal Services →</a>
              <span className="mx-2 text-gray-300">|</span>
              <a href={L.petcolove} target="_blank" rel="noopener noreferrer" className={ext}>Petco Love Lost</a>
              <span className="mx-2 text-gray-300">|</span>
              <a href={L.laCountyAnimal} target="_blank" rel="noopener noreferrer" className={ext}>LA County</a>
            </p>
          </div>
        </div>
      </section>

      {/* CTA milieu de page vers le formulaire */}
      <section className="bg-blue-50 rounded-xl border border-blue-100 p-8 text-center">
        <h2 className="text-2xl font-bold text-gray-900">Don&apos;t wait — the first 48 hours matter most</h2>
        <p className="mt-2 text-gray-600">
          Lost &amp; found offices clear items on strict deadlines. Get in the system now.
        </p>
        <a
          href="#report-form"
          className="mt-5 inline-block bg-green-600 hover:bg-green-700 text-white font-bold px-8 py-3 rounded-lg shadow-md transition"
        >
          Report my lost item →
        </a>
      </section>

      {/* Secteurs / quartiers de LA */}
      <section className="bg-white p-6 rounded-xl shadow">
        <h2 className="text-2xl font-bold text-gray-900">Lost something in a specific LA area?</h2>
        <p className="text-gray-600 mt-2 text-sm max-w-3xl">
          Los Angeles is huge and spread out. Knowing the area helps you target the right transit hub, LAPD
          division and local hotspots.
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
        <h2 className="text-2xl font-bold text-gray-900">Amplify your report on LA&apos;s social channels</h2>
        <p className="text-gray-600 mt-2 text-sm max-w-3xl">
          Most items come back through a person, not an office. We help you create a clean, shareable post and
          point you to the most active LA communities:
        </p>
        <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-4 mt-5 text-sm">
          {[
            ["Facebook groups", "“LA Lost & Found”, neighborhood & Valley groups"],
            ["Reddit", "r/LosAngeles, r/AskLosAngeles"],
            ["Nextdoor", "Your exact neighborhood — great for pets"],
            ["X / Twitter", "Tag the Metro line, station or venue"],
            ["Instagram", "Local lost-pet & community pages"],
            ["Building / campus boards", "UCLA, USC, coworking, residential"],
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
          Los Angeles lost &amp; found — frequently asked questions
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

      {/* CTA final vers le formulaire */}
      <section className="text-center py-6">
        <h2 className="text-2xl font-bold text-gray-900">Ready to get your item back?</h2>
        <p className="text-gray-600 mt-2">One report. Every relevant channel in Los Angeles.</p>
        <a
          href="#report-form"
          className="mt-5 inline-block bg-green-600 hover:bg-green-700 text-white font-bold px-8 py-3 rounded-lg shadow-md transition"
        >
          Start my report →
        </a>
      </section>

      {/* Disclaimer (E-E-A-T) */}
      <p className="text-xs text-gray-400 text-center max-w-3xl mx-auto">
        ReportLost.org is an independent service and is not affiliated with LA Metro, the LAPD, Los Angeles World
        Airports (LAX), LA Animal Services or the City of Los Angeles. Official lost-and-found offices retain and
        release found property.
      </p>
    </>
  );
}
