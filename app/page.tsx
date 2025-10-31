'use client';

import Image from 'next/image';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import { useEffect, useRef, useState } from 'react';
import { Workflow, ShieldCheck, Target } from 'lucide-react';
import categoryList from '@/lib/popularCategories';
import { buildCityPath } from '@/lib/slugify';

// --- IMPORTANT: carte interactive chargée à la demande, pas au-dessus du fold
const UsaMap = dynamic(() => import('@/components/UsaMap'), { ssr: false });

// helper: slug catégorie
function categoryToSlug(name: string) {
  return String(name)
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/&/g, 'and')
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}

// ✅ villes majeures
const majorCities = [
  { name: 'New York', state: 'NY', image: '/images/cities/new-york.jpg' },
  { name: 'Los Angeles', state: 'CA', image: '/images/cities/los-angeles.jpg' },
  { name: 'Chicago', state: 'IL', image: '/images/cities/chicago.jpg' },
  { name: 'Houston', state: 'TX', image: '/images/cities/houston.jpg' },
  { name: 'Phoenix', state: 'AZ', image: '/images/cities/phoenix.jpg' },
  { name: 'Philadelphia', state: 'PA', image: '/images/cities/philadelphia.jpg' },
  { name: 'San Antonio', state: 'TX', image: '/images/cities/san-antonio.jpg' },
  { name: 'San Diego', state: 'CA', image: '/images/cities/san-diego.jpg' },
];

// ---- types pour la liste de rapports ----
type HomeLostItem = {
  id: string;
  slug: string | null;
  title: string | null;
  city: string | null;
  state_id: string | null;
  created_at: string | null;
};

// Formatteur "YYYY-MM-DD" (sans heure)
function toYmd(dateStr?: string | null) {
  if (!dateStr) return '—';
  try {
    const d = new Date(dateStr);
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  } catch {
    return '—';
  }
}

/** Composant qui remplace la carte par une image statique et ne monte la carte
 * interactive que si la zone est visible ET quand le thread est au repos.
 * -> Réduction massive du LCP.
 */
function LazyInteractiveMap() {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [shouldMountMap, setShouldMountMap] = useState(false);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    let timeoutId: any;

    const mountWhenIdle = () => {
      // @ts-ignore
      const idle = window.requestIdleCallback || ((cb: any) => setTimeout(cb, 300));
      idle(() => setShouldMountMap(true));
    };

    const io = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        if (entry.isIntersecting) {
          mountWhenIdle();
          io.disconnect();
        }
      },
      { rootMargin: '200px' }
    );

    io.observe(el);
    return () => {
      io.disconnect();
      clearTimeout(timeoutId);
    };
  }, []);

  return (
    <div ref={containerRef} className="w-full">
      {!shouldMountMap ? (
        // ✅ Image statique ultra-légère (webp/png) — remplace par ton asset
        <Image
          src="/images/map-usa-static.webp"
          alt="United States map"
          width={800}
          height={500}
          className="rounded-md border"
          priority={false}
          loading="lazy"
          sizes="(max-width: 768px) 100vw, 48vw"
        />
      ) : (
        <UsaMap />
      )}
    </div>
  );
}

export default function HomePage() {
  // --- état pour les 10 derniers signalements
  const [recent, setRecent] = useState<HomeLostItem[]>([]);
  const [loadingRecent, setLoadingRecent] = useState(true);

  useEffect(() => {
    const fetchRecent = async () => {
      setLoadingRecent(true);
      try {
        // ⬇️ API serveur => pas de bloqueur LCP (sous le fold)
        const res = await fetch('/api/recent-lost', { cache: 'no-store' });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const json = await res.json();
        setRecent(Array.isArray(json.items) ? (json.items as HomeLostItem[]) : []);
      } catch (e) {
        console.warn('fetch recent lost failed', e);
        setRecent([]);
      } finally {
        setLoadingRecent(false);
      }
    };

    fetchRecent();
  }, []);

  return (
    <>
      {/* --- Hero section (pas d'animation sur l'above-the-fold) --- */}
      <section className="w-full bg-white px-4 py-8">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-8">
          <div className="w-full md:w-[48%]">
            {/* ⬇️ Remplace <UsaMap/> par une image + montage paresseux */}
            <LazyInteractiveMap />
          </div>
          <div className="w-full md:w-[48%] text-center md:text-left">
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-4">
              Lost and Found Services in the United States
            </h1>
            <p className="text-gray-700 mb-4 text-sm md:text-base">
              Report and recover lost items from various cities and states across the United States of America.
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

      {/* --- Section villes majeures --- */}
      <section className="bg-white w-full px-8 py-10 mx-auto">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-center text-xl font-bold text-gray-800 mb-6">
            Explore Lost & Found Services in Major U.S. Cities
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-6 justify-items-center">
            {majorCities.map((city) => (
              <Link
                key={`${city.name}-${city.state}`}
                href={buildCityPath(city.state, city.name)}
                prefetch={false}
                className="text-center group transition-transform transform hover:scale-105"
              >
                <Image
                  src={city.image}
                  alt={city.name}
                  width={120}
                  height={120}
                  className="rounded-full object-cover mx-auto shadow w-[120px] h-[120px]"
                  loading="lazy"
                  sizes="(max-width: 768px) 120px, 120px"
                />
                <p className="text-sm font-medium mt-2 text-gray-700 group-hover:text-blue-600">
                  {city.name}
                </p>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* --- Section informations --- */}
      <section className="bg-gradient-to-r from-blue-50 to-yellow-50 w-full px-8 py-16 mx-auto">
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
                  <span className="text-blue-500">→</span> We analyze and match your report with databases and local groups.
                </li>
                <li className="flex gap-2">
                  <span className="text-blue-500">→</span> Your report is shared with appropriate authorities and relevant services.
                </li>
                <li className="flex gap-2">
                  <span className="text-blue-500">→</span> Receive updates if there’s a credible match.
                </li>
              </ul>
            </div>

            <div className="bg-white shadow p-6 rounded-lg hover:shadow-lg transition">
              <h3 className="text-lg font-semibold text-gray-800 mb-3 flex items-center gap-2">
                <ShieldCheck size={20} className="text-green-500" /> Why ReportLost.org?
              </h3>
              <ul className="list-none">
                <li className="mb-2">✅ Available 24/7 online</li>
                <li className="mb-2">✅ Covers all U.S. cities and states</li>
                <li className="mb-2">✅ Combines AI-powered analysis with human follow-up</li>
                <li className="mb-2">✅ Trusted by thousands of users</li>
                <li className="mb-2">✅ Private, anonymous submissions available</li>
              </ul>
            </div>

            <div className="bg-white shadow p-6 rounded-lg hover:shadow-lg transition">
              <h3 className="text-lg font-semibold text-gray-800 mb-3 flex items-center gap-2">
                <Target size={20} className="text-yellow-500" /> Who Is This For?
              </h3>
              <ul className="list-disc list-inside space-y-1">
                <li>Tourists who lost items while traveling in the U.S.</li>
                <li>Citizens who've misplaced phones, bags, or documents in transit</li>
                <li>Businesses seeking to centralize lost property reports</li>
                <li>Event organizers handling missing items from attendees</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* --- Section catégories --- */}
      <section className="bg-gray-50 w-full px-8 py-16 mx-auto">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-center text-xl font-bold text-gray-800 mb-6">
            Most Frequently Lost Items
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-6 justify-items-center">
            {categoryList.map((category) => {
              const slug = categoryToSlug(category.name);
              const imgSrc = category.image || `/images/categories/${slug}.jpg`;
              return (
                <Link
                  key={category.name}
                  href={`/lost-and-found/category/${slug}`}
                  prefetch={false}
                  className="text-center group transition-transform hover:scale-105"
                >
                  <Image
                    src={imgSrc}
                    alt={category.name}
                    width={120}
                    height={120}
                    className="rounded-full object-cover mx-auto shadow"
                    loading="lazy"
                    sizes="(max-width: 768px) 120px, 120px"
                  />
                  <p className="text-sm font-medium mt-2 text-gray-700 group-hover:text-blue-600">
                    {category.name}
                  </p>
                </Link>
              );
            })}
          </div>
        </div>
      </section>

      {/* --- 10 derniers signalements (sous le fold) --- */}
      <section className="bg-white w-full px-8 py-16 mx-auto">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-center text-xl font-bold text-gray-800 mb-6">
            Recent lost reports
          </h2>

          {loadingRecent ? (
            <div className="text-center text-gray-500">Loading…</div>
          ) : recent.length === 0 ? (
            <div className="text-center text-gray-500">No reports yet.</div>
          ) : (
            <div className="space-y-4">
              {recent.map((item) => {
                const slug = item.slug || '';
                let city = item.city || '—';
                const state = item.state_id || '';
                const title = item.title || 'Item';
                const dateYmd = toYmd(item.created_at);

                // ✅ Supprime le doublon de l’État si déjà dans le nom de la ville
                const normalizedCity = city.replace(/\s*\(([A-Z]{2})\)\s*/g, '').trim();
                const showState = normalizedCity.toLowerCase().includes(state.toLowerCase())
                  ? ''
                  : ` (${state})`;

                return (
                  <Link
                    key={item.id}
                    href={slug ? `/lost/${slug}` : '#'}
                    prefetch={false}
                    className="block rounded-xl border border-blue-200 bg-blue-50 px-5 py-4 hover:border-blue-300 hover:bg-blue-100 transition"
                  >
                    <div className="text-base md:text-lg font-semibold text-blue-800">
                      {title}{' '}
                      <span className="font-normal text-gray-700">lost in</span>{' '}
                      {normalizedCity}
                      {showState}
                    </div>
                    <div className="text-sm text-gray-600 mt-1">
                      Date of report: {dateYmd}
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </div>
      </section>
    </>
  );
}
