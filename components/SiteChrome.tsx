"use client";
// components/SiteChrome.tsx
//
// La navbar et le pied de page de reportlost.org n'ont rien à faire sur les
// écrans des établissements, et pour deux raisons différentes :
//
//   • les PORTAILS (/org, /campus) : un agent derrière un comptoir n'a pas
//     besoin de « I lost something / I found something », et deux barres
//     superposées donnaient l'impression d'être sur deux sites à la fois ;
//
//   • les PAGES PUBLIQUES (/lost-property/<slug>, /campus/<slug>, /at/<slug>) :
//     c'est la page du commissariat ou de l'université, pas une rubrique de
//     reportlost.org. Un visiteur qui arrive par le QR code de l'accueil doit
//     voir le nom de l'établissement, pas une invitation à utiliser un autre
//     service. Elles portent leur propre en-tête et leur propre pied de page
//     (components/orgPublic/ListPage.tsx), avec une mention discrète de
//     ReportLost en bas, qui suffit.
//
// /at/* reste listé : les anciennes adresses redirigent, mais tant qu'un lien
// imprimé circule, mieux vaut que la page de transit ait la même allure.

import { usePathname } from "next/navigation";

const SANS_CHROME = /^\/(org|campus|lost-property|at)(\/|$)/;

export default function SiteChrome({ children }: { children: React.ReactNode }) {
  const pathname = usePathname() || "";
  if (SANS_CHROME.test(pathname)) return null;
  return <>{children}</>;
}
