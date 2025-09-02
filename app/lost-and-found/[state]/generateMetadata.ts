import type { Metadata } from 'next';
import { stateNameFromSlug } from '@/lib/utils';

export default async function generateMetadata(
  { params }: { params: { state: string } }
): Promise<Metadata> {
  const stateSlug = (params.state || '').toLowerCase();
  const stateName = stateNameFromSlug(stateSlug);

  if (!stateName) {
    return {
      title: 'Lost & Found in the USA - ReportLost.org',
      description: 'Report and recover lost items in the United States.',
      alternates: { canonical: 'https://reportlost.org/lost-and-found' },
    };
  }

  return {
    title: `Lost & Found in ${stateName} - ReportLost.org`,
    description: `Submit or find lost items in ${stateName}. Our platform helps reconnect lost belongings with their owners.`,
    alternates: { canonical: `https://reportlost.org/lost-and-found/${stateSlug}` },
  };
}
