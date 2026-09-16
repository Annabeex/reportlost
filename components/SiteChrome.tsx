"use client";
// components/SiteChrome.tsx
//
// La navbar et le pied de page du site public n'ont rien à faire dans les
// portails établissements : un agent derrière un comptoir n'a pas besoin de
// « I lost something / I found something », et ces deux barres superposées
// donnaient l'impression d'être sur deux sites à la fois.
//
// Les portails ont leur propre en-tête (components/portal/PortalNav.tsx).

import { usePathname } from "next/navigation";

const PORTAL = /^\/(org|campus)(\/|$)/;

export default function SiteChrome({ children }: { children: React.ReactNode }) {
  const pathname = usePathname() || "";
  if (PORTAL.test(pathname)) return null;
  return <>{children}</>;
}
