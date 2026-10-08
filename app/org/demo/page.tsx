// app/org/demo/page.tsx — tableau de bord de démonstration, sans compte.
// Même écran que /org/dashboard : les lectures viennent de /api/org/demo,
// les écritures ne sortent pas du navigateur (voir lib/portalDemo.ts).
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
