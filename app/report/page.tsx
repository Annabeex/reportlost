'use client';

import ReportForm from '../../components/ReportForm';

export default function ReportPage() {
  return (
    <main className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-4">Report a Lost Item</h1>
      <p className="mb-6">
        Please fill out the form below as accurately as possible. This will help us connect your report with the right
        services and increase your chances of recovering your item.
      </p>
      <ReportForm defaultCity="new-york" />
    </main>
  );
}
