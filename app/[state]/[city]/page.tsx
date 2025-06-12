'use client';

import { createClient } from '@supabase/supabase-js';
import ReportForm from '../../../components/ReportForm';
import '../../../app/globals.css';
import Image from 'next/image';
import Link from 'next/link';
import { Search, MapPin, ShieldCheck, Clock, Send, Info } from 'lucide-react';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

interface Props {
  params: { state: string; city: string };
}

function toTitleCase(str: string) {
  return str
    .toLowerCase()
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

export default async function Page({ params }: Props) {
  const rawCity = decodeURIComponent(params.city).replace(/-/g, ' ');
  const rawState = decodeURIComponent(params.state).replace(/-/g, ' ');
  const cityName = toTitleCase(rawCity);
  const stateName = toTitleCase(rawState);

  const { data } = await supabase
    .from('us_cities')
    .select('*')
    .eq('city', cityName)
    .eq('state_name', stateName)
    .order('population', { ascending: false })
    .limit(1);

  const cityData = data?.[0];
  const displayName = cityData?.city || cityName;
  const county = cityData?.county_name;
  const pop = cityData?.population ? cityData.population.toLocaleString() : undefined;
  const density = cityData?.density;
  const timezone = cityData?.timezone;
  const zip = cityData?.zips?.match(/\b\d{5}\b/)?.[0];

  return (
    <main className="bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto space-y-12">
         <section className="text-center">
          <h1 className="text-3xl font-bold text-gray-900">Lost & Found in {displayName}, {stateName}</h1>
          <p className="text-gray-600 mt-2 max-w-xl mx-auto">
            {displayName} is located in {county || 'its county'}. ZIP code: {zip || 'N/A'}. It has approximately {pop || 'many'} residents and a density of {density || 'unknown'} people/km². The city operates in the {timezone || 'local'} timezone.
          </p>
        </section>

        <section className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-2xl font-semibold text-blue-800 mb-4">📝 Report your lost item</h2>
          <p className="text-gray-700 mb-6">Fill out the form below with as many details as possible to increase your chances of recovering the lost item.</p>
          <ReportForm defaultCity={displayName} />
        </section>
        
        <section className="flex flex-col md:flex-row items-center gap-10">
          <div className="w-full md:w-1/2">
            <Image
              src="/images/lost-woman-phone.jpg"
              alt="Femme cherchant un objet perdu"
              width={600}
              height={400}
              className="rounded-lg shadow-md"
            />
          </div>
          <div className="w-full md:w-1/2 space-y-6">
            <h2 className="text-3xl md:text-4xl font-extrabold text-gray-900 leading-snug">
              Que faire si vous avez perdu un objet à <span className="text-blue-700">{displayName}</span> ?
            </h2>

            <div className="space-y-6">
              <div className="border-l-4 border-red-100 pl-4">
                <h3 className="text-xl font-semibold text-gray-800">Identifiez le lieu exact</h3>
                <p className="text-gray-600">
                  Déterminez précisément où vous avez perdu votre objet : rue, transport en commun,
                  commerce, restaurant ou parc. Cette information est cruciale pour cibler vos recherches.
                </p>
              </div>
              <div className="border-l-4 border-red-100 pl-4">
                <h3 className="text-xl font-semibold text-gray-800">Agissez rapidement</h3>
                <p className="text-gray-600">
                  Les premières 24 heures sont déterminantes. Contactez immédiatement les établissements
                  visités et les services concernés pour signaler votre perte.
                </p>
              </div>
              <div className="border-l-4 border-red-100 pl-4">
                <h3 className="text-xl font-semibold text-gray-800">Documentez la perte</h3>
                <p className="text-gray-600">
                  Rassemblez toutes les informations pertinentes : description détaillée, photos, numéro
                  de série et circonstances de la disparition.
                </p>
              </div>
            </div>
          </div>
        </section>

        <section className="bg-white p-8 rounded-lg shadow-lg">
          <h2 className="text-2xl font-bold text-gray-800 mb-6">
            Objets fréquemment retrouvés et lieux stratégiques à {displayName}
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div>
              <h3 className="text-xl font-semibold text-gray-700 mb-4">Top 5 des objets égarés</h3>
              <ol className="list-decimal list-inside text-gray-600 space-y-1">
                <li>Smartphones et appareils électroniques</li>
                <li>Portefeuilles et cartes bancaires</li>
                <li>Clés (maison, voiture, bureau)</li>
                <li>Lunettes (solaires et de vue)</li>
                <li>Vêtements et accessoires</li>
              </ol>
            </div>
            <div>
              <h3 className="text-xl font-semibold text-gray-700 mb-4">Points chauds à {displayName}</h3>
              <ul className="list-disc list-inside text-gray-600 space-y-1">
                <li>Gare centrale et arrêts de bus principaux</li>
                <li>Centre commercial Downtown Plaza</li>
                <li>Parc municipal et aires de loisirs</li>
                <li>Quartier des restaurants et bars</li>
                <li>Campus universitaire et bibliothèques</li>
              </ul>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
