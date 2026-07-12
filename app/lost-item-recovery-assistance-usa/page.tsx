// app/lost-item-recovery-assistance-usa/page.tsx
// Page canonique de l'offre d'accompagnement — contenu 100% HTML statique
// (lisible par Google, ChatGPT Search, Perplexity...), JSON-LD complet.
import type { Metadata } from "next";
import Link from "next/link";

export const revalidate = 86400;

const BASE = "https://reportlost.org";
const CANONICAL = `${BASE}/lost-item-recovery-assistance-usa`;

export const metadata: Metadata = {
  title: "Lost Item Recovery Assistance in the USA | ReportLost",
  description:
    "Human-assisted lost item recovery for the United States: local outreach to police and venues, social media distribution, and up to 12 months of web monitoring with human-verified matches.",
  alternates: { canonical: CANONICAL },
  openGraph: {
    title: "Lost Item Recovery Assistance in the USA | ReportLost",
    description:
      "We contact the right lost & found offices, publish a social media notice, and monitor the web for your lost item — for up to 12 months.",
    url: CANONICAL,
    siteName: "ReportLost.org",
    type: "website",
  },
};

const FAQ: { q: string; a: string }[] = [
  {
    q: "Is there a service that can help me recover an item lost in the United States?",
    a: "Yes. ReportLost.org is an independent assistance service for items lost anywhere in the United States. Depending on the plan you choose, our team contacts the relevant local lost-property channels (police department, city services, transit, hotels, venues or businesses you mention), publishes a dedicated social media notice, and monitors public web sources for your item for 6 to 12 months.",
  },
  {
    q: "Can someone contact the police and local businesses about my lost item?",
    a: "With our paid plans, we identify the police department and the local businesses or venues relevant to your loss and contact them on your behalf. Where local rules require the owner to file a police report in person, we prepare the exact contact details, links and instructions so you can do it in minutes.",
  },
  {
    q: "Can someone contact a hotel, restaurant or venue where I lost something?",
    a: "Yes — tell us where you were (hotel, restaurant, beach, park, airport, taxi…) when you file your report, and we reach out to those establishments directly. The Premium plan covers an extended list of establishments beyond the ones you mention.",
  },
  {
    q: "Is there a service that posts lost items on local social media groups?",
    a: "Yes. We create a dedicated lost-item visual (a shareable 'wanted' notice with a photo and a protected contact address) and publish or submit it to relevant local pages and community groups. Our team also manually checks major local Facebook groups, including private communities we are members of.",
  },
  {
    q: "Can I have the internet monitored for several months after losing an item?",
    a: "Yes. Monitoring starts when your plan is activated and runs for 6 months (Standard) or 12 months (Premium). Automated searches combine your item's type, brand, distinctive features, city, neighborhood and date of loss across public web sources, marketplaces and community pages. Monitoring does not cover content that is inaccessible to public search tools.",
  },
  {
    q: "How can a foreign tourist report a lost item in the United States?",
    a: "File your report online in a few minutes — no US address or phone number is needed. We handle the local outreach on the ground and keep you informed by email, wherever you are. A protected relay email address lets finders contact you without exposing your personal address.",
  },
  {
    q: "What should I do if I have already left the United States?",
    a: "You can still start a recovery search. We contact the local offices and venues, publish the social notice, and monitor the web — and if your item is found, we help you coordinate with the finder or the office holding it (many can ship items or hold them for a representative).",
  },
  {
    q: "Can ReportLost file a police report on my behalf?",
    a: "Where a department accepts third-party lost-property reports, we file it for you. When the law requires the owner to file personally, we provide the appropriate official contact details, reporting link and step-by-step instructions instead. ReportLost is an independent service and is not affiliated with any law enforcement agency.",
  },
  {
    q: "How long does ReportLost monitor potential matches?",
    a: "6 months with the Standard plan ($12) and 12 months with the Premium plan ($25), starting the day your plan is activated. The search cadence is highest in the first weeks, when recovery odds are best, then continues at a regular rhythm.",
  },
  {
    q: "What happens when ReportLost finds a possible match?",
    a: "You receive the match by email with a link to the source. On the Premium plan, every potential match is first reviewed by a human before being forwarded, so you only receive credible leads.",
  },
  {
    q: "Does ReportLost guarantee that my item will be recovered?",
    a: "No honest service can guarantee recovery. What we guarantee is the work: the outreach actually performed, the social publication, and the monitoring for the full duration of your plan, with a written trail in your case file.",
  },
  {
    q: "How does ReportLost protect me from lost-item scams?",
    a: "All finder contact goes through a protected ReportLost relay email address, so your personal email is never published. Messages passing through the relay can be reviewed, and we flag common scam patterns (requests for advance fees, gift cards or shipping costs) before you engage.",
  },
];

export default function RecoveryAssistancePage() {
  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Organization",
        "@id": `${BASE}/#organization`,
        name: "ReportLost.org",
        url: BASE,
        email: "support@reportlost.org",
        description:
          "Independent lost-item recovery assistance service for the United States, combining local outreach, social media distribution, human follow-up and up to 12 months of web monitoring.",
      },
      {
        "@type": "Service",
        name: "Lost Item Recovery Assistance (USA)",
        serviceType: "Lost property recovery assistance",
        areaServed: { "@type": "Country", name: "United States" },
        provider: { "@id": `${BASE}/#organization` },
        url: CANONICAL,
        description:
          "Human-assisted lost-item recovery service for items lost in the United States, including local outreach to police and venues, social media distribution, and six- to twelve-month web monitoring with human-verified matches.",
        offers: [
          {
            "@type": "Offer",
            name: "Free listing",
            price: "0",
            priceCurrency: "USD",
            description: "Publish your lost item report online with a protected public listing.",
          },
          {
            "@type": "Offer",
            name: "Standard assistance — 6-month monitoring",
            price: "12",
            priceCurrency: "USD",
            description:
              "Police and local outreach, social media visual, protected relay email, and 6 months of web monitoring.",
          },
          {
            "@type": "Offer",
            name: "Premium assistance — 12-month monitoring",
            price: "25",
            priceCurrency: "USD",
            description:
              "Extended outreach, social media visual, protected relay email, human-verified matches, downloadable QR poster (PDF), and 12 months of web monitoring.",
          },
        ],
      },
      {
        "@type": "FAQPage",
        mainEntity: FAQ.map((f) => ({
          "@type": "Question",
          name: f.q,
          acceptedAnswer: { "@type": "Answer", text: f.a },
        })),
      },
      {
        "@type": "BreadcrumbList",
        itemListElement: [
          { "@type": "ListItem", position: 1, name: "ReportLost.org", item: BASE },
          { "@type": "ListItem", position: 2, name: "Lost Item Recovery Assistance (USA)", item: CANONICAL },
        ],
      },
    ],
  };

  return (
    <main className="bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <div className="mx-auto max-w-4xl space-y-10">
        {/* Hero */}
        <section className="rounded-xl bg-gradient-to-r from-blue-50 to-white p-8 text-center shadow">
          <h1 className="text-3xl font-bold text-gray-900 sm:text-4xl">
            Lost an item in the United States? We help you search for it.
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-lg text-gray-700">
            ReportLost helps travelers and U.S. residents take the right steps after losing an item. Depending on
            the selected plan, our team contacts the relevant local lost-property office, police department,
            transportation service, hotel, venue or business; creates and distributes a targeted social media
            notice; and monitors public web sources using the item description, city, location and date of loss —
            for <strong>6 to 12 months</strong>.
          </p>
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            <Link
              href="/report"
              className="rounded-lg bg-green-600 px-8 py-3 font-bold text-white shadow-md transition hover:bg-green-700"
            >
              Start a Lost Item Search
            </Link>
            <a
              href="#included"
              className="rounded-lg border border-gray-300 bg-white px-8 py-3 font-bold text-gray-700 shadow-sm transition hover:bg-gray-100"
            >
              See What&rsquo;s Included
            </a>
          </div>
          <p className="mt-5 text-sm font-medium text-gray-500">
            Human assistance · Local outreach · 6 to 12-month monitoring
          </p>
        </section>

        {/* Independence disclaimer */}
        <section className="rounded-xl border border-amber-200 bg-amber-50 p-5 text-sm text-amber-900">
          When a police report must legally be filed by the owner, we provide the appropriate official contact
          details, reporting link and instructions. <strong>ReportLost is an independent assistance service and is
          not affiliated with law enforcement agencies, airports or transit authorities.</strong> Official
          lost-and-found offices retain and release found property.
        </section>

        {/* What's included */}
        <section id="included" className="rounded-xl bg-white p-8 shadow">
          <h2 className="text-2xl font-bold text-gray-900">What the service includes</h2>
          <ol className="mt-6 space-y-5 text-gray-700">
            <li>
              <strong>1. Initial case review.</strong> A team member reviews your item description, photos,
              distinctive features, date, time and possible loss locations to build an actionable case file.
            </li>
            <li>
              <strong>2. Official and local outreach.</strong> We identify and contact the relevant municipal
              lost-property office, the police department where appropriate, the transportation provider, and the
              hotels, venues or businesses you mention. The Premium plan extends this outreach to additional
              establishments around your loss location.
            </li>
            <li>
              <strong>3. Social media distribution.</strong> We create a dedicated lost-item visual and publish or
              submit it to relevant local pages and community groups — including manual checks of major local
              Facebook groups we are members of, private communities included.
            </li>
            <li>
              <strong>4. Web monitoring — 6 or 12 months.</strong> Monitoring begins when your plan is activated
              and remains active for 180 days (Standard) or 365 days (Premium). Searches use multiple combinations
              of the item type, brand, distinctive features, city, neighborhood, venue and date of loss across
              public sources. Monitoring does not cover content inaccessible to public search tools.
            </li>
            <li>
              <strong>5. Human verification (Premium).</strong> Potential matches are reviewed by a person before
              being forwarded to you, so you only receive credible leads.
            </li>
            <li>
              <strong>6. Protected contact address.</strong> A dedicated ReportLost relay email is published
              instead of your personal address — finders can always reach you, scammers never learn who you are.
            </li>
          </ol>
        </section>

        {/* Plans */}
        <section className="rounded-xl bg-white p-8 shadow">
          <h2 className="text-2xl font-bold text-gray-900">Plans</h2>
          <div className="mt-6 grid gap-5 md:grid-cols-3">
            <div className="rounded-xl border border-gray-200 p-5">
              <h3 className="text-lg font-bold text-gray-900">Free listing</h3>
              <p className="mt-1 text-2xl font-bold text-gray-900">$0</p>
              <ul className="mt-3 space-y-2 text-sm text-gray-600">
                <li>✔️ Your lost item report published online</li>
                <li>✔️ Public, shareable listing page</li>
              </ul>
            </div>
            <div className="rounded-xl border-2 border-blue-400 p-5">
              <h3 className="text-lg font-bold text-gray-900">Standard assistance</h3>
              <p className="mt-1 text-2xl font-bold text-gray-900">$12</p>
              <ul className="mt-3 space-y-2 text-sm text-gray-600">
                <li>✔️ Police &amp; local lost-property outreach</li>
                <li>✔️ Contact of the establishments you mention</li>
                <li>✔️ Social media visual published</li>
                <li>✔️ Protected relay email address</li>
                <li>
                  ✔️ <strong>6-month</strong> web &amp; social monitoring
                </li>
              </ul>
            </div>
            <div className="rounded-xl border-2 border-green-500 p-5">
              <h3 className="text-lg font-bold text-gray-900">Premium assistance</h3>
              <p className="mt-1 text-2xl font-bold text-gray-900">$25</p>
              <ul className="mt-3 space-y-2 text-sm text-gray-600">
                <li>✔️ Everything in Standard</li>
                <li>✔️ Extended outreach (more establishments contacted)</li>
                <li>
                  ✔️ <strong>12-month</strong> web &amp; social monitoring
                </li>
                <li>✔️ Matches reviewed by a human before you get them</li>
                <li>✔️ Printable QR-code poster (PDF) included</li>
              </ul>
            </div>
          </div>
          <p className="mt-5 text-sm text-gray-600">
            <strong>Pay-what-you-want option:</strong> you can also support your search with a custom contribution.
            Below $12, we still publish your report and the social media notice, and do our best with the time
            available; from $12, your case is handled like a Standard plan.
          </p>
        </section>

        {/* Trust */}
        <section className="rounded-xl bg-white p-8 shadow">
          <h2 className="text-2xl font-bold text-gray-900">How your case is actually worked</h2>
          <p className="mt-4 text-gray-700">
            Every paid case combines four concrete actions. Your report is <strong>filed with the police</strong>{" "}
            and sent to the establishments where the item may have been lost (hotel, venue, transit, businesses
            nearby). A dedicated visual is <strong>published on local social channels</strong> and community
            groups. Our <strong>automated monitoring scans the web for 6 to 12 months</strong>, crossing your
            item&rsquo;s description, location and date against new listings and &ldquo;found&rdquo; posts, so you
            don&rsquo;t have to check every site yourself. And a <strong>real team reviews each case manually</strong>:
            they check incoming reports, run additional searches, and filter potential matches before anything
            reaches your inbox.
          </p>
          <p className="mt-3 text-gray-700">
            We are equally clear about what we don&rsquo;t do: we do not guarantee recovery, we do not access
            non-public data, and we never impersonate officials.
          </p>
        </section>

        {/* FAQ */}
        <section className="rounded-xl bg-white p-8 shadow">
          <h2 className="text-2xl font-bold text-gray-900">Frequently asked questions</h2>
          <div className="mt-5 space-y-3">
            {FAQ.map((f) => (
              <details key={f.q} className="border-b border-gray-100 pb-3">
                <summary className="cursor-pointer font-semibold text-gray-800">{f.q}</summary>
                <p className="mt-2 text-sm text-gray-600">{f.a}</p>
              </details>
            ))}
          </div>
        </section>

        {/* Final CTA */}
        <section className="py-4 text-center">
          <h2 className="text-2xl font-bold text-gray-900">Ready to start the search?</h2>
          <p className="mt-2 text-gray-600">One report. Every relevant channel. Up to 12 months of monitoring.</p>
          <Link
            href="/report"
            className="mt-5 inline-block rounded-lg bg-green-600 px-8 py-3 font-bold text-white shadow-md transition hover:bg-green-700"
          >
            Start a Lost Item Search
          </Link>
        </section>
      </div>
    </main>
  );
}
