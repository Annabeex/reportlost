// app/report-lost-pet/page.tsx
// Formulaire dédié aux animaux perdus : catégorie pré-remplie et choix d'assistance.
import type { Metadata } from "next";
import Link from "next/link";
import ReportForm from "@/components/ReportForm";

const BASE = "https://reportlost.org";
const CANONICAL = `${BASE}/report-lost-pet`;

export const metadata: Metadata = {
  title: "Report a Lost Pet in the USA | ReportLost",
  description:
    "Create a free public lost-pet report. Optional $25 team-assisted search includes local animal-service outreach and 12 months of public-web monitoring.",
  alternates: { canonical: CANONICAL },
  openGraph: {
    title: "Report a Lost Pet in the USA | ReportLost.org",
    description:
      "Free public lost-pet listing with an optional $25 team-assisted search.",
    url: CANONICAL,
    siteName: "ReportLost.org",
    type: "website",
  },
};

export default function ReportLostPetPage() {
  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Service",
        name: "Lost Pet Team-Assisted Search (USA)",
        serviceType: "Lost pet recovery assistance",
        areaServed: { "@type": "Country", name: "United States" },
        provider: { "@type": "Organization", name: "ReportLost.org", url: BASE },
        url: CANONICAL,
        offers: {
          "@type": "Offer",
          name: "Team-assisted pet search",
          price: "25",
          priceCurrency: "USD",
          description:
            "Outreach to relevant local animal services, notice for local groups, 12-month public-web monitoring, and protected relay email.",
        },
      },
      {
        "@type": "BreadcrumbList",
        itemListElement: [
          { "@type": "ListItem", position: 1, name: "ReportLost.org", item: BASE },
          { "@type": "ListItem", position: 2, name: "Report a Lost Pet", item: CANONICAL },
        ],
      },
    ],
  };

  return (
    <main className="bg-gray-50 py-10 px-4 sm:px-6 lg:px-8">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <div className="mx-auto max-w-4xl space-y-8">
        <section className="text-center">
          <h1 className="text-3xl font-bold text-gray-900 sm:text-4xl">Create a lost-pet report</h1>
          <p className="mx-auto mt-3 max-w-2xl text-lg text-gray-700">
            A public lost-pet listing is free. Optional team-assisted search is a one-time $25 fee and includes
            relevant local animal-service outreach, a notice for local groups, and 12 months of public-web
            monitoring. Recovery cannot be guaranteed.
          </p>
          <p className="mt-3 text-sm text-gray-500">
            You can also use the{" "}
            <Link href="/lost-pet-poster" className="text-blue-600 underline">
              free printable lost pet poster
            </Link>{" "}
            to cover your neighborhood.
          </p>
        </section>

        <section className="rounded-xl bg-white p-4 shadow lg:p-6">
          <ReportForm initialCategory="pets" petMode embedded enforceValidation />
        </section>
      </div>
    </main>
  );
}
