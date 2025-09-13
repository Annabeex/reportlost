// app/lost-and-found/[state]/page.tsx
import { notFound } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';

import { getPopularCitiesByState } from '@/lib/getPopularCitiesByState';
import { stateNameFromAbbr } from '@/lib/utils';     // ex: 'ca' -> 'California'
import { buildCityPath } from '@/lib/slugify';       // ex: (CA, "Los Angeles") -> /lost-and-found/ca/los-angeles
import MaintenanceNotice from '@/components/MaintenanceNotice';
import cityImages from '@/data/cityImages.json';

export { generateStaticParams } from './generateStaticParams';

type Props = { params: { state: string } };

// ---------- helpers Option B ----------
function cityToSlug(name: string) {
  return name.toLowerCase().replace(/\s+/g, '-');
}

/**
 * Retourne le chemin d'image pour une ville si elle fait partie
 * des 6 villes prévues de l'État (via cityImages.byState) ou présente
 * dans cityImages.available ; sinon renvoie le fallback.
 */
function getCityImage(stateAbbr: string, cityName: string) {
  const slug = cityToSlug(cityName);
  const byState: Record<string, string[]> | undefined =
    (cityImages as any).byState;

  const available: string[] | undefined = (cityImages as any).available;

  const listedInState = byState?.[stateAbbr]?.includes(slug);
  const listedGlobally = available?.includes(slug);

  const hasPlannedImage = listedInState || listedGlobally;

  return hasPlannedImage
    ? `/images/cities/${slug}.webp`
    : '/images/cities/default.jpg';
}
// -------------------------------------

// Métadonnées par État
export async function generateMetadata({ params }: Props) {
  const stateSlug = (params.state || '').toLowerCase(); // ex: 'ca'
  const stateName = stateNameFromAbbr(stateSlug);       // ex: 'California'

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
  // slug param = abréviation en minuscule (ex: 'ca')
  const stateSlug = (params.state || '').toLowerCase();
  if (!stateSlug) return notFound();

  const stateName = stateNameFromAbbr(stateSlug);
  if (!stateName) return notFound();

  // getPopularCitiesByState attend l’abréviation en MAJ (ex: 'CA')
  const stateAbbr = stateSlug.toUpperCase();

  // Doit renvoyer au minimum: city_ascii, state_id, population
  const cities = await getPopularCitiesByState(stateAbbr);

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
        {cities.map((city: any) => {
          const stateForPath = city.state_id ?? stateAbbr; // sécurité si state_id n'est pas renvoyé
          const imgSrc = getCityImage(stateAbbr, city.city_ascii);

          return (
            <Link
              key={`${city.city_ascii}-${stateForPath}`}
              href={buildCityPath(stateForPath, city.city_ascii)}
              className="text-center group transition-transform transform hover:scale-105"
            >
              <Image
                src={imgSrc}
                alt={city.city_ascii}
                width={120}
                height={120}
                className="rounded-full object-cover mx-auto shadow w-[120px] h-[120px]"
              />
              <p className="text-sm font-medium mt-2 text-gray-700 group-hover:text-blue-600">
                {city.city_ascii}
              </p>
            </Link>
          );
        })}
      </div>

      {cities.length === 0 && (
        <MaintenanceNotice
          message={`We're still working on listing lost & found services for all cities in ${stateName}. Please check back soon!`}
        />
      )}
    </div>
  );
}
