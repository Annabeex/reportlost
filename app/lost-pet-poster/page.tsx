// app/lost-pet-poster/page.tsx
// Générateur d'affiche animal perdu — gratuit. Contenu SEO en HTML statique,
// l'outil lui-même est un composant client.
import type { Metadata } from "next";
import Link from "next/link";
import LostPetPosterMaker from "@/components/LostPetPosterMaker";

export const revalidate = 86400;

const BASE = "https://reportlost.org";
const CANONICAL = `${BASE}/lost-pet-poster`;

export const metadata: Metadata = {
  title: "Free Lost Pet Poster Maker — Printable Missing Dog & Cat Flyer",
  description:
    "Create a free, printable lost pet poster in 2 minutes: add your pet's photo, a personal note and a QR code that lets finders email you instantly. Download as PNG or print-ready PDF.",
  alternates: { canonical: CANONICAL },
  openGraph: {
    title: "Free Lost Pet Poster Maker | ReportLost.org",
    description:
      "Make a professional missing dog or cat poster for free — photo, reward, personal note and QR code. Download and print in minutes.",
    url: CANONICAL,
    siteName: "ReportLost.org",
    type: "website",
  },
};

const FAQ = [
  {
    q: "Is the lost pet poster really free?",
    a: "Yes — completely. The poster is generated in your browser: your photo and contact details are never uploaded to our servers, and there is no watermark, signup or hidden fee. You can download it as a PNG image or a print-ready A4 PDF.",
  },
  {
    q: "What should a lost pet poster include?",
    a: "One large, clear photo; the word LOST with the animal type in big letters; the pet's name; breed, color and distinctive marks; where and when it was last seen; a phone number readable from a distance; and ideally a reward and a QR code so finders can contact you instantly.",
  },
  {
    q: "What does the QR code on the poster do?",
    a: "The QR code opens a pre-filled email to the address you enter, so a finder can contact you in two seconds from their phone — even at night, even if they don't want to call a stranger.",
  },
  {
    q: "Where should I put up lost pet posters?",
    a: "Within a 1-mile radius of the last sighting first: intersections, dog parks, vet clinics, pet stores, grocery store boards, mailbox clusters and trailheads. Ask local businesses to display one in their window. Refresh or replace posters after rain.",
  },
  {
    q: "What else should I do besides posters?",
    a: "File a report with your local animal shelter and animal control, check their found listings daily, post on Nextdoor and local Facebook groups, and make sure your pet's microchip registration is up to date. ReportLost can also run this outreach for you and monitor the web for months.",
  },
  {
    q: "Does ReportLost help find lost pets?",
    a: "Yes. Beyond this free poster, our assistance plans include contacting local shelters and services, publishing your alert on social channels including local groups, and monitoring public web sources for new 'found pet' posts for 6 to 12 months.",
  },
];

export default function LostPetPosterPage() {
  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "WebApplication",
        name: "Lost Pet Poster Maker",
        url: CANONICAL,
        applicationCategory: "DesignApplication",
        operatingSystem: "Any (web browser)",
        offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
        description:
          "Free online lost pet poster generator: photo, personal note, reward and QR code, exported as PNG or print-ready PDF.",
        provider: { "@type": "Organization", name: "ReportLost.org", url: BASE },
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
          { "@type": "ListItem", position: 2, name: "Free Lost Pet Poster Maker", item: CANONICAL },
        ],
      },
    ],
  };

  return (
    <main className="bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <div className="mx-auto max-w-6xl space-y-10">
        {/* Hero */}
        <section className="text-center">
          <h1 className="text-3xl font-bold text-gray-900 sm:text-4xl">
            Free Lost Pet Poster Maker — Printable in 2 Minutes
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-lg text-gray-700">
            Add your pet&rsquo;s photo, a personal note and a <strong>QR code that lets finders email you
            instantly</strong>. Download a print-ready poster for free — no signup, no watermark, and your photo
            never leaves your browser.
          </p>
        </section>

        {/* Outil */}
        <section className="rounded-xl bg-white p-6 shadow lg:p-8">
          <LostPetPosterMaker />
        </section>

        {/* Conseils */}
        <section className="rounded-xl bg-white p-8 shadow">
          <h2 className="text-2xl font-bold text-gray-900">What makes a lost pet poster effective</h2>
          <ul className="mt-4 space-y-3 text-gray-700">
            <li>
              <strong>One big photo beats four small ones.</strong> Choose a clear, recent picture where your
              pet&rsquo;s colors and size are obvious.
            </li>
            <li>
              <strong>Readable from a moving car.</strong> The headline and phone number do 90% of the work —
              that&rsquo;s why our template makes them huge.
            </li>
            <li>
              <strong>The QR code removes friction.</strong> Many finders won&rsquo;t call a stranger, but almost
              everyone will scan a code that opens a pre-written email.
            </li>
            <li>
              <strong>Location and date matter.</strong> &ldquo;Last seen near Maple St &amp; 5th Ave on July
              10&rdquo; tells neighbors exactly where to keep an eye out.
            </li>
            <li>
              <strong>Post where people pause:</strong> intersections, dog parks, vet clinics, pet stores, grocery
              boards — and hand a few to mail carriers and delivery drivers, who cover your whole neighborhood
              daily.
            </li>
          </ul>
        </section>

        {/* CTA assistance */}
        <section className="rounded-xl border border-blue-100 bg-blue-50 p-8 text-center">
          <h2 className="text-2xl font-bold text-gray-900">Want us to run the search with you?</h2>
          <p className="mx-auto mt-2 max-w-2xl text-gray-700">
            ReportLost can contact local shelters and services, publish your alert on social channels including
            local community groups, and monitor the web for new &ldquo;found pet&rdquo; posts for months — while
            you cover the neighborhood with posters.
          </p>
          <div className="mt-5 flex flex-wrap justify-center gap-3">
            <Link
              href="/report"
              className="rounded-lg bg-green-600 px-8 py-3 font-bold text-white shadow-md transition hover:bg-green-700"
            >
              Report my lost pet
            </Link>
            <Link
              href="/lost-item-recovery-assistance-usa"
              className="rounded-lg border border-gray-300 bg-white px-8 py-3 font-bold text-gray-700 shadow-sm transition hover:bg-gray-100"
            >
              See how the assistance works
            </Link>
          </div>
        </section>

        {/* FAQ */}
        <section className="rounded-xl bg-white p-8 shadow">
          <h2 className="text-2xl font-bold text-gray-900">Lost pet posters — frequently asked questions</h2>
          <div className="mt-5 space-y-3">
            {FAQ.map((f) => (
              <details key={f.q} className="border-b border-gray-100 pb-3">
                <summary className="cursor-pointer font-semibold text-gray-800">{f.q}</summary>
                <p className="mt-2 text-sm text-gray-600">{f.a}</p>
              </details>
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}
