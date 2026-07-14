'use client';

// app/en-ca/page.tsx
// Home Canada (anglophone) — BROUILLON / DRAFT (noindex via app/en-ca/layout.tsx).
// Fichier autonome, ne touche pas la home US (app/page.tsx). Une fois validé, on
// pourra extraire un composant partagé <CountryHome> commun US + CA.

import Link from 'next/link';
import { Workflow, ShieldCheck, Target } from 'lucide-react';
import categoryList from '@/lib/popularCategories';
import { caMajorCities, buildCaCityPath, provinceName } from '@/lib/canada/canadaData';

// slug catégorie — identique à la home US (garde les URLs cohérentes)
function categoryToSlug(name: string) {
  return String(name)
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/&/g, 'and')
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}

// Pastille ronde (initiales) — évite toute dépendance à des assets image pour le draft.
function CityBubble({ name }: { name: string }) {
  const initials = name
    .replace(/[^A-Za-zÀ-ÿ\s]/g, '')
    .split(/\s+/)
    .map((w) => w[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();
  return (
    <div className="w-[120px] h-[120px] rounded-full mx-auto shadow flex items-center justify-center bg-gradient-to-br from-red-100 to-blue-100 text-2xl font-bold text-gray-700">
      {initials}
    </div>
  );
}

export default function CanadaHomePage() {
  return (
    <>
      {/* --- Bandeau DRAFT (repère interne ; disparaît au lancement) --- */}
      <div className="w-full bg-yellow-100 text-yellow-900 text-center text-xs md:text-sm py-2 px-4 border-b border-yellow-200">
        🇨🇦 <strong>DRAFT — Canada (en-ca)</strong> · page non indexée, en préparation. À valider avant lancement.
      </div>

      {/* --- Hero --- */}
      <section className="w-full bg-white px-4 py-8">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-8">
          <div className="w-full md:w-[48%]">
            <div className="rounded-md border bg-gradient-to-br from-red-50 via-white to-blue-50 h-[280px] flex flex-col items-center justify-center text-center px-6">
              <div className="text-5xl mb-3">🍁</div>
              <p className="text-gray-700 font-medium">
                Coast to coast — from Vancouver to St. John&rsquo;s.
              </p>
              <p className="text-gray-500 text-sm mt-1">
                Every province, one place to report a loss.
              </p>
            </div>
          </div>
          <div className="w-full md:w-[48%] text-center md:text-left">
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-4">
              Lost and Found Services in Canada
            </h1>
            <p className="text-gray-700 mb-4 text-sm md:text-base">
              Report and recover lost items across every Canadian province — we route your
              report to the right police service, transit and airport lost &amp; found.
            </p>
            <Link
              href="/report"
              prefetch={false}
              className="inline-block bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-md font-semibold"
            >
              Report a Lost Item
            </Link>
          </div>
        </div>
        <div className="w-full h-px bg-gray-200 mt-12" />
      </section>

      {/* --- Villes majeures --- */}
      <section className="bg-white w-full px-8 py-10 mx-auto">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-center text-xl font-bold text-gray-800 mb-6">
            Explore Lost &amp; Found Services in Major Canadian Cities
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-6 justify-items-center">
            {caMajorCities.map((city) => (
              <Link
                key={`${city.name}-${city.province}`}
                href={buildCaCityPath(city.province, city.name)}
                prefetch={false}
                className="text-center group transition-transform transform hover:scale-105"
              >
                <CityBubble name={city.name} />
                <p className="text-sm font-medium mt-2 text-gray-700 group-hover:text-blue-600">
                  {city.name}
                </p>
                <p className="text-xs text-gray-400">{provinceName(city.province)}</p>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* --- Informations (localisées Canada) --- */}
      <section className="bg-gradient-to-r from-red-50 to-blue-50 w-full px-8 py-16 mx-auto">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-10 text-sm text-gray-700">
            <div className="bg-white shadow p-6 rounded-lg hover:shadow-lg transition">
              <h3 className="text-lg font-semibold text-gray-800 mb-3 flex items-center gap-2">
                <Workflow size={20} className="text-blue-500" /> How It Works
              </h3>
              <ul className="space-y-1">
                <li className="flex gap-2">
                  <span className="text-blue-500">→</span> Submit a detailed report with as much information as possible.
                </li>
                <li className="flex gap-2">
                  <span className="text-blue-500">→</span> We match it against local lost &amp; found systems and community groups.
                </li>
                <li className="flex gap-2">
                  <span className="text-blue-500">→</span> Your report is pointed to the right police service, transit and airport desk.
                </li>
                <li className="flex gap-2">
                  <span className="text-blue-500">→</span> Receive updates if there&rsquo;s a credible match.
                </li>
              </ul>
            </div>

            <div className="bg-white shadow p-6 rounded-lg hover:shadow-lg transition">
              <h3 className="text-lg font-semibold text-gray-800 mb-3 flex items-center gap-2">
                <ShieldCheck size={20} className="text-green-500" /> Why ReportLost?
              </h3>
              <ul className="list-none">
                <li className="mb-2">✅ Available 24/7 online</li>
                <li className="mb-2">✅ Covers every Canadian province &amp; territory</li>
                <li className="mb-2">✅ Routes to the right RCMP / municipal police service</li>
                <li className="mb-2">✅ Transit &amp; airport lost &amp; found (TTC, STM, TransLink, YYZ, YUL…)</li>
                <li className="mb-2">✅ Private, anonymous submissions available</li>
              </ul>
            </div>

            <div className="bg-white shadow p-6 rounded-lg hover:shadow-lg transition">
              <h3 className="text-lg font-semibold text-gray-800 mb-3 flex items-center gap-2">
                <Target size={20} className="text-yellow-500" /> Who Is This For?
              </h3>
              <ul className="list-disc list-inside space-y-1">
                <li>Travellers who lost items while visiting Canada</li>
                <li>Residents who&rsquo;ve misplaced phones, bags or documents in transit</li>
                <li>Businesses centralizing lost-property reports</li>
                <li>Event organizers handling attendees&rsquo; missing items</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* --- Catégories --- */}
      <section className="bg-gray-50 w-full px-8 py-16 mx-auto">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-center text-xl font-bold text-gray-800 mb-6">
            Most Frequently Lost Items
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-6 justify-items-center">
            {categoryList.map((category) => {
              const slug = categoryToSlug(category.name);
              return (
                <Link
                  key={category.name}
                  href={`/en-ca/lost-and-found/category/${slug}`}
                  prefetch={false}
                  className="text-center group transition-transform hover:scale-105"
                >
                  <div className="w-[120px] h-[120px] rounded-full mx-auto shadow flex items-center justify-center bg-white text-3xl">
                    🔎
                  </div>
                  <p className="text-sm font-medium mt-2 text-gray-700 group-hover:text-blue-600">
                    {category.name}
                  </p>
                </Link>
              );
            })}
          </div>
        </div>
      </section>
    </>
  );
}
