import { notFound } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { getPopularCitiesByState } from '@/lib/getPopularCitiesByState';
import { stateNameFromAbbr } from '@/lib/utils'; // ✅
import { buildCityPath } from '@/lib/slugify';
import { generateStaticParams } from './generateStaticParams';
import MaintenanceNotice from '@/components/MaintenanceNotice';

export { generateStaticParams };

type Props = { params: { state: string } };

export async function generateMetadata({ params }: Props) {
  const stateSlug = params.state.toLowerCase(); // abbr en minuscule
  const stateName = stateNameFromAbbr(stateSlug); // ✅

  if (!stateName) {
    return {
      title: 'Lost & Found in the USA',
      description: 'Report and recover lost items in the United States.',
      alternates: { canonical: 'https://reportlost.org/lost-and-found' },
    };
  }

  return {
    title: `Lost & Found in ${stateName} - ReportLost.org`,
    description: `Submit or find lost items in ${stateName}. Our platform helps reconnect lost belongings with their owners through a combination of AI and local networks.`,
    alternates: { canonical: `https://reportlost.org/lost-and-found/${stateSlug}` },
  };
}

export default async function StatePage({ params }: Props) {
  const stateSlug = params.state?.toLowerCase();
  if (!stateSlug) return notFound();

  const stateName = stateNameFromAbbr(stateSlug); // ✅
  if (!stateName) return notFound();

  const stateAbbr = stateSlug.toUpperCase(); // getPopularCitiesByState attend l’abbr en MAJ
  const cities = await getPopularCitiesByState(stateAbbr);
  // Assure-toi que getPopularCitiesByState sélectionne: 'city_ascii, state_id, population'

  return (
    <div className="bg-white px-6 py-10 max-w-5xl mx-auto">
      <h1 className="text-2xl md:text-3xl font-bold text-gray-900 text-center mb-6">
        Lost &amp; Found Services in {stateName}
      </h1>
      <p className="text-gray-700 text-center max-w-2xl mx-auto mb-10">
        Discover how to report or find lost items across major cities in {stateName}. We help you connect with local services, transportation hubs, and more.
      </p>

      <h2 className="text-xl font-semibold text-gray-800 mb-4 text-center">
        Most Populated Cities in {stateName}
      </h2>

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-6 justify-items-center">
        {cities.map((city: any) => (
          <Link
            key={`${city.city_ascii}-${city.state_id ?? stateAbbr}`}
            href={buildCityPath(city.state_id ?? stateAbbr, city.city_ascii)} // ✅ robuste
            className="text-center group transition-transform transform hover:scale-105"
          >
            <Image
              src={`/images/cities/${city.city_ascii.toLowerCase().replace(/\s+/g, '-')}.jpg`}
              alt={city.city_ascii}
              width={120}
              height={120}
              className="rounded-full object-cover mx-auto shadow w-[120px] h-[120px]"
            />
            <p className="text-sm font-medium mt-2 text-gray-700 group-hover:text-blue-600">
              {city.city_ascii}
            </p>
          </Link>
        ))}
      </div>

      {cities.length === 0 && (
        <MaintenanceNotice
          message={`We're still working on listing lost & found services for all cities in ${stateName}. Please check back soon!`}
        />
      )}
    </div>
  );
}
