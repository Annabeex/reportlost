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

  // ✅ coordonnées complètes
  phone?: string | null;
  address?: string | null;
  paid?: boolean | null;

  // ✅ état de la veille IA
  search_status?: string | null;
  next_search_at?: string | null;
  last_searched_at?: string | null;
  force_search?: boolean | null;
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
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [paidOnly, setPaidOnly] = useState(false);
  const [page, setPage] = useState(1);
  const [view, setView] = useState<'lost' | 'found'>('lost'); // ← NEW
  const PAGE_SIZE = 10;

  // Totaux EXACTS (comptés en base, pas seulement les 200 chargés)
  const [totals, setTotals] = useState<{ lost: number | null; found: number | null; paid: number | null }>({
    lost: null,
    found: null,
    paid: null,
  });

  // Recherche en ligne (veille) à la demande, par dossier
  const [searchingId, setSearchingId] = useState<string | null>(null);
  const [searchResults, setSearchResults] = useState<Record<string, any[]>>({});

  // Exclure / réintégrer / forcer un dossier dans la veille
  const toggleSearch = async (id: string, action: 'exclude' | 'include' | 'force_on' | 'force_off') => {
    try {
      const res = await fetch('/api/admin/match-toggle', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, action }),
      });
      const j = await res.json().catch(() => null);
      if (!res.ok || !j?.ok) {
        alert(`Action échouée: ${j?.error || res.status}`);
        return;
      }
      setLostItems(prev => prev.map(it =>
        it.id === id ? { ...it, search_status: j.search_status, force_search: j.force_search } : it
      ));
    } catch (e: any) {
      alert(`Erreur réseau: ${String(e?.message || e)}`);
    }
  };

  const runOnlineSearch = async (id: string) => {
    setSearchingId(id);
    try {
      const res = await fetch('/api/admin/match-one', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id }),
      });
      const j = await res.json().catch(() => null);
      if (!res.ok || !j?.ok) {
        alert(`Recherche échouée: ${j?.error || res.status}`);
        return;
      }
      setSearchResults(prev => ({ ...prev, [id]: j.candidates || [] }));
    } catch (e: any) {
      alert(`Erreur réseau: ${String(e?.message || e)}`);
    } finally {
      setSearchingId(null);
    }
  };

  // (SUPPRIMÉ : états et handlers de QR preview)

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

  // Debounce de la recherche → interroge le serveur (toute la base), pas juste les 200 chargés
  useEffect(() => {
    const t = setTimeout(() => setDebouncedQuery(query.trim()), 400);
    return () => clearTimeout(t);
  }, [query]);

  useEffect(() => {
    const run = async () => {
      setLoading(true);
      setErr(null);
      try {
        // ⚠️ API server-side qui lit Supabase : pas de supabase côté client
        const url = `/api/admin/list?limit=200${debouncedQuery ? `&q=${encodeURIComponent(debouncedQuery)}` : ''}`;
        const res = await fetch(url, { cache: 'no-store' });
        if (!res.ok) {
          const text = await res.text().catch(() => '');
          throw new Error(`GET /api/admin/list failed (${res.status}) ${text}`);
        }
        const payload = await res.json();
        setLostItems(Array.isArray(payload?.lost) ? payload.lost : []);
        setFoundItems(Array.isArray(payload?.found) ? payload.found : []);
        setTotals({
          lost: payload?.lostTotal ?? null,
          found: payload?.foundTotal ?? null,
          paid: payload?.paidTotal ?? null,
        });
        setPage(1);
      } catch (e: any) {
        setErr(e?.message || 'Unknown error');
      } finally {
        setLoading(false);
      }
    };
    run();
  }, [debouncedQuery]);

  // ——— Stats (on privilégie les totaux EXACTS de la base, sinon les 200 chargés)
  const lostCount = totals.lost ?? lostItems.length;
  const foundCount = totals.found ?? foundItems.length;
  const paidCount = useMemo(
    () => totals.paid ?? lostItems.filter(it => Number(it.contribution || 0) > 0).length,
    [lostItems, totals.paid],
  );
  const conversionRate = useMemo(() => {
    if (!lostCount) return 0;
    return Math.round((paidCount / lostCount) * 1000) / 10; // 1 décimale
  }, [lostCount, paidCount]);

  // ——— Filtrage : la recherche texte est faite côté serveur (toute la base).
  // Ici on n'applique plus que le filtre "payés uniquement".
  const filteredLost = useMemo(() => {
    return paidOnly ? lostItems.filter(it => Number(it.contribution || 0) > 0) : lostItems;
  }, [lostItems, paidOnly]);

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

                        {/* ✅ Coordonnées client complètes */}
                        <div className="text-sm text-gray-700 mb-3 grid sm:grid-cols-2 gap-x-6 gap-y-0.5">
                          <div><strong>Name:</strong> {[item.first_name, item.last_name].filter(Boolean).join(' ') || '—'}</div>
                          <div><strong>Email:</strong> {item.email || '—'}</div>
                          <div><strong>Phone:</strong> {item.phone || '—'}</div>
                          <div><strong>Address:</strong> {item.address || '—'}</div>
                        </div>

                        {/* ✅ État de la veille IA + actions */}
                        <div className="text-xs text-gray-600 mb-2 flex flex-wrap items-center gap-3 border-t pt-2">
                          <span>Veille : <strong>{item.search_status || 'active'}</strong>{item.force_search ? ' (forcé)' : ''}</span>
                          <span>Dernière : {item.last_searched_at ? new Date(item.last_searched_at).toLocaleDateString() : '—'}</span>
                          <span>Prochaine : {item.next_search_at ? new Date(item.next_search_at).toLocaleDateString() : '—'}</span>

                          {item.search_status === 'excluded' ? (
                            <button type="button" onClick={() => toggleSearch(item.id, 'include')}
                              className="rounded bg-emerald-600 text-white px-2 py-1 hover:brightness-110">
                              Réintégrer à la veille
                            </button>
                          ) : (
                            <button type="button" onClick={() => toggleSearch(item.id, 'exclude')}
                              className="rounded bg-gray-700 text-white px-2 py-1 hover:brightness-110">
                              Exclure de la veille
                            </button>
                          )}

                          {Number(item.contribution || 0) < 12 && (
                            item.force_search ? (
                              <button type="button" onClick={() => toggleSearch(item.id, 'force_off')}
                                className="rounded bg-amber-200 text-amber-800 px-2 py-1 hover:brightness-105">
                                Retirer le forçage
                              </button>
                            ) : (
                              <button type="button" onClick={() => toggleSearch(item.id, 'force_on')}
                                className="rounded bg-amber-500 text-white px-2 py-1 hover:brightness-110">
                                Forcer dans la veille (&lt;12$)
                              </button>
                            )
                          )}
                        </div>

                        <div className="mt-4 flex flex-wrap items-center gap-3">
                          <strong>Contribution:</strong> {item.contribution ?? 0}

                          <button
                            type="button"
                            onClick={() => runOnlineSearch(item.id)}
                            disabled={searchingId === item.id}
                            className="inline-flex items-center rounded-md bg-blue-600 text-white px-3 py-1.5 text-sm font-medium hover:brightness-110 disabled:opacity-50"
                            title="Lancer la recherche en ligne pour ce dossier"
                          >
                            {searchingId === item.id ? 'Recherche…' : '🔎 Rechercher en ligne'}
                          </button>

                          {ref && (
                            <a
                              href={`/admin/poster/${encodeURIComponent(ref)}`}
                              target="_blank"
                              rel="noreferrer"
                              className="inline-flex items-center rounded-md bg-purple-600 text-white px-3 py-1.5 text-sm font-medium hover:brightness-110"
                              title="Image sociale + légende (télécharger)"
                            >
                              📸 Image sociale
                            </a>
                          )}

                          {searchResults[item.id] && (
                            <div className="w-full mt-2 text-sm">
                              {searchResults[item.id].length === 0 ? (
                                <div className="text-gray-500">Aucun candidat crédible trouvé pour l&apos;instant.</div>
                              ) : (
                                <ul className="list-none pl-0 space-y-2">
                                  {searchResults[item.id].map((c: any, i: number) => (
                                    <li key={i} className="border-l-2 border-blue-200 pl-2">
                                      <span className={c.verdict === 'yes' ? 'text-green-700 font-semibold' : 'text-amber-700 font-semibold'}>
                                        {String(c.verdict).toUpperCase()} {c.confidence}%
                                      </span>{' '}
                                      <a href={c.link} target="_blank" rel="noreferrer" className="text-blue-600 underline">{c.title}</a>
                                      <span className="text-gray-400"> ({c.source})</span>
                                      {c.snippet && <div className="text-gray-600">{c.snippet}</div>}
                                      <div className="text-gray-500 text-xs">🤖 {c.reason}</div>
                                    </li>
                                  ))}
                                </ul>
                              )}
                            </div>
                          )}

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
                                // ⭐️ FIX: endpoint correct (évite HTTP 405)
                                const res = await fetch('/api/admin/set-category', {
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

                          {/* ——— MODIF : lien “Sticker sheet (PDF)” (paid only) */}
                          {Number(item.contribution || 0) > 0 && ref ? (
                        <a
  href={`/api/sticker-sheet?public_id=${encodeURIComponent(ref)}`}
  target="_blank"
  rel="noreferrer"
  className="inline-flex items-center rounded-md bg-orange-600 text-white px-3 py-1.5 text-sm font-medium hover:brightness-110"
  title="Open sticker sheet (PDF)"
>
  Sticker sheet (PDF)
</a>
                          ) : null}
                          {/* ——— fin MODIF */}
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

      {/* (SUPPRIMÉ : Modal d’aperçu QR) */}
    </div>
  );
}
