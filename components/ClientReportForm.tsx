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
// La hauteur ci-dessous couvre l'étape 1 sur un téléphone. Si l'écran sautait
// encore un peu, c'est le seul nombre à ajuster.
const HAUTEUR_FORMULAIRE = "min-h-[620px] sm:min-h-[560px]";

function Squelette() {
  return (
    <div className={`${HAUTEUR_FORMULAIRE} animate-pulse space-y-5`} aria-hidden="true">
      <div className="h-5 w-2/5 rounded bg-gray-200" />
      {[0, 1, 2, 3].map((i) => (
        <div key={i} className="space-y-2">
          <div className="h-3.5 w-1/3 rounded bg-gray-200" />
          <div className="h-12 rounded-xl bg-gray-100" />
        </div>
      ))}
      <div className="h-12 rounded-xl bg-gray-200" />
    </div>
  );
}

const ReportForm = dynamic(() => import("./ReportForm").then(m => m.default), {
  ssr: false,
  loading: () => <Squelette />,
});
const FoundItemsForm = dynamic(() => import("./FoundItemsForm").then(m => m.default), {
  ssr: false,
  loading: () => <Squelette />,
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
