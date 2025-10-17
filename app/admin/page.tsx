// app/admin/page.tsx
'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import { supabase } from '@/lib/supabaseClient';

// ------------------------------------------------
// Types
type LostItem = {
  id: string;
  created_at: string | null;
  object_photo?: string | null;
  description?: string | null;
  city?: string | null;
  state_id?: string | null;
  date?: string | null;
  time_slot?: string | null;
  first_name?: string | null;
  last_name?: string | null;
  email?: string | null;
  contribution?: number | null;
  public_id?: string | null;
  report_public_id?: string | null;
  title?: string | null;
  slug?: string | null;
};

type FoundItem = {
  id: string;
  created_at: string | null;
  city?: string | null;
  description?: string | null;
  image_url?: string | null;
  title?: string | null;
  date?: string | null;
  labels?: string | null;
  logos?: string | null;
  objects?: string | null;
  ocr_text?: string | null;
  email?: string | null;
  phone?: string | null;
  dropoff_location?: string | null;
  has_item_with_you?: boolean | null;
};

// ------------------------------------------------
// Helpers pour formatter les dates
function toUtcIsoPlus00(dateStr?: string | null) {
  if (!dateStr) return '—';
  try {
    const d = new Date(dateStr);
    return d.toISOString().replace('Z', '+00:00');
  } catch {
    return dateStr;
  }
}

function formatInTimeZone(dateStr?: string | null, locale?: string, timeZone = 'America/New_York') {
  if (!dateStr) return '—';
  try {
    const d = new Date(dateStr);
    return new Intl.DateTimeFormat(locale || undefined, {
      dateStyle: 'medium',
      timeStyle: 'short',
      timeZone,
    }).format(d);
  } catch {
    return dateStr;
  }
}

// ------------------------------------------------
// Helper pour l’URL publique
function getPublicUrlFromRow(row: any): string | null {
  if (!row?.slug) return null;
  return `/lost/${row.slug}`;
}

// ------------------------------------------------

export default function AdminPage() {
  const [lostItems, setLostItems] = useState<LostItem[]>([]);
  const [foundItems, setFoundItems] = useState<FoundItem[]>([]);
  const [loading, setLoading] = useState(true);

  // --- Fonction pour générer le slug manquant ---
  const generateSlug = async (reportId: string) => {
    try {
      const res = await fetch(`/api/generate-report-slug?id=${encodeURIComponent(reportId)}`);
      const j = await res.json().catch(() => null);
      if (!res.ok || !j?.ok || !j?.slug) {
        alert(`Slug generation failed: ${j?.error || res.status}`);
        return;
      }
      // met à jour localement la ligne
      setLostItems((prev) =>
        prev.map((it) => (it.id === reportId ? { ...it, slug: j.slug } : it))
      );
    } catch (e: any) {
      alert(`Network error: ${String(e?.message || e)}`);
    }
  };

  // --- Récupération des données ---
  useEffect(() => {
    const fetchItems = async () => {
      setLoading(true);
      try {
        const { data: lost, error: lostError } = await supabase
          .from('lost_items')
          .select('*')
          .order('created_at', { ascending: false });

        const { data: found, error: foundError } = await supabase
          .from('found_items')
          .select('*')
          .order('created_at', { ascending: false });

        if (!lostError && Array.isArray(lost)) setLostItems(lost as LostItem[]);
        else if (lostError) console.warn('supabase lost_items error', lostError);

        if (!foundError && Array.isArray(found)) setFoundItems(found as FoundItem[]);
        else if (foundError) console.warn('supabase found_items error', foundError);
      } catch (e) {
        console.error('fetchItems error', e);
      } finally {
        setLoading(false);
      }
    };

    fetchItems();
  }, []);

  // ------------------------------------------------
  // Rendu principal
  return (
    <div className="p-6 max-w-7xl mx-auto space-y-12">
      <section>
        <h1 className="text-3xl font-bold mb-4">📦 Objets perdus (Admin)</h1>

        {loading ? (
          <div>Chargement…</div>
        ) : lostItems.length === 0 ? (
          <div>Aucun objet perdu enregistré.</div>
        ) : (
          <div className="space-y-6">
            {lostItems.map((item) => {
              const ref = item.public_id || item.report_public_id || 'N/A';
              const createdUtc = toUtcIsoPlus00(item.created_at);
              const createdNY = formatInTimeZone(item.created_at, 'en-US', 'America/New_York');
              const createdLocal = formatInTimeZone(
                item.created_at,
                undefined,
                Intl.DateTimeFormat().resolvedOptions().timeZone
              );

              const publicUrl = getPublicUrlFromRow(item);

              return (
                <div key={item.id} className="bg-white border rounded-xl p-6 shadow">
                  {/* En-tête */}
                  <div className="mb-3 text-sm text-gray-700">
                    <div><strong>Report:</strong> {item.id}</div>
                    <div><strong>City:</strong> {item.city || '—'}</div>
                    <div><strong>State:</strong> {item.state_id || '—'}</div>
                    <div><strong>Reference:</strong> {ref}</div>
                  </div>

                  {/* Dates */}
                  <div className="mb-4 text-gray-600">
                    <span className="mr-2">🕒</span>
                    <span className="font-mono">{createdUtc}</span>
                    <div className="text-sm text-gray-500 mt-1">
                      {createdNY !== '—' && <div>America / New York: {createdNY}</div>}
                      {createdLocal !== '—' && <div>Local: {createdLocal}</div>}
                    </div>
                  </div>

                  {/* Détails */}
                  <div className="mb-4">
                    <div className="text-lg font-semibold mb-2">
                      {item.title || item.description || 'Untitled'}
                    </div>

                    {item.description && (
                      <div className="mb-2">
                        <strong>Description :</strong> {item.description}
                      </div>
                    )}

                    {(item.date || item.time_slot) && (
                      <div className="mb-2">
                        <strong>Date of lost :</strong> {item.date ? item.date : '—'}
                        {item.time_slot ? ` ${item.time_slot}` : ''}
                      </div>
                    )}

                    <div className="mt-4">
                      If you think you found it, please contact:{' '}
                      <a href="mailto:support@reportlost.org" className="text-blue-600 underline">
                        support@reportlost.org
                      </a>{' '}
                      reference ({ref})
                    </div>

                    <div className="mt-4 flex items-center gap-3">
                      <strong>Contribution :</strong> {item.contribution ?? 0}
                      {publicUrl ? (
                        <a
                          href={publicUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center rounded-md bg-[#226638] text-white px-3 py-1.5 text-sm font-medium hover:brightness-110"
                          title="Open public page"
                        >
                          View post
                        </a>
                      ) : (
                        <button
                          type="button"
                          onClick={() => generateSlug(item.id)}
                          className="inline-flex items-center rounded-md bg-gray-900 text-white px-3 py-1.5 text-sm font-medium hover:brightness-110"
                          title="Generate public URL"
                        >
                          Generate link
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Submitter info */}
                  <div className="text-sm text-gray-600 flex items-center gap-3">
                    <div className="flex items-center gap-2">
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" className="text-gray-400">
                        <path
                          d="M12 12a5 5 0 100-10 5 5 0 000 10z"
                          stroke="currentColor"
                          strokeWidth="1.2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        ></path>
                        <path
                          d="M21 21v-2a4 4 0 00-4-4H7a4 4 0 00-4 4v2"
                          stroke="currentColor"
                          strokeWidth="1.2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        ></path>
                      </svg>
                      <span>
                        {item.first_name || ''} {item.last_name || ''} {item.email ? `– ${item.email}` : ''}
                      </span>
                    </div>

                    {item.object_photo && (
                      <div className="ml-auto">
                        <Image src={item.object_photo} alt="photo" width={80} height={80} className="rounded" />
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* Section Objets trouvés */}
      <section>
        <h2 className="text-2xl font-bold mb-4">🧾 Objets trouvés</h2>

        {foundItems.length === 0 ? (
          <div>Aucun objet trouvé enregistré.</div>
        ) : (
          <div className="space-y-4">
            {foundItems.map((f) => (
              <div key={f.id} className="bg-white border rounded-xl p-4 shadow flex gap-4">
                <div className="flex-1">
                  <div className="text-sm text-gray-500">🕒 {toUtcIsoPlus00(f.created_at)}</div>
                  <div className="font-semibold">{f.title || '—'}</div>
                  <div className="text-gray-700">{f.description || '—'}</div>
                  <div className="text-sm text-gray-500 mt-2">Ville: {f.city || '—'}</div>
                </div>
                {f.image_url ? (
                  <div className="w-24 h-24 relative">
                    <Image src={f.image_url} alt="found" fill style={{ objectFit: 'cover', borderRadius: 8 }} />
                  </div>
                ) : null}
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
