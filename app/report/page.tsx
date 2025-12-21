// app/report/page.tsx
import ClientReportForm from "@/components/ClientReportForm";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Report a Lost Item",
  description:
    "Use this form to submit a lost item report and share key details to help the search process.",

  // ✅ évite que /report et toutes ses variantes ?tab=... soient indexées
  // (sinon ton outil SEO te remontera des doublons + risque de contenu dupliqué)
  robots: {
    index: false,
    follow: true,
  },

  // ✅ consolide toutes les variantes sur une URL canonique
  alternates: {
    canonical: "https://reportlost.org/report",
  },
};

export default function ReportPage({
  searchParams,
}: {
  searchParams?: { tab?: string; category?: string };
}) {
  const tabParam = (searchParams?.tab || "").toLowerCase();
  const initialTab = tabParam === "found" ? "found" : "lost";

  // Catégorie à pré-remplir (ex: wallet, keys, phone…)
  const initialCategory =
    (searchParams?.category || "").trim().toLowerCase() || undefined;

  return (
    <main className="w-full">
      <ClientReportForm
        defaultCity=""
        initialTab={initialTab}
        compact
        initialCategory={initialCategory}
      />
    </main>
  );
}
