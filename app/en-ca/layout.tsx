// app/en-ca/layout.tsx
// Métadonnées propres au marché Canada anglophone.
// ⚠️ DRAFT : robots noindex tant que le contenu n'est pas prêt. Retirer `robots`
// (ou passer index:true) le jour du lancement Canada.
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: {
    absolute: "ReportLost Canada — Lost & Found Reporting Service",
  },
  description:
    "Report a lost item online in Canada and get routed to the right police service, transit and airport lost & found — across every province.",
  // 🔒 Brouillon : on n'indexe pas encore.
  robots: { index: false, follow: false },
  // Self-canonical (jamais de canonical vers la version US).
  alternates: {
    canonical: "/en-ca",
    languages: {
      "en-us": "/",
      "en-ca": "/en-ca",
    },
  },
  openGraph: {
    title: "ReportLost Canada — Lost & Found",
    url: "https://reportlost.org/en-ca",
    siteName: "ReportLost",
    type: "website",
  },
};

export default function EnCaLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
