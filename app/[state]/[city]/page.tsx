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

function generateCityText(cityData: any): string {
  const { city, state_name, population, density, timezone, zips, hotspots, county_name } = cityData;
  const zip = zips?.match(/\b\d{5}\b/)?.[0];
  const pop = population ? population.toLocaleString() : 'many';
  const dens = density ? `${density} people/km²` : 'unknown density';

 const getNames = (match: string[]) =>
  Array.isArray(hotspots)
    ? hotspots.filter((h: any) => match.some(keyword => h.name?.toLowerCase()?.includes(keyword))).map((h: any) => h.name)
    : [];


  const sections = [
    { title: 'espaces verts', synonyms: ['espaces verts', 'parcs publics', 'jardins'], names: getNames(['park']) },
    { title: 'lieux touristiques', synonyms: ['attractions', 'sites emblématiques', 'lieux touristiques'], names: getNames(['tour', 'attraction', 'landmark']) },
    { title: 'marchés et centres commerciaux', synonyms: ['centres commerciaux', 'marchés ouverts', 'galeries commerçantes'], names: getNames(['mall', 'market']) },
    { title: 'gares et stations', synonyms: ['gares principales', 'stations de transport', 'arrêts majeurs'], names: getNames(['station']) },
    { title: 'monuments', synonyms: ['lieux historiques', 'monuments', 'places patrimoniales'], names: getNames(['memorial', 'historic', 'theatre']) },
    { title: 'zones naturelles', synonyms: ['réserves naturelles', 'zones protégées', 'espaces naturels'], names: getNames(['nature', 'reserve']) },
    { title: 'aéroports civils', synonyms: ['aéroport régional', 'terminal aérien', 'plateforme aéroportuaire'], names: getNames(['airport']) }
  ];

  let text = `### Où sont fréquemment retrouvés les objets perdus à ${city} ?\n\nVous avez égaré un objet à ${city} ? Cette ville de ${state_name} offre plusieurs lieux emblématiques où les objets sont souvent retrouvés.\n\n`;

  sections.forEach(section => {
    if (section.names.length) {
      const synonym = section.synonyms[Math.floor(Math.random() * section.synonyms.length)];
      text += `Parmi les ${synonym} à ne pas manquer :\n\n`;
      section.names.slice(0, 5).forEach((name: string) => {
        text += `- ${name}\n`;
      });
      text += `\n`;
    }
  });

  text += `---\n\n### Informations utiles sur ${city}\n${city} est située dans le comté de ${county_name || 'son comté'}. Elle compte environ ${pop} habitants et affiche une densité de ${dens}. Fuseau horaire : ${timezone || 'local'} — Code postal principal : ${zip || 'inconnu'}.\n\n`;

  text += `---\n\n### Objets fréquemment égarés\n- Smartphones et appareils électroniques\n- Portefeuilles et cartes bancaires\n- Clés (maison, voiture, bureau)\n- Lunettes (solaires et de vue)\n- Vêtements et accessoires\n`;

  return text;
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
  const articleText = cityData ? generateCityText(cityData) : '';

  return (
    <main className="bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto space-y-12">
        <section className="text-center">
          <h1 className="text-3xl font-bold text-gray-900">Lost & Found in {displayName}, {stateName}</h1>
          <div className="text-gray-600 mt-2 max-w-3xl mx-auto whitespace-pre-line text-left prose prose-sm sm:prose-base">
            {articleText}
          </div>
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
                  Déterminez précisément où vous avez perdu votre objet : rue, transport en commun, commerce, restaurant ou parc. Cette information est cruciale pour cibler vos recherches.
                </p>
              </div>
              <div className="border-l-4 border-red-100 pl-4">
                <h3 className="text-xl font-semibold text-gray-800">Agissez rapidement</h3>
                <p className="text-gray-600">
                  Les premières 24 heures sont déterminantes. Contactez immédiatement les établissements visités et les services concernés pour signaler votre perte.
                </p>
              </div>
              <div className="border-l-4 border-red-100 pl-4">
                <h3 className="text-xl font-semibold text-gray-800">Documentez la perte</h3>
                <p className="text-gray-600">
                  Rassemblez toutes les informations pertinentes : description détaillée, photos, numéro de série et circonstances de la disparition.
                </p>
              </div>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
