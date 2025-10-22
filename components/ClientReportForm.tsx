// components/ClientReportForm.tsx
"use client";

import { useEffect, useState } from "react";
import dynamic from "next/dynamic";

const ReportForm = dynamic(() => import("./ReportForm").then(m => m.default), { ssr: false });
const FoundItemsForm = dynamic(() => import("./FoundItemsForm").then(m => m.default), { ssr: false });

type Props = {
  defaultCity?: string;
  initialTab?: "lost" | "found";
  /** relaie le step courant au parent (utile pour masquer le reste de la page ville) */
  onStepChangeExternal?: (step: number) => void;
  /** NEW: version plus étroite (pour la page /report uniquement) */
  compact?: boolean;
};

export default function ClientReportForm({
  defaultCity = "",
  initialTab = "lost",
  onStepChangeExternal,
  compact = false,
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

  // Rendu avec les marges “comme avant”.
  return (
    <section className="bg-transparent sm:bg-blue-100 py-6 sm:py-12 px-2 sm:px-6 lg:px-8 rounded-none sm:rounded-xl">
      <div className={compact ? "max-w-4xl mx-auto" : "max-w-5xl mx-auto"}>
        <div className="bg-white rounded-xl shadow-md p-4 sm:p-10 lg:p-12">
          {activeTab === "lost" ? (
            <ReportForm
              defaultCity={defaultCity}
              enforceValidation
              onStepChange={setCurrentStep}
            />
          ) : (
            <FoundItemsForm defaultCity={defaultCity} />
          )}
        </div>
      </div>
    </section>
  );
}
