"use client";

import { useState } from "react";
import dynamic from "next/dynamic";

const ClientReportForm = dynamic(
  () => import("@/components/ClientReportForm").then(m => m.default),
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

  const hideCityContent = step >= 3; // ⬅️ masque tout le reste dès WhatHappensNext

  return (
    <>
      {/* Sections ville au-dessus du formulaire */}
      {!hideCityContent && (
        <>
          {titleSection}
          {recentAndMapSection}
        </>
      )}

      {/* Le formulaire (inchangé) */}
      <ClientReportForm
        defaultCity={defaultCity}
        initialTab="lost"
        onStepChangeExternal={setStep} // ⬅️ récupère le step
      />

      {/* Sections en-dessous (si tu en as) */}
      {!hideCityContent && extraBelowForm}
    </>
  );
}
