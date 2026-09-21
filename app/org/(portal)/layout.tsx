// app/org/layout.tsx — rend le portail installable sur l'écran d'accueil
// d'un téléphone (« Ajouter à l'écran d'accueil ») : une icône, une ouverture
// plein écran sur l'inventaire. Pas d'application à publier ni à mettre à jour.
import type { Metadata, Viewport } from "next";

export const metadata: Metadata = {
  manifest: "/portal/org.webmanifest",
  appleWebApp: { capable: true, title: "Lost & Found", statusBarStyle: "default" },
  icons: { apple: "/portal/apple-touch-icon.png" },
};

export const viewport: Viewport = { themeColor: "#26723e" };

export default function PortalLayout({ children }: { children: React.ReactNode }) {
  return children;
}
