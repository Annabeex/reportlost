// app/report-lost-pet/page.tsx
// Formulaire dédié aux animaux perdus : catégorie pré-remplie + formule unique
// Pet Priority (30$). Contenu SEO en HTML statique autour du formulaire.
import type { Metadata } from "next";
import Link from "next/link";
import ReportForm from "@/components/ReportForm";

const BASE = "https://reportlost.org";
const CANONICAL = `${BASE}/report-lost-pet`;

export const metadata: Metadata = {
  title: "Report a Lost Pet in the USA — Priority Search | ReportLost",
  description:
    "Lost your dog or cat? File a priority report: we contact local shelters, animal control and rescue services, post in local lost pet groups including private ones, and your report stays active for 12 months.",
  alternates: { canonical: CANONICAL },
  openGraph: {
    title: "Report a Lost Pet in the USA | ReportLost.org",
    description:
      "Priority handling for lost pets: shelters and animal control contacted, alert posted in local groups, report active for 12 months.",
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
        name: "Lost Pet Priority Search (USA)",
        serviceType: "Lost pet recovery assistance",
        areaServed: { "@type": "Country", name: "United States" },
        provider: { "@type": "Organization", name: "ReportLost.org", url: BASE },
        url: CANONICAL,
        offers: {
          "@type": "Offer",
          name: "Pet Priority search",
          price: "30",
          priceCurrency: "USD",
          description:
            "Priority outreach to local shelters, animal control and rescue services, alert published in local lost pet groups including private communities, 12-month web monitoring, protected relay email.",
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
          <h1 className="text-3xl font-bold text-gray-900 sm:text-4xl">Lost your pet? We treat it as an emergency.</h1>
          <p className="mx-auto mt-3 max-w-2xl text-lg text-gray-700">
            For a lost animal, the first hours matter more than anything. The Pet Priority search puts a team on
            your case: local shelters, animal control and rescue services contacted, an alert published in local
            lost pet groups, <strong>including private communities</strong>, and 12 months of web monitoring. File
            your report below, then keep searching nearby, we take care of the rest.
          </p>
          <p className="mt-3 text-sm text-gray-500">
            Also grab the{" "}
            <Link href="/lost-pet-poster" className="text-blue-600 underline">
              free printable lost pet poster
            </Link>{" "}
            to cover your neighborhood.
          </p>
        </section>

        <section className="rounded-xl bg-white p-4 shadow lg:p-6">
          <ReportForm initialCategory="pets" petMode embedded />
        </section>
      </div>
    </main>
  );
}
