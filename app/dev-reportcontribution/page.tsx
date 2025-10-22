"use client";

import ReportContribution from "@/components/ReportContribution";

export default function DevReportContributionPage() {
  const fakeFormData = { contribution: 20 };

  return (
    <div className="min-h-screen bg-gray-50 p-8">

      <ReportContribution
        amount={20}
        contribution={20}
        setFormData={(fn) => console.log("setFormData", fn)}
        onBack={() => alert("Back")}
        onNext={() => alert("Next")}
      />
    </div>
  );
}
