// components/ClientReportForm.tsx
"use client";

import { useEffect, useState } from "react";
import dynamic from "next/dynamic";

// ⚠️ Le formulaire reste en ssr:false — il lit l'URL et le stockage local au
// premier rendu, un rendu serveur produirait un HTML qui ne correspond pas.
// MAIS il doit réserver sa place : sans `loading`, le serveur envoie une carte
// blanche vide, le formulaire arrive ~400 px plus tard, et tout ce qui suit
// descend d'un coup. C'est exactement le défaut corrigé sur les pages villes
// (voir l'en-tête de CityLostFormBlock.tsx) ; il était resté sur /report, où
// le formulaire vit réellement. Mesuré chez les visiteurs : CLS p75 0,464.
//
// La réservation est INVISIBLE, volontairement.
//
// Ce qui corrige le CLS, c'est la hauteur occupée, pas ce qu'on y affiche. Une
// première version montrait un squelette gris pulsant : ça ne corrigeait rien
// de plus, et c'était la seule chose que le visiteur voyait changer sur la
// page qui porte toute la conversion. On garde donc la carte blanche d'avant,
// avec sa place déjà prise.
//
// ⚠️ La hauteur vient d'une MESURE, pas d'une estimation.
//
// Relevé sur reportlost.org/report, formulaire monté, étape 1 :
//   375 × 812  (téléphone) → contenu 944 px, carte 968
//   1280 × 900 (bureau)    → contenu 900 px, carte 980
//
// Le chiffre de bureau n'est pas une coïncidence : la racine du formulaire
// porte `min-h-screen`, donc sur grand écran sa hauteur EST celle de la
// fenêtre — 900 px de contenu pour 900 px de fenêtre, min-height calculée à
// 900px. D'où `sm:min-h-screen` ici : la réservation suit exactement la même
// règle que le formulaire, et le décalage est nul quelle que soit la taille
// de la fenêtre.
//
// Sur téléphone le contenu DÉPASSE la hauteur d'écran (944 pour 812), c'est
// donc lui qui commande, et on pose un plancher fixe. 940 est calé sur la
// largeur la plus étroite (375 px) : plus l'écran est large, plus le
// formulaire est court, l'écart résiduel reste de quelques dizaines de pixels
// au lieu des 324 de la première version.
const HAUTEUR_FORMULAIRE = "min-h-[940px] sm:min-h-screen";

const Reservation = () => <div aria-hidden="true" className={HAUTEUR_FORMULAIRE} />;

const ReportForm = dynamic(() => import("./ReportForm").then(m => m.default), {
  ssr: false,
  loading: () => <Reservation />,
});
const FoundItemsForm = dynamic(() => import("./FoundItemsForm").then(m => m.default), {
  ssr: false,
  loading: () => <Reservation />,
});

type Props = {
  defaultCity?: string;
  initialTab?: "lost" | "found";
  /** relaie le step courant au parent (utile pour masquer le reste de la page ville) */
  onStepChangeExternal?: (step: number) => void;
  /** version plus étroite (pour la page /report uniquement) */
  compact?: boolean;
  /** ⬅️ nouvelle prop pour pré-remplir la catégorie */
  initialCategory?: string;
  /** version "intégrée" page ville : formulaire moins haut (enlève min-h-screen) */
  embedded?: boolean;
};

export default function ClientReportForm({
  defaultCity = "",
  initialTab = "lost",
  onStepChangeExternal,
  compact = false,
  initialCategory, // ⬅️ ajouté
  embedded = false,
}: Props) {
  const [activeTab, setActiveTab] = useState<"lost" | "found">(initialTab);
  const [currentStep, setCurrentStep] = useState<number>(1);

  useEffect(() => {
    setActiveTab(initialTab);
  }, [initialTab]);

  // expose le step au parent (ex. pour masquer contenu ville à partir du step >= 3)
  useEffect(() => {
    onStepChangeExternal?.(currentStep);
  }, [currentStep, onStepChangeExternal]);

  return (
    <section
      className={
        embedded
          ? "bg-transparent sm:bg-blue-100 py-2 sm:py-4 px-1 sm:px-4 rounded-none sm:rounded-xl"
          : "bg-transparent sm:bg-blue-100 py-4 sm:py-10 px-1 sm:px-5 lg:px-8 rounded-none sm:rounded-xl"
      }
    >
      <div className={compact ? "max-w-4xl mx-auto" : "max-w-5xl mx-auto"}>
        <div className={embedded ? "bg-white rounded-xl shadow-md p-3 sm:p-5" : "bg-white rounded-xl shadow-md p-3 sm:p-8 lg:p-10"}>
          {activeTab === "lost" ? (
            <ReportForm
              defaultCity={defaultCity}
              enforceValidation
              onStepChange={setCurrentStep}
              // ⬅️ on passe la catégorie au formulaire
              initialCategory={initialCategory}
              embedded={embedded}
            />
          ) : (
            <FoundItemsForm defaultCity={defaultCity} />
          )}
        </div>
      </div>
    </section>
  );
}
