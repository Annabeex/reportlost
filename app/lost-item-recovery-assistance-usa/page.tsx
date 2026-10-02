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
    "Create a free lost-item listing, add six months of automatic monitoring for $12, or choose $25 team-assisted search with manual research and local outreach.",
  alternates: { canonical: CANONICAL },
  openGraph: {
    title: "Lost Item Recovery Assistance in the USA | ReportLost",
    description:
      "Create a free listing, add six months of automatic monitoring for $12, or choose team-assisted search for $25 with manual research, direct service contact, and 12 months of monitoring.",
    url: CANONICAL,
    siteName: "ReportLost.org",
    type: "website",
  },
};

const FAQ: { q: string; a: string }[] = [
  {
    q: "Is there a service that can help me recover an item lost in the United States?",
    a: "Yes. ReportLost.org is an independent service for items lost anywhere in the United States. A free option publishes a public listing. The $12 automatic search includes six months of public-web monitoring, a dated ReportLost certificate, an anonymous email address linked to the report, and printable QR stickers linked to that address. The $25 team-assisted search adds manual research, direct contact with relevant services, report submission, local social sharing, and 12 months of monitoring.",
  },
  {
    q: "Can someone contact the police and local businesses about my lost item?",
    a: "With team-assisted search, a team member researches the report, contacts relevant lost-property offices and venues, and submits the report to appropriate services. Each organization controls its own process.",
  },
  {
    q: "Can someone contact a hotel, restaurant or venue where I lost something?",
    a: "Include the places you visited in your report. With team-assisted search, we identify relevant offices and likely venues and contact them where appropriate.",
  },
  {
    q: "Is there a service that posts lost items on local social media groups?",
    a: "The team-assisted search includes sharing a visual notice with relevant local pages and community groups, using the anonymous address linked to the report. The groups available vary by location and their posting rules.",
  },
  {
    q: "Can I have the internet monitored for several months after losing an item?",
    a: "Automatic search for $12 includes six months of public-web monitoring. Team-assisted search for $25 includes 12 months. Automated searches use details such as item type, brand, distinctive features, city, neighborhood and date of loss across public web sources. Monitoring does not cover content inaccessible to public search tools.",
  },
  {
    q: "How can a foreign tourist report a lost item in the United States?",
    a: "You can submit a report without a U.S. address or phone number. The $12 option adds six months of automatic monitoring, a ReportLost certificate, an anonymous case address, and QR stickers. The $25 option adds manual research, direct service contact, local social sharing, and 12 months of monitoring.",
  },
  {
    q: "What should I do if I have already left the United States?",
    a: "You can still submit a report from outside the United States. Automatic search includes six months of public-web monitoring. Team-assisted search includes 12 months of monitoring, manual research, direct contact with relevant offices and venues, and local social sharing. Offices and venues set their own rules for collection, shipping and representatives.",
  },
  {
    q: "Can ReportLost file a police report on my behalf?",
    a: "The $25 team-assisted service includes direct contact with relevant lost-property offices and submission of your report to appropriate services. ReportLost is independent and does not file or replace an official police report.",
  },
  {
    q: "How long does ReportLost monitor potential matches?",
    a: "Automatic search for $12 includes six months of public-web monitoring. Team-assisted search for $25 includes 12 months. Searches run daily during the first week, weekly after that, then monthly.",
  },
  {
    q: "What happens when ReportLost finds a possible match?",
    a: "If the monitoring identifies a potential match, you receive an email with a link to the source. The matching system assigns a score, and potential matches are reviewed before notification.",
  },
  {
    q: "Does ReportLost guarantee that my item will be recovered?",
    a: "No. The service description covers the included tasks and monitoring period. Whether an office or venue can respond depends on its own procedures, and recovery cannot be guaranteed.",
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
          "Independent lost-item reporting service in the United States, with free public listings, six-month automatic web monitoring and an optional team-assisted service.",
      },
      {
        "@type": "Service",
        name: "Lost Item Recovery Assistance (USA)",
        serviceType: "Lost property recovery assistance",
        areaServed: { "@type": "Country", name: "United States" },
        provider: { "@id": `${BASE}/#organization` },
        url: CANONICAL,
        description:
          "Lost-item reporting in the United States, with a free listing, six-month automatic search for $12, and $25 team-assisted search with manual research and 12-month monitoring.",
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
            name: "Automatic search — six-month monitoring",
            price: "12",
            priceCurrency: "USD",
            description:
              "Six months of public-web monitoring; reviewed potential matches; a dated ReportLost certificate; a case-specific anonymous email address; and printable QR stickers linked to that address.",
          },
          {
            "@type": "Offer",
            name: "Team-assisted search — 12-month monitoring",
            price: "25",
            priceCurrency: "USD",
            description:
              "Everything in the $12 option, with 12 months of public-web monitoring, manual research, direct contact with relevant services and venues, report submission to appropriate services, and a visual notice shared with relevant local groups under their posting rules.",
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
            Lost-item reporting and search options in the United States
          </h1>
            <p className="mx-auto mt-4 max-w-2xl text-lg text-gray-700">
            Compare a free public listing, six months of automatic public-web monitoring for $12, and team-assisted
            search for $25 with relevant local outreach and 12 months of monitoring.
          </p>
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            <Link
              href="/report"
              className="rounded-lg bg-green-600 px-8 py-3 font-bold text-white shadow-md transition hover:bg-green-700"
            >
              Create a report
            </Link>
            <a
              href="#included"
              className="rounded-lg border border-gray-300 bg-white px-8 py-3 font-bold text-gray-700 shadow-sm transition hover:bg-gray-100"
            >
              See What&rsquo;s Included
            </a>
          </div>
          <p className="mt-5 text-sm font-medium text-gray-500">
            Free listing · $12 automatic search · $25 team-assisted search · One-time fees
          </p>
        </section>

        {/* What's included */}
        <section id="included" className="rounded-xl bg-white p-8 shadow">
          <h2 className="text-2xl font-bold text-gray-900">How team-assisted search works</h2>
          <ol className="mt-6 space-y-5 text-gray-700">
            <li>
              <strong>1. Initial case review.</strong> A team member reviews your item description, photos,
              distinctive features, date, time and possible loss locations to prepare the search.
            </li>
            <li>
              <strong>2. Official and local outreach.</strong> We identify and contact the relevant municipal
              lost-property office, the police department where appropriate, the transportation provider, and the
              hotels, venues or businesses you mention, plus additional establishments around your loss
              location.
            </li>
            <li>
              <strong>3. Local social sharing.</strong> We prepare a visual notice and share it with relevant
              local pages and community groups under their posting rules. Availability varies by location.
            </li>
            <li>
              <strong>4. Web monitoring — 12 months.</strong> Monitoring begins after payment
              and remains active for 365 days, running every day for the first week, then once a week, then
              once a month. Searches use multiple combinations
              of the item type, brand, distinctive features, city, neighborhood, venue and date of loss across
              public sources. Monitoring does not cover content inaccessible to public search tools.
            </li>
            <li>
              <strong>5. Loss report certificate and QR stickers.</strong> A certificate recording your
              declaration and its date is issued on our site and downloadable from your case page — it is not an
              official document and does not replace a police report. You also receive a printable sheet of QR
              stickers, each routing a finder to your anonymous relay address.
            </li>
            <li>
              <strong>6. Match review.</strong> Potential matches are scored by our matching system and reviewed
              before notification.
            </li>
            <li>
              <strong>7. Protected contact address.</strong> A dedicated ReportLost relay email is published
              instead of your personal address, so finders can contact you without seeing your email address.
            </li>
          </ol>
        </section>

        {/* Report options */}
        <section id="plans" className="rounded-xl bg-white p-8 shadow">
          <h2 className="text-2xl font-bold text-gray-900">Report options</h2>
          <div className="mt-6 grid gap-5 md:grid-cols-3">
            <div className="rounded-xl border border-gray-200 p-5">
              <h3 className="text-lg font-bold text-gray-900">Free listing</h3>
              <p className="mt-1 text-2xl font-bold text-gray-900">$0</p>
              <ul className="mt-3 space-y-2 text-sm text-gray-600">
                <li>✔️ Your lost item report published online</li>
                <li>✔️ Public, shareable listing page</li>
                <li>
                  ➖ Does not include team outreach or public-web monitoring
                </li>
              </ul>
            </div>
            <div className="rounded-xl border border-gray-200 p-5">
              <h3 className="text-lg font-bold text-gray-900">Automatic search</h3>
              <p className="mt-1 text-2xl font-bold text-gray-900">$12</p>
              <ul className="mt-3 space-y-2 text-sm text-gray-600">
                <li>✔️ Six months of public-web monitoring</li>
                <li>✔️ Potential matches reviewed before notification</li>
                <li>✔️ ReportLost certificate (not an official document or police report)</li>
                <li>✔️ Anonymous email address linked to your report and printable QR stickers linked to that address</li>
              </ul>
            </div>
            <div className="rounded-xl border border-gray-200 p-5">
              <h3 className="text-lg font-bold text-gray-900">Team-assisted search</h3>
              <p className="mt-1 text-2xl font-bold text-gray-900">$25</p>
              <ul className="mt-3 space-y-2 text-sm text-gray-600">
                <li>✔️ Everything in Automatic search, with 12 months of monitoring</li>
                <li>✔️ Manual research, direct contact with relevant services and venues, and report submission to appropriate services</li>
                <li>✔️ Visual notice shared with relevant local social groups under their posting rules</li>
                <li>
                  ✔️ Potential matches reviewed before notification
                </li>
                <li>✔️ Dated ReportLost certificate and printable QR stickers linked to the anonymous address</li>
              </ul>
            </div>
          </div>
          <p className="mt-5 text-sm text-gray-600">
            Search options are one-time fees. The ReportLost certificate is not an official document and does not
            replace a police report.
          </p>
        </section>

        {/* Trust */}
        <section className="rounded-xl bg-white p-8 shadow">
          <h2 className="text-2xl font-bold text-gray-900">How your case is actually worked</h2>
          <p className="mt-4 text-gray-700">
            Team-assisted search adds manual research, direct contact with relevant services and venues, submission
            of your report to appropriate lost-property services, and sharing a visual notice with relevant local
            social groups under their posting rules. Public-web monitoring runs for 12 months. Potential matches
            are reviewed before notification.
          </p>
          <p className="mt-3 text-gray-700">
            Recovery is not guaranteed. Monitoring is limited to public-web sources, and ReportLost does not act as a public agency.
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
          <h2 className="text-2xl font-bold text-gray-900">Choose a report option</h2>
          <p className="mt-2 text-gray-600">Free public listing, $12 automatic search, or $25 team-assisted search.</p>
          <Link
            href="/report"
            className="mt-5 inline-block rounded-lg bg-green-600 px-8 py-3 font-bold text-white shadow-md transition hover:bg-green-700"
          >
            Create a report
          </Link>
        </section>
      </div>
    </main>
  );
}
