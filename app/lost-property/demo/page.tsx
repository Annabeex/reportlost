// app/lost-property/demo/page.tsx — tableau de bord de démonstration, sans compte.
//
// Adresse volontairement dans l'espace public : c'est le lien qu'on envoie aux
// commissariats, et « reportlost.org/lost-property/demo » se lit comme le
// service dont on leur parle, là où « /org/demo » décroche.
//
// Pas de collision avec /lost-property/<slug> : Next.js fait toujours primer
// un segment statique sur un segment dynamique, et « demo » figure dans
// RESERVED_SLUGS (lib/orgScope.ts), donc aucun établissement ne peut le
// prendre. Le portail lui-même reste sous /org, séparé des pages publiques.
import type { Metadata } from "next";
import PortalDashboard from "@/components/portal/PortalDashboard";

export const metadata: Metadata = {
  title: "Demo — ReportLost for organizations",
  // Jamais dans Google : la démo est faite pour un lien qu'on envoie.
  robots: { index: false, follow: false },
};

export default function Page() {
  return <PortalDashboard demo />;
}
