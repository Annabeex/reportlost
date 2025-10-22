// app/report/page.tsx
import ClientReportForm from '@/components/ClientReportForm';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Report — ReportLost.org',
};

export default function ReportPage({
  searchParams,
}: {
  searchParams?: { tab?: string };
}) {
  const tabParam = (searchParams?.tab || '').toLowerCase();
  const initialTab = tabParam === 'found' ? 'found' : 'lost';

  // Laisse ClientReportForm gérer le visuel, mais on active le mode compact ici
  return (
    <main className="w-full">
      <ClientReportForm defaultCity="" initialTab={initialTab} compact />
    </main>
  );
}
