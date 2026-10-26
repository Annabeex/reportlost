// app/ca/fr/page.tsx
// Hub Canada, français. PHASE 1 : page de test en noindex (routage + hreflang).
// Jumelle réciproque de app/ca/page.tsx.
//
// Limite connue : <html lang="en"> est fixé par app/layout.tsx. Le changer par
// route imposerait des layouts racine multiples (refonte risquée). Google ne
// s'appuie pas sur l'attribut lang pour détecter la langue (contenu + hreflang) ;
// le lang="fr-CA" ci-dessous sert aux lecteurs d'écran.
import type { Metadata } from "next";
import Link from "next/link";
import { caBilingualAlternates } from "@/lib/canada/canadaData";

export const metadata: Metadata = {
  title: "Objets perdus et trouvés au Canada",
  description:
    "Objets perdus et trouvés dans les villes canadiennes : les services de police, sociétés de transport et aéroports qui les gèrent, avec leurs procédures officielles.",
  alternates: caBilingualAlternates("fr", "/ca", "/ca/fr"),
  // 🔒 Phase 1 : page de test. Passer à l'index seulement en phase 3.
  robots: { index: false, follow: true },
};

export default function CanadaHubFr() {
  return (
    <div lang="fr-CA" className="max-w-3xl mx-auto px-4 py-12">
      <p className="text-sm text-gray-500 mb-6">
        <Link href="/ca" hrefLang="en-CA" prefetch={false} className="underline">
          English
        </Link>
      </p>
      <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-4">
        Objets perdus et trouvés au Canada
      </h1>
      <p className="text-gray-700 mb-4">
        ReportLost prépare ses pages canadiennes. Une page de ville n&apos;est publiée
        qu&apos;une fois son guide complet&nbsp;: le service de police, la société de transport
        et l&apos;aéroport qui gèrent les objets trouvés dans cette ville, avec leurs
        coordonnées et leurs procédures officielles.
      </p>
      <p className="text-gray-700">
        Les pages des villes du Québec sont publiées en français et en anglais.
      </p>
    </div>
  );
}
