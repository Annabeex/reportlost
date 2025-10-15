'use client';

import { useEffect, useState } from "react";
import dynamic from "next/dynamic";

// Chargement dynamique pour éviter les soucis SSR
const ReportForm = dynamic(() => import("./ReportForm").then(m => m.default), { ssr: false });
const FoundItemsForm = dynamic(() => import("./FoundItemsForm").then(m => m.default), { ssr: false });

type Props = {
  /** Pré-remplit la ville (pages villes) */
  defaultCity?: string;
  /** Choisit quel formulaire afficher : "lost" (par défaut) ou "found" */
  initialTab?: "lost" | "found";
};

export default function ClientReportForm({
  defaultCity = "",
  initialTab = "lost",
}: Props) {
  // état pour suivre le formulaire affiché
  const [activeTab, setActiveTab] = useState<"lost" | "found">(initialTab);

  useEffect(() => {
    setActiveTab(initialTab);
  }, [initialTab]);

  return (
    // ✅ Pas de bleu sur mobile, bleu uniquement ≥ sm
    <section className="bg-transparent sm:bg-blue-100 py-6 sm:py-12 px-2 sm:px-6 lg:px-8 rounded-none sm:rounded-xl">
      <div className="max-w-5xl mx-auto">
        {/* ✅ Marges internes réduites sur mobile, confortables ≥ sm */}
        <div className="bg-white rounded-xl shadow-md p-4 sm:p-10 lg:p-12">
          {activeTab === "lost" && (
            <ReportForm defaultCity={defaultCity} enforceValidation />
          )}
          {activeTab === "found" && (
            <FoundItemsForm defaultCity={defaultCity} />
          )}
        </div>
      </div>
    </section>
  );
}
