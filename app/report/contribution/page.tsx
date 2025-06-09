'use client';

import ReportContribution from '../../../components/ReportContribution';

export default function ContributionPage() {
  return (
    <main className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-4">Support Our Work</h1>
      <p className="mb-6">
        Your contribution helps us process your lost item report and increase the chances of it being returned to you.
      </p>
      <ReportContribution />
    </main>
  );
}
