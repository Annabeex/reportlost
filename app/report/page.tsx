// app/report/page.tsx
import ClientReportForm from '@/components/ClientReportForm';
import type { Metadata } from 'next';

// optionnel: metadata
export const metadata: Metadata = {
  title: 'Report — ReportLost.org',
};

export default function ReportPage({
  searchParams,
}: {
  searchParams?: { tab?: string };
}) {
  // /report?tab=found  -> initialTab = 'found'
  const tabParam = (searchParams?.tab || '').toLowerCase();
  const initialTab = tabParam === 'found' ? 'found' : 'lost';

  // ClientReportForm est un composant client qui accepte `initialTab`
  return (
    <main className="max-w-4xl mx-auto px-4 py-8">
      <ClientReportForm defaultCity="" initialTab={initialTab} />
    </main>
  );
}
