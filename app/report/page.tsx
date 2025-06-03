'use client';

import ReportForm from '../../components/ReportForm';

export default function ReportPage() {
  return (
    <main className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-4">Report a Lost Item</h1>
      <p className="mb-4">Fill out the form below to report your lost item. We will try to help you recover it.</p>
      <ReportForm />
    </main>
  );
}
