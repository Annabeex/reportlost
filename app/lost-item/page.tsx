'use client';

import ReportForm from '../../components/ReportForm';

export default function Page() {
  return (
    <main className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-4">Lost an Item?</h1>
      <p className="mb-6">
        Describe your lost item as clearly and precisely as possible. This will help our team process your report and contact relevant services.
      </p>
      <ReportForm defaultCity="new-york" />
    </main>
  );
}
