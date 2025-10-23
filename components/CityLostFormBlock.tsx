"use client";

import { useMemo, useState } from "react";
import dynamic from "next/dynamic";

const ClientReportForm = dynamic(
  () => import("@/components/ClientReportForm").then((m) => m.default),
  { ssr: false }
);

export default function CityLostFormBlock({
  defaultCity,
  titleSection,
  recentAndMapSection,
  extraBelowForm,
}: {
  defaultCity: string;
  titleSection: React.ReactNode;        // bloc titre au-dessus
  recentAndMapSection: React.ReactNode; // bloc “Recently + Map”
  extraBelowForm?: React.ReactNode;     // contenu plus bas (optionnel)
}) {
  const [step, setStep] = useState(1);

  // À partir de l’étape 3 (« what happens next »), on masque visuellement.
  const hideCityContent = step >= 3;

  // Style d’occultation « accessible » : contenu toujours présent dans le DOM
  const hiddenStyle = useMemo<React.CSSProperties>(
    () =>
      hideCityContent
        ? {
            position: "absolute",
            left: "-10000px",
            width: 1,
            height: 1,
            overflow: "hidden",
          }
        : {},
    [hideCityContent]
  );

  return (
    <>
      {/* Sections ville au-dessus du formulaire — TOUJOURS rendues (SSR) */}
      <div
        data-seo-top
        aria-hidden={hideCityContent}
        style={hiddenStyle}
      >
        {titleSection}
        {recentAndMapSection}
      </div>

      {/* Le formulaire */}
      <ClientReportForm
        defaultCity={defaultCity}
        initialTab="lost"
        onStepChangeExternal={setStep} // récupère le step
      />

      {/* Sections en-dessous (optionnelles) — TOUJOURS rendues */}
      {extraBelowForm && (
        <div
          data-seo-bottom
          aria-hidden={hideCityContent}
          style={hiddenStyle}
        >
          {extraBelowForm}
        </div>
      )}

      {/* Fallback si JS désactivé : tout reste visible */}
      <noscript>
        <div>
          {titleSection}
          {recentAndMapSection}
          {extraBelowForm}
        </div>
      </noscript>
    </>
  );
}
