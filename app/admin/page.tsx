'use client';

import { useEffect, useMemo, useState } from 'react';
import Image from 'next/image';

// ——————————————————————————————
// Types (simples pour éviter les faux positifs TS)
// ——————————————————————————————
interface LostItem {
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
  public_id?: string | null;        // on affiche UNIQUEMENT celui-ci (5 chiffres)
  report_public_id?: string | null; // compat, non utilisé
  title?: string | null;
  slug?: string | null;
}

interface FoundItem {
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
}

// ——————————————————————————————
// Helpers d’affichage
// ——————————————————————————————
function toUtcIsoPlus00(dateStr?: string | null) {
  if (!dateStr) return '—';
  try {
    const d = new Date(dateStr);
    return d.toISOString().replace('Z', '+00:00');
  } catch {
    return dateStr ?? '—';
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
    return dateStr ?? '—';
  }
}

function getPublicUrlFromRow(row: { slug?: string | null } | null): string | null {
  if (!row?.slug) return null;
  return `/lost/${row.slug}`;
}

function isFiveDigits(v?: string | null) {
  return typeof v === 'string' && /^[0-9]{5}$/.test(v);
}

// ——————————————————————————————
// Page
// ——————————————————————————————
export default function AdminPage() {
  const [lostItems, setLostItems] = useState<LostItem[]>([]);
  const [foundItems, setFoundItems] = useState<FoundItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  // UI state: search + paid filter + pagination
  const [query, setQuery] = useState('');
  const [paidOnly, setPaidOnly] = useState(false);
  const [page, setPage] = useState(1);
  const PAGE_SIZE = 10;

  // Génération de slug via API interne
  const generateSlug = async (reportId: string) => {
    try {
      const res = await fetch(`/api/generate-report-slug?id=${encodeURIComponent(reportId)}`, { cache: 'no-store' });
      const j = await res.json().catch(() => null);
      if (!res.ok || !j?.ok || !j?.slug) {
        alert(`Slug generation failed: ${j?.error || res.status}`);
        return;
      }
      setLostItems(prev => prev.map(it => (it.id === reportId ? { ...it, slug: j.slug } : it)));
    } catch (e: any) {
      alert(`Network error: ${String(e?.message || e)}`);
    }
  };

  useEffect(() => {
    const run = async () => {
      setLoading(true);
      setErr(null);
      try {
        // ⚠️ API server-side qui lit Supabase : pas de supabase côté client
        const res = await fetch('/api/admin/list?limit=200', { cache: 'no-store' });
        if (!res.ok) {
          const text = await res.text().catch(() => '');
          throw new Error(`GET /api/admin/list failed (${res.status}) ${text}`);
        }
        const payload = await res.json();
        setLostItems(Array.isArray(payload?.lost) ? payload.lost : []);
        setFoundItems(Array.isArray(payload?.found) ? payload.found : []);
      } catch (e: any) {
        setErr(e?.message || 'Unknown error');
      } finally {
        setLoading(false);
      }
    };
    run();
  }, []);

  // ——— Stats
  const lostCount = lostItems.length;
  const foundCount = foundItems.length;
  const paidCount = useMemo(
    () => lostItems.filter(it => Number(it.contribution || 0) > 0).length,
    [lostItems],
  );

  // ——— Filtrage (query + paid)
  const filteredLost = useMemo(() => {
    const q = query.trim().toLowerCase();
    const base = paidOnly
      ? lostItems.filter(it => Number(it.contribution || 0) > 0)
      : lostItems;

    if (!q) return base;

    return base.filter(it => {
      const ref = isFiveDigits(it.public_id || null) ? String(it.public_id) : '';
      const hay = [
        it.title || '',
        it.description || '',
        it.city || '',
        it.state_id || '',
        it.email || '',
        ref,
      ]
        .join(' ')
        .toLowerCase();
      return hay.includes(q);
    });
  }, [lostItems, query, paidOnly]);

  // ——— Pagination
  const totalPages = Math.max(1, Math.ceil(filteredLost.length / PAGE_SIZE));
  const paginatedLost = useMemo(() => {
    const start = (page - 1) * PAGE_SIZE;
    return filteredLost.slice(start, start + PAGE_SIZE);
  }, [filteredLost, page]);

  // reset page on filters
  useEffect(() => {
    setPage(1);
  }, [query, paidOnly, lostItems]);

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-12">
      <section className="space-y-4">
        <h1 className="text-3xl font-bold">📦 Lost Items (Admin)</h1>

        {/* Controls row: search + stats */}
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          {/* Search bar */}
          <div className="w-full md:max-w-md">
            <input
              type="search"
              placeholder="Search by title, description, city, email or reference…"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-400"
            />
          </div>

          {/* Mini-summary table */}
          <div className="overflow-hidden rounded-lg border border-gray-200 bg-white">
            <div className="grid grid-cols-3 divide-x divide-gray-200 text-sm">
              <div className="px-4 py-2">
                <div className="text-gray-500">Lost reports</div>
                <div className="font-semibold">{lostCount}</div>
              </div>
              <div className="px-4 py-2">
                <div className="text-gray-500">Found items</div>
                <div className="font-semibold">{foundCount}</div>
              </div>
              <button
                type="button"
                onClick={() => setPaidOnly((v) => !v)}
                title="Show only paid customers"
                className="px-4 py-2 text-left hover:bg-emerald-50 transition"
              >
                <div className="text-gray-500 flex items-center gap-2">
                  Paid customers
                  {paidOnly && (
                    <span className="inline-block text-[10px] px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700">
                      filter
                    </span>
                  )}
                </div>
                <div className="font-semibold text-emerald-700">{paidCount}</div>
              </button>
            </div>
          </div>
        </div>

        {/* Filter hint */}
        {paidOnly && (
          <div className="text-sm">
            <span className="inline-flex items-center gap-2 rounded-full bg-emerald-50 text-emerald-800 px-3 py-1 border border-emerald-200">
              Showing paid customers only
              <button
                type="button"
                onClick={() => setPaidOnly(false)}
                className="underline decoration-dotted hover:opacity-80"
              >
                clear
              </button>
            </span>
          </div>
        )}

        {loading && <div>Loading…</div>}
        {!loading && err && (
          <div className="text-red-600">
            Error: {err}
          </div>
        )}

        {!loading && !err && (
          <>
            {filteredLost.length === 0 ? (
              <div>No lost items match your search.</div>
            ) : (
              <>
                <div className="space-y-6">
                  {paginatedLost.map((item) => {
                    const ref = isFiveDigits(item.public_id || null) ? String(item.public_id) : null;
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
                        <div className="text-lg font-semibold mb-2">
                          Reference: <span className="font-mono text-blue-700">{ref ?? '—'}</span>
                        </div>

                        <div className="text-sm text-gray-600 mb-3">
                          <div>City: {item.city || '—'}</div>
                          <div>State: {item.state_id || '—'}</div>
                          <div>
                            Created: <span className="font-mono">{createdUtc}</span>
                            {createdNY !== '—' && (
                              <span className="block text-xs text-gray-500">New York: {createdNY}</span>
                            )}
                            {createdLocal !== '—' && (
                              <span className="block text-xs text-gray-500">Local: {createdLocal}</span>
                            )}
                          </div>
                        </div>

                        <div className="mb-4">
                          <div className="text-gray-800 font-medium">
                            {item.title || item.description || 'Untitled'}
                          </div>
                          {item.description && (
                            <div className="text-gray-700 mt-1 text-sm">{item.description}</div>
                          )}
                          {(item.date || item.time_slot) && (
                            <div className="text-sm text-gray-600 mt-2">
                              <strong>Date of loss:</strong> {item.date || '—'} {item.time_slot ? `(${item.time_slot})` : ''}
                            </div>
                          )}
                        </div>

                        <div className="mt-4 flex flex-wrap items-center gap-3">
                          <strong>Contribution:</strong> {item.contribution ?? 0}

                          {publicUrl ? (
                            <a
                              href={publicUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center rounded-md bg-[#226638] text-white px-3 py-1.5 text-sm font-medium hover:brightness-110"
                              title="View public page"
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

                          {ref ? (
                            <a
                              href={`/case/${encodeURIComponent(ref)}?edit=1`}
                              className="inline-flex items-center rounded-md bg-indigo-600 text-white px-3 py-1.5 text-sm font-medium hover:brightness-110"
                              title="Edit case follow-up"
                            >
                              Edit suivi
                            </a>
                          ) : (
                            <button
                              type="button"
                              disabled
                              className="inline-flex items-center rounded-md bg-gray-300 text-gray-600 px-3 py-1.5 text-sm font-medium cursor-not-allowed"
                              title="No public reference available"
                            >
                              Edit suivi
                            </button>
                          )}
                        </div>

                        <div className="text-sm text-gray-600 flex items-center gap-3 mt-4">
                          <div className="flex items-center gap-2">
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" className="text-gray-400">
                              <path d="M12 12a5 5 0 100-10 5 5 0 000 10z" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
                              <path d="M21 21v-2a4 4 0 00-4-4H7a4 4 0 00-4 4v2" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
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

                {/* Pagination */}
                <div className="flex items-center justify-between mt-6">
                  <div className="text-sm text-gray-600">
                    Page {page} / {totalPages} — {filteredLost.length} result{filteredLost.length > 1 ? 's' : ''}
                  </div>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => setPage((p) => Math.max(1, p - 1))}
                      disabled={page <= 1}
                      className="px-3 py-1.5 rounded border text-sm disabled:opacity-50"
                    >
                      ← Previous
                    </button>
                    <button
                      type="button"
                      onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                      disabled={page >= totalPages}
                      className="px-3 py-1.5 rounded border text-sm disabled:opacity-50"
                    >
                      Next →
                    </button>
                  </div>
                </div>
              </>
            )}
          </>
        )}
      </section>

      <section>
        <h2 className="text-2xl font-bold mb-4">🧾 Found Items</h2>

        {foundItems.length === 0 ? (
          <div>No found items recorded.</div>
        ) : (
          <div className="space-y-4">
            {foundItems.map((f) => (
              <div key={f.id} className="bg-white border rounded-xl p-4 shadow flex gap-4">
                <div className="flex-1">
                  <div className="text-sm text-gray-500">🕒 {toUtcIsoPlus00(f.created_at)}</div>
                  <div className="font-semibold">{f.title || '—'}</div>
                  <div className="text-gray-700">{f.description || '—'}</div>
                  <div className="text-sm text-gray-500 mt-2">City: {f.city || '—'}</div>
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
