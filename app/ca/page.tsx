// app/ca/page.tsx
// Hub Canada, anglais. PHASE 1 : page de test en noindex (routage + hreflang).
// Aucun lien entrant depuis le site US tant que la phase 2 n'est pas publiée.
// Composant serveur : rien de lourd côté client (Core Web Vitals).
import type { Metadata } from "next";
import Link from "next/link";
import { caBilingualAlternates } from "@/lib/canada/canadaData";

export const metadata: Metadata = {
  title: "Lost and Found in Canada",
  description:
    "Lost and found services in Canadian cities: the police services, transit operators and airports that handle lost property, with their official procedures.",
  alternates: caBilingualAlternates("en", "/ca", "/ca/fr"),
  // 🔒 Phase 1 : page de test. Passer à l'index seulement en phase 2.
  robots: { index: false, follow: true },
};

export default function CanadaHubEn() {
  return (
    <div lang="en-CA" className="max-w-3xl mx-auto px-4 py-12">
      <p className="text-sm text-gray-500 mb-6">
        <Link href="/ca/fr" hrefLang="fr-CA" prefetch={false} className="underline">
          Français
        </Link>
      </p>
      <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-4">
        Lost and Found in Canada
      </h1>
      <p className="text-gray-700 mb-4">
        ReportLost is preparing its Canadian pages. A city page is published only once its
        guide is complete: the police service, transit operator and airport that handle lost
        property in that city, with their official contact details and procedures.
      </p>
      <p className="text-gray-700 mb-8">
        Pages for cities in Quebec are published in French and in English.
      </p>
      <p className="text-sm text-gray-600">
        For the United States, see{" "}
        <Link href="/lost-and-found" prefetch={false} className="underline">
          lost and found services by state
        </Link>
        .
      </p>
    </div>
  );
}
