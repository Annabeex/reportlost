'use client';

import { useEffect, useState } from "react";
import dynamic from "next/dynamic";

const ReportForm = dynamic(() => import("./ReportForm").then(m => m.default), { ssr: false });
const FoundItemsForm = dynamic(() => import("./FoundItemsForm").then(m => m.default), { ssr: false });

type Props = {
  defaultCity?: string;
  initialTab?: "lost" | "found";
};

export default function ClientReportForm({
  defaultCity = "",
  initialTab = "lost",
}: Props) {
  const [activeTab, setActiveTab] = useState<"lost" | "found">(initialTab);

  useEffect(() => {
    setActiveTab(initialTab);
  }, [initialTab]);

  return (
    <section className="bg-blue-100 py-12 px-6 sm:px-8 lg:px-12 rounded-xl shadow">
      <div className="max-w-5xl mx-auto">
        {/* Bloc blanc plus large, comme sur la page /report */}
        <div className="bg-white rounded-xl shadow-md p-10 sm:p-12 lg:p-14">
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
