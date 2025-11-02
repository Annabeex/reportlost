// app/report/page.tsx
import ClientReportForm from '@/components/ClientReportForm';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Report — ReportLost.org',
};

export default function ReportPage({
  searchParams,
}: {
  searchParams?: { tab?: string; category?: string };
}) {
  const tabParam = (searchParams?.tab || '').toLowerCase();
  const initialTab = tabParam === 'found' ? 'found' : 'lost';

  // Récupère la catégorie à pré-remplir (ex: wallet, keys, phone…)
  const initialCategory = (searchParams?.category || '').trim().toLowerCase() || undefined;

  return (
    <main className="w-full">
      <ClientReportForm
        defaultCity=""
        initialTab={initialTab}
        compact
        // ⬇️ nouveau prop (optionnel) pour pré-remplir la catégorie
        initialCategory={initialCategory}
      />
    </main>
  );
}
