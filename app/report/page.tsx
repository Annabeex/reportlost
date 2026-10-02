// app/report/page.tsx
import ClientReportForm from "@/components/ClientReportForm";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Report a Lost Item",
  description:
    "Use this form to submit a lost item report and share key details to help the search process.",

  // Les variantes ?tab=... sont regroupées par la balise canonique ci-dessous :
  // inutile d'ajouter un noindex, qui supprimerait la page des résultats au
  // lieu de dédoublonner ses variantes.

  // ✅ consolide toutes les variantes sur une URL canonique
  alternates: {
    canonical: "https://reportlost.org/report",
  },
};

export default function ReportPage({
  searchParams,
}: {
  searchParams?: { tab?: string; category?: string; city?: string; item?: string };
}) {
  const tabParam = (searchParams?.tab || "").toLowerCase();
  const initialTab = tabParam === "found" ? "found" : "lost";

  // Catégorie à pré-remplir (ex: wallet, keys, phone…)
  const initialCategory =
    (searchParams?.category || "").trim().toLowerCase() || undefined;

  return (
    <main className="w-full">
      <section className="mx-auto max-w-4xl px-4 pt-8 sm:pt-10">
        <h1 className="text-2xl font-bold text-gray-900">Create a lost-item report</h1>
        <p className="mt-2 text-gray-700">
          A public listing is free. The $12 option adds six months of automatic monitoring, a ReportLost certificate, an anonymous address linked to the report, and printable QR stickers. The $25 option adds manual research, direct service contact, local social sharing, and 12 months of monitoring.
        </p>
        <p className="mt-2 text-sm text-gray-600">
          ReportLost is independent of public agencies. Recovery cannot be guaranteed, and each office controls its own process.
        </p>
      </section>
      <ClientReportForm
        // Pré-remplissage venu de l'amorce des pages villes (?city=…&item=…).
        // L'objet est lu directement dans l'URL par ReportForm.
        defaultCity={(searchParams?.city || "").trim()}
        initialTab={initialTab}
        compact
        initialCategory={initialCategory}
      />
    </main>
  );
}
