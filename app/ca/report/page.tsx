// app/ca/report/page.tsx
// Formulaire de signalement CANADIEN — copie indépendante du formulaire US
// (components/ca/*). Villes canadiennes uniquement, prix en CA$, paiement en CAD.
// 🔒 noindex tant que les guides canadiens ne sont pas publiés (phase 2).
import type { Metadata } from "next";
import CaClientReportForm from "@/components/ca/CaClientReportForm";

export const metadata: Metadata = {
  title: "Report a Lost Item in Canada",
  description:
    "Submit a lost item report for a Canadian city. You can review the available search options, priced in Canadian dollars, after submitting your report.",
  alternates: { canonical: "https://reportlost.org/ca/report" },
  robots: { index: false, follow: true },
};

export default function CaReportPage({
  searchParams,
}: {
  searchParams?: { category?: string; city?: string };
}) {
  const initialCategory = (searchParams?.category || "").trim().toLowerCase() || undefined;

  return (
    <main className="w-full">
      <section className="mx-auto max-w-4xl px-4 pt-8 pb-10 sm:pt-10 sm:pb-12">
        <h1 className="text-2xl font-bold text-gray-900">Report a lost item in Canada</h1>
        <p className="mt-2 text-gray-700">
          Add details about the item and where it was last seen. You can review the available
          search options, priced in Canadian dollars, after submitting your report.
        </p>
      </section>
      <CaClientReportForm
        defaultCity={(searchParams?.city || "").trim()}
        initialTab="lost"
        compact
        initialCategory={initialCategory}
      />
    </main>
  );
}
