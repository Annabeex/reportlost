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

  // ✅ pour le drapeau de suivi (colonnes déjà présentes en base)
  followup_email_sent?: boolean | null;
  followup_email_sent_at?: string | null;
  followup_email_to?: string | null;

  // ✅ catégories (ajouté)
  primary_category?: string | null;
  categories?: string[] | null;
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

function formatInTimeZone(dateStr?: string | null, timeZone = 'America/New_York', locale?: string) {
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

// ✅ Mapping simple “state → timezone” (par défaut: New_York)
const STATE_TZ: Record<string, string> = {
  // Pacific
  CA: 'America/Los_Angeles', WA: 'America/Los_Angeles', OR: 'America/Los_Angeles', NV: 'America/Los_Angeles',
  // Mountain (AZ sans DST)
  AZ: 'America/Phoenix', CO: 'America/Denver', UT: 'America/Denver', NM: 'America/Denver', ID: 'America/Boise', MT: 'America/Denver', WY: 'America/Denver',
  // Central
  TX: 'America/Chicago', OK: 'America/Chicago', KS: 'America/Chicago', NE: 'America/Chicago', SD: 'America/Chicago', ND: 'America/Chicago',
  MN: 'America/Chicago', IA: 'America/Chicago', MO: 'America/Chicago', AR: 'America/Chicago', LA: 'America/Chicago', WI: 'America/Chicago', IL: 'America/Chicago',
  // Eastern
  NY: 'America/New_York', NJ: 'America/New_York', PA: 'America/New_York', MA: 'America/New_York', CT: 'America/New_York', RI: 'America/New_York',
  VT: 'America/New_York', NH: 'America/New_York', ME: 'America/New_York', FL: 'America/New_York', GA: 'America/New_York', SC: 'America/New_York',
  NC: 'America/New_York', VA: 'America/New_York', WV: 'America/New_York', DC: 'America/New_York', MD: 'America/New_York', DE: 'America/New_York',
  MI: 'America/Detroit', IN: 'America/Indiana/Indianapolis', OH: 'America/New_York', KY: 'America/New_York', TN: 'America/Chicago', AL: 'America/Chicago',
  MS: 'America/Chicago',
  // Alaska / Hawaii
  AK: 'America/Anchorage', HI: 'Pacific/Honolulu',
};

function tzForState(stateId?: string | null) {
  const s = (stateId || '').trim().toUpperCase();
  return STATE_TZ[s] || 'America/New_York';
}

// ✅ Liste de catégories (pour le picker)
const ALL_CATEGORIES = [
  "keys","wallet","electronics","glasses","documents",
  "jewelry","clothes","bag","pets","other"
];

// ✅ Sélecteur de catégories (bouton "Category")
function CategoryPicker({
  current,
  selected,
  onChange,
  onSave,
}: {
  current?: string | null;
  selected: string[];
  onChange: (next: string[]) => void;
  onSave: () => void;
}) {
  const [open, setOpen] = useState(false);
  return (
    <div className="relative inline-block">
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        className="inline-flex items-center rounded-md border px-2.5 py-1.5 text-sm hover:bg-gray-50"
        title="View / edit categories"
      >
        Category{current ? `: ${current}` : ""}
        <svg width="14" height="14" viewBox="0 0 24 24" className="ml-1 opacity-70"><path d="M7 10l5 5 5-5" fill="none" stroke="currentColor" strokeWidth="2"/></svg>
      </button>

      {open && (
        <div className="absolute z-10 mt-2 w-56 rounded-md border bg-white shadow">
          <div className="max-h-64 overflow-auto p-2 space-y-1">
            {ALL_CATEGORIES.map(cat => {
              const checked = selected.includes(cat);
              return (
                <label key={cat} className="flex items-center gap-2 px-2 py-1 rounded hover:bg-gray-50">
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={(e) => {
                      const next = e.target.checked
                        ? Array.from(new Set([...selected, cat]))
                        : selected.filter(c => c !== cat);
                      onChange(next);
                    }}
                  />
                  <span className="capitalize">{cat.replace(/-/g, " ")}</span>
                </label>
              );
            })}
          </div>
          <div className="flex justify-end gap-2 p-2 border-t">
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="px-2 py-1 text-sm rounded border"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={() => { setOpen(false); onSave(); }}
              className="px-2 py-1 text-sm rounded bg-emerald-600 text-white"
            >
              Save
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ——————————————————————————————
// Page
// ——————————————————————————————
export default function AdminPage() {
  const [lostItems, setLostItems] = useState<LostItem[]>([]);
  const [foundItems, setFoundItems] = useState<FoundItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  // UI state: search + paid filter + pagination + view mode
  const [query, setQuery] = useState('');
  const [paidOnly, setPaidOnly] = useState(false);
  const [page, setPage] = useState(1);
  const [view, setView] = useState<'lost' | 'found'>('lost'); // ← NEW
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
  const conversionRate = useMemo(() => {
    if (!lostCount) return 0;
    return Math.round((paidCount / lostCount) * 1000) / 10; // 1 décimale
  }, [lostCount, paidCount]);

  // ——— Filtrage (query + paid) pour LOST uniquement
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

  // ——— Pagination (LOST)
  const totalPages = Math.max(1, Math.ceil(filteredLost.length / PAGE_SIZE));
  const paginatedLost = useMemo(() => {
    const start = (page - 1) * PAGE_SIZE;
    return filteredLost.slice(start, start + PAGE_SIZE);
  }, [filteredLost, page]);

  // reset page on filters
  useEffect(() => {
    setPage(1);
  }, [query, paidOnly, lostItems, view]);

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-12">
      <section className="space-y-4">
        <h1 className="text-3xl font-bold">📦 Lost Items (Admin)</h1>

        {/* Controls row: search + stats */}
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          {/* Search bar (affichée seulement en vue LOST, car elle ne filtre que les lost) */}
          <div className="w-full md:max-w-md">
            {view === 'lost' && (
              <input
                type="search"
                placeholder="Search by title, description, city, email or reference…"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-400"
              />
            )}
          </div>

          {/* Mini-summary table (cliquer pour filtrer la vue) */}
          <div className="overflow-hidden rounded-lg border border-gray-200 bg-white">
            <div className="grid grid-cols-4 divide-x divide-gray-200 text-sm">
              {/* Lost reports (bouton) */}
              <button
                type="button"
                onClick={() => setView('lost')}
                className={`px-4 py-2 text-left hover:bg-emerald-50 transition ${view === 'lost' ? 'bg-emerald-50' : ''}`}
                title="Show lost reports"
              >
                <div className="text-gray-500">Lost reports</div>
                <div className="font-semibold">{lostCount}</div>
              </button>

              {/* Found items (bouton) */}
              <button
                type="button"
                onClick={() => setView('found')}
                className={`px-4 py-2 text-left hover:bg-emerald-50 transition ${view === 'found' ? 'bg-emerald-50' : ''}`}
                title="Show found items"
              >
                <div className="text-gray-500">Found items</div>
                <div className="font-semibold">{foundCount}</div>
              </button>

              {/* Paid customers (toggle) */}
              <button
                type="button"
                onClick={() => {
                  setView('lost'); // la logique "paid" n'a de sens que sur les lost
                  setPaidOnly((v) => !v);
                }}
                title="Show only paid customers"
                className="px-4 py-2 text-left hover:bg-emerald-50 transition"
              >
                <div className="text-gray-500 flex items-center gap-2">
                  Paid customers
                  {paidOnly && view === 'lost' && (
                    <span className="inline-block text-[10px] px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700">
                      filter
                    </span>
                  )}
                </div>
                <div className="font-semibold text-emerald-700">{paidCount}</div>
              </button>

              {/* TC (taux de conversion) */}
              <div className="px-4 py-2">
                <div className="text-gray-500">TC</div>
                <div className="font-semibold">{lostCount ? `${conversionRate}%` : '—'}</div>
              </div>
            </div>
          </div>
        </div>

        {/* Hint paid filter */}
        {paidOnly && view === 'lost' && (
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

        {!loading && !err && view === 'lost' && (
          <>
            {filteredLost.length === 0 ? (
              <div>No lost items match your search.</div>
            ) : (
              <>
                <div className="space-y-6">
                  {paginatedLost.map((item) => {
                    const ref = isFiveDigits(item.public_id || null) ? String(item.public_id) : null;
                    const tzState = tzForState(item.state_id);
                    const createdUtcIso = toUtcIsoPlus00(item.created_at); // ← conservé mais non affiché
                    const createdLocalState = formatInTimeZone(item.created_at, tzState);
                    const createdFrance = formatInTimeZone(item.created_at, 'Europe/Paris');
                    const publicUrl = getPublicUrlFromRow(item);

                    const followupSent = !!item.followup_email_sent;

                    return (
                      <div key={item.id} className="bg-white border rounded-xl p-6 shadow relative">
                        {/* ✅ Drapeau “follow-up sent” à gauche */}
                        {followupSent && (
                          <div
                            className="absolute -left-3 top-4 rotate-[-6deg] rounded-md bg-emerald-600 text-white text-xs px-2 py-1 shadow"
                            title={`Follow-up sent${item.followup_email_sent_at ? ` • ${new Date(item.followup_email_sent_at).toLocaleString()}` : ''}${item.followup_email_to ? ` → ${item.followup_email_to}` : ''}`}
                          >
                            Follow-up sent
                          </div>
                        )}

                        <div className="text-lg font-semibold mb-2">
                          Reference: <span className="font-mono text-blue-700">{ref ?? '—'}</span>
                        </div>

                        <div className="text-sm text-gray-600 mb-3">
                          <div>City: {item.city || '—'}{item.state_id ? ` (${item.state_id})` : ''}</div>

                          {/* ✅ Bloc horaires normalisé — sans la première date ISO */}
                          <div className="mt-1 space-y-0.5">
                            <div><strong>Created at:</strong></div>
                            <div><strong>Local time (state):</strong> {createdLocalState}</div>
                            <div><strong>France time:</strong> {createdFrance}</div>
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

                          {/* ✅ Category selector (ajouté) */}
                          <CategoryPicker
                            current={item.primary_category || null}
                            selected={Array.isArray(item.categories) ? item.categories : (item.primary_category ? [item.primary_category] : [])}
                            onChange={(next) => {
                              setLostItems(prev => prev.map(it =>
                                it.id === item.id ? { ...it, categories: next } : it
                              ));
                            }}
                            onSave={async () => {
                              try {
                                const body = {
                                  id: item.id,
                                  categories: Array.isArray(item.categories) && item.categories.length ? item.categories
                                    : (item.primary_category ? [item.primary_category] : []),
                                  primary: (Array.isArray(item.categories) && item.categories[0])
                                    || item.primary_category
                                    || null,
                                };
                                const res = await fetch('/api/admin/set-categories', {
                                  method: 'POST',
                                  headers: { 'Content-Type': 'application/json' },
                                  body: JSON.stringify(body),
                                });
                                if (!res.ok) throw new Error(`HTTP ${res.status}`);
                                const j = await res.json().catch(() => null);
                                if (j?.ok) {
                                  setLostItems(prev => prev.map(it =>
                                    it.id === item.id ? {
                                      ...it,
                                      primary_category: body.primary,
                                      categories: body.categories
                                    } : it
                                  ));
                                } else {
                                  alert(`Save failed: ${j?.error || 'unknown error'}`);
                                }
                              } catch (e: any) {
                                alert(`Save failed: ${String(e?.message || e)}`);
                              }
                            }}
                          />
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

      {/* FOUND SECTION — affichée uniquement en vue "found" */}
      {view === 'found' && (
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
      )}
    </div>
  );
}
