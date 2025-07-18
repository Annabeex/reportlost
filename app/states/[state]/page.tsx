import { notFound } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { getPopularCitiesByState } from '@/lib/getPopularCitiesByState';
import { stateNameFromSlug } from '@/lib/utils'; // ✅ version qui accepte les slugs comme "new-york"
import { getSlugFromCity } from '@/lib/getSlugFromCity';
import { generateStaticParams } from './generateStaticParams';
import MaintenanceNotice from '@/components/MaintenanceNotice';

export { generateStaticParams };

type Props = {
  params: {
    state: string;
  };
};

export async function generateMetadata({ params }: Props) {
  const stateSlug = params.state.toLowerCase(); // ✅ garder en slug
  const stateName = stateNameFromSlug(stateSlug);

  if (!stateName) {
    return {
      title: 'Lost & Found in the USA',
      description: 'Report and recover lost items in the United States.',
    };
  }

  return {
    title: `Lost & Found in ${stateName} - ReportLost.org`,
    description: `Submit or find lost items in ${stateName}. Our platform helps reconnect lost belongings with their owners through a combination of AI and local networks.`,
  };
}

export default async function StatePage({ params }: Props) {
  const stateSlug = params.state?.toLowerCase(); // ✅ on reste en slug
  if (!stateSlug) return notFound();

  const stateName = stateNameFromSlug(stateSlug);
  if (!stateName) return notFound();

  const stateAbbr = stateSlug.toUpperCase(); // ⚠️ si tes fonctions comme getPopularCitiesByState attendent un abbr (ex: "NY")

  const cities = await getPopularCitiesByState(stateAbbr);

  return (
    <div className="bg-white px-6 py-10 max-w-5xl mx-auto">
      <h1 className="text-2xl md:text-3xl font-bold text-gray-900 text-center mb-6">
        Lost & Found Services in {stateName}
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
            key={city.city}
            href={`/lost-and-found/${getSlugFromCity(city.city_ascii, city.zipcode)}`}
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
