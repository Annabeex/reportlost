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

  // ✅ 1er signalement de sa ville (-> proposer le kit groupe FB)
  first_in_city?: boolean | null;
  // ✅ groupe Facebook déjà créé pour cette ville (case cochée sur la page kit)
  fb_group_done?: boolean | null;
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

// ✅ Coordonnées client éditables (téléphone, adresse, date de naissance,
// détail privé) : saisies au fil des réponses client (ex: DOB pour dépôt police).
function ClientFieldsEditor({ item }: { item: any }) {
  const [fields, setFields] = useState({
    phone: item.phone || "",
    address: item.address || "",
    birth_date: item.birth_date || "",
    private_detail: item.private_detail || "",
  });
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const dirty =
    fields.phone !== (item.phone || "") ||
    fields.address !== (item.address || "") ||
    fields.birth_date !== (item.birth_date || "") ||
    fields.private_detail !== (item.private_detail || "");

  const save = async () => {
    setSaving(true);
    setSaved(false);
    try {
      const r = await fetch("/api/admin/update-report", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: item.id, fields }),
      });
      if (r.ok) {
        Object.assign(item, fields); // reflète localement sans re-fetch
        setSaved(true);
        setTimeout(() => setSaved(false), 2500);
      } else {
        alert("Erreur de sauvegarde");
      }
    } finally {
      setSaving(false);
    }
  };

  const cls =
    "w-full rounded border border-gray-300 px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-emerald-500";
  return (
    <div className="mb-3 rounded-lg border border-gray-200 bg-gray-50 p-3">
      <div className="grid gap-2 sm:grid-cols-2">
        <label className="text-xs text-gray-600">
          📞 Phone
          <input className={cls} value={fields.phone}
            onChange={(e) => setFields((f) => ({ ...f, phone: e.target.value }))} />
        </label>
        <label className="text-xs text-gray-600">
          🎂 Date de naissance
          <input type="date" className={cls} value={fields.birth_date}
            onChange={(e) => setFields((f) => ({ ...f, birth_date: e.target.value }))} />
        </label>
        <label className="text-xs text-gray-600 sm:col-span-2">
          🏠 Adresse postale
          <input className={cls} value={fields.address}
            onChange={(e) => setFields((f) => ({ ...f, address: e.target.value }))} />
        </label>
        <label className="text-xs text-rose-700 sm:col-span-2">
          🔒 Détail privé de vérification (jamais publié)
          <input className={cls + " border-rose-200 bg-rose-50"} value={fields.private_detail}
            onChange={(e) => setFields((f) => ({ ...f, private_detail: e.target.value }))} />
        </label>
      </div>
      <div className="mt-2 flex items-center gap-2">
        <button type="button" onClick={save} disabled={!dirty || saving}
          className={`rounded px-3 py-1 text-sm text-white ${dirty ? "bg-emerald-600 hover:brightness-110" : "bg-gray-300"}`}>
          {saving ? "Sauvegarde…" : "💾 Enregistrer"}
        </button>
        {saved && <span className="text-sm text-emerald-700">✓ Enregistré</span>}
      </div>
    </div>
  );
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
  const [totals, setTotals] = useState<{
    lost: number | null;
    found: number | null;
    paid: number | null;
    posterPng?: number | null;
    posterPdf?: number | null;
    production?: Record<string, number | null>;
    visits?: Record<string, number | null>;
  }>({
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
          posterPng: payload?.posterPngTotal ?? null,
          posterPdf: payload?.posterPdfTotal ?? null,
          production: payload?.production ?? undefined,
          visits: payload?.visits ?? undefined,
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
  // Filtres par pastilles : payés / gratuits / sans follow-up / 1re ville
  const [freeOnly, setFreeOnly] = useState(false);
  const [noFollowupOnly, setNoFollowupOnly] = useState(false);
  const [firstCityOnly, setFirstCityOnly] = useState(false);
  // Ligne dépliée (une seule à la fois)
  const [openId, setOpenId] = useState<string | null>(null);

  const filteredLost = useMemo(() => {
    let arr = lostItems;
    if (paidOnly) arr = arr.filter(it => Number(it.contribution || 0) > 0);
    if (freeOnly) arr = arr.filter(it => Number(it.contribution || 0) <= 0);
    if (noFollowupOnly) arr = arr.filter(it => Number(it.contribution || 0) > 0 && !it.followup_email_sent);
    if (firstCityOnly) arr = arr.filter(it => (it as any).first_in_city && !(it as any).fb_group_done);
    return arr;
  }, [lostItems, paidOnly, freeOnly, noFollowupOnly, firstCityOnly]);

  // ——— Pagination (LOST)
  const totalPages = Math.max(1, Math.ceil(filteredLost.length / PAGE_SIZE));
  const paginatedLost = useMemo(() => {
    const start = (page - 1) * PAGE_SIZE;
    return filteredLost.slice(start, start + PAGE_SIZE);
  }, [filteredLost, page]);

  // reset page on filters
  useEffect(() => {
    setPage(1);
  }, [query, paidOnly, freeOnly, noFollowupOnly, firstCityOnly, lostItems, view]);

  // Icône par catégorie (ligne compacte)
  const catIcon = (c?: string | null) => {
    const k = String(c || "").toLowerCase();
    if (k.includes("wallet")) return "👛";
    if (k.includes("jewel")) return "💍";
    if (k.includes("key")) return "🔑";
    if (k.includes("electro") || k.includes("phone") || k.includes("laptop")) return "📱";
    if (k.includes("bag")) return "🎒";
    if (k.includes("doc")) return "📄";
    if (k.includes("pet")) return "🐾";
    if (k.includes("glass")) return "👓";
    if (k.includes("cloth")) return "🧥";
    return "📦";
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-12">
      <section className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-3xl font-bold">📦 Lost Items (Admin)</h1>
            <a
              href="/admin/group-kit"
              className="inline-flex items-center rounded-md bg-[#1877F2] px-3 py-1.5 text-sm font-medium text-white hover:brightness-110"
              title="Générer un kit de groupe Facebook (nom, description, posts, bannière) et suivre les groupes créés"
            >
              👥 Kits Facebook
            </a>
          </div>
          <a
            href="/admin/city-guides"
            className="inline-flex items-center rounded-md bg-blue-600 px-3 py-1.5 text-sm font-medium text-white hover:brightness-110"
            title="Générer et publier les guides ville (SEO)"
          >
            🏙️ Guides ville
          </a>
        </div>

        {/* 📊 Stats en 3 familles : Activité / Production / Visites */}
        <div className="grid gap-3 md:grid-cols-3">
          <div className="rounded-xl border border-gray-200 bg-white px-4 py-3">
            <div className="text-xs uppercase tracking-wide text-gray-400 mb-2">Activité</div>
            <div className="flex flex-wrap gap-x-5 gap-y-1">
              <div><div className="text-lg font-semibold leading-tight">{lostCount}</div><div className="text-xs text-gray-500">Lost</div></div>
              <div><div className="text-lg font-semibold leading-tight">{foundCount}</div><div className="text-xs text-gray-500">Found</div></div>
              <div><div className="text-lg font-semibold leading-tight text-emerald-700">{paidCount}</div><div className="text-xs text-gray-500">Payés</div></div>
              <div><div className="text-lg font-semibold leading-tight">{lostCount ? `${conversionRate}%` : '—'}</div><div className="text-xs text-gray-500">TC</div></div>
              <div><div className="text-lg font-semibold leading-tight text-gray-600">{totals.lost != null && totals.paid != null ? totals.lost - totals.paid : '—'}</div><div className="text-xs text-gray-500">Gratuits</div></div>
            </div>
          </div>
          <div className="rounded-xl border border-gray-200 bg-white px-4 py-3">
            <div className="text-xs uppercase tracking-wide text-gray-400 mb-2">Production</div>
            <div className="flex flex-wrap gap-x-5 gap-y-1">
              <div><div className="text-lg font-semibold leading-tight text-blue-700">{totals.production?.guidesTotal ?? '—'}</div><div className="text-xs text-gray-500">🏙️ Guides</div></div>
              <div><div className="text-lg font-semibold leading-tight text-[#1877F2]">{totals.production?.fbTotal ?? '—'}</div><div className="text-xs text-gray-500">👥 Groupes FB</div></div>
              <div><div className="text-lg font-semibold leading-tight text-purple-700">{totals.posterPng != null || totals.posterPdf != null ? (totals.posterPng ?? 0) + (totals.posterPdf ?? 0) : '—'}</div><div className="text-xs text-gray-500">🖼️ Posters</div></div>
            </div>
          </div>
          <div className="rounded-xl border border-gray-200 bg-white px-4 py-3" title="Sessions des 7 derniers jours (compteur interne anonyme)">
            <div className="text-xs uppercase tracking-wide text-gray-400 mb-2">Visites 7 jours</div>
            <div className="flex flex-wrap gap-x-5 gap-y-1">
              <div><div className="text-lg font-semibold leading-tight">{totals.visits?.organic ?? '—'}</div><div className="text-xs text-gray-500">Organique</div></div>
              <div><div className="text-lg font-semibold leading-tight">{totals.visits?.social ?? '—'}</div><div className="text-xs text-gray-500">Social</div></div>
              <div><div className="text-lg font-semibold leading-tight">{totals.visits?.ai ?? '—'}</div><div className="text-xs text-gray-500">IA</div></div>
              <div><div className="text-lg font-semibold leading-tight">{totals.visits?.direct ?? '—'}</div><div className="text-xs text-gray-500">Direct</div></div>
            </div>
          </div>
        </div>

        {/* 🔍 Recherche + onglets + pastilles de filtre */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="inline-flex overflow-hidden rounded-lg border border-gray-200 bg-white text-sm">
            <button type="button" onClick={() => setView('lost')}
              className={`px-4 py-1.5 ${view === 'lost' ? 'bg-emerald-600 text-white font-medium' : 'text-gray-600 hover:bg-gray-50'}`}>
              Lost ({lostCount})
            </button>
            <button type="button" onClick={() => setView('found')}
              className={`px-4 py-1.5 ${view === 'found' ? 'bg-emerald-600 text-white font-medium' : 'text-gray-600 hover:bg-gray-50'}`}>
              Found ({foundCount})
            </button>
          </div>

          {view === 'lost' && (
            <>
              <button type="button" onClick={() => { setPaidOnly(v => !v); setFreeOnly(false); }}
                className={`rounded-full px-3 py-1 text-xs border ${paidOnly ? 'bg-emerald-100 border-emerald-300 text-emerald-800 font-medium' : 'border-gray-300 text-gray-600 hover:bg-gray-50'}`}>
                💳 Payés
              </button>
              <button type="button" onClick={() => { setFreeOnly(v => !v); setPaidOnly(false); }}
                className={`rounded-full px-3 py-1 text-xs border ${freeOnly ? 'bg-gray-200 border-gray-400 text-gray-800 font-medium' : 'border-gray-300 text-gray-600 hover:bg-gray-50'}`}>
                Gratuits
              </button>
              <button type="button" onClick={() => setNoFollowupOnly(v => !v)}
                title="Dossiers payés dont le compte rendu n'a pas encore été envoyé"
                className={`rounded-full px-3 py-1 text-xs border ${noFollowupOnly ? 'bg-blue-100 border-blue-300 text-blue-800 font-medium' : 'border-gray-300 text-gray-600 hover:bg-gray-50'}`}>
                ✉️ Sans follow-up
              </button>
              <button type="button" onClick={() => setFirstCityOnly(v => !v)}
                title="Premier signalement de leur ville : groupe Facebook à créer"
                className={`rounded-full px-3 py-1 text-xs border ${firstCityOnly ? 'bg-amber-100 border-amber-300 text-amber-800 font-medium' : 'border-gray-300 text-gray-600 hover:bg-gray-50'}`}>
                🚩 1re ville
              </button>

              <input
                type="search"
                placeholder="Titre, ville, email, référence…"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="ml-auto w-full sm:w-72 rounded-lg border border-gray-300 px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400"
              />
            </>
          )}
        </div>

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
                <div className="space-y-2">
                  {paginatedLost.map((item) => {
                    const ref = isFiveDigits(item.public_id || null) ? String(item.public_id) : null;
                    const tzState = tzForState(item.state_id);
                    const createdUtcIso = toUtcIsoPlus00(item.created_at); // ← conservé mais non affiché
                    const createdLocalState = formatInTimeZone(item.created_at, tzState);
                    const createdFrance = formatInTimeZone(item.created_at, 'Europe/Paris');
                    const publicUrl = getPublicUrlFromRow(item);

                    const followupSent = !!item.followup_email_sent;

                    const isOpen = openId === item.id;
                    const isPaid = Number(item.contribution || 0) > 0;
                    const cityClean = String(item.city || '—').replace(/\s*\([^)]*\)\s*$/, '');

                    return (
                      <div key={item.id} className={`bg-white border rounded-xl shadow-sm transition ${isOpen ? 'border-emerald-300' : 'border-gray-200'} ${!isPaid && !isOpen ? 'opacity-70' : ''}`}>
                        {/* ── Ligne compacte (cliquer pour déplier) ── */}
                        <div
                          className="flex cursor-pointer items-center gap-3 px-4 py-3"
                          onClick={() => setOpenId(isOpen ? null : item.id)}
                        >
                          <div className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-gray-100 text-lg">
                            {item.object_photo ? (
                              <Image src={item.object_photo} alt="" width={40} height={40} className="h-10 w-10 rounded-lg object-cover" />
                            ) : (
                              catIcon(item.primary_category)
                            )}
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="flex flex-wrap items-center gap-2">
                              <span className="truncate font-medium text-gray-900">{item.title || item.description || 'Untitled'}</span>
                              {isPaid ? (
                                <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[11px] font-medium text-emerald-800">{item.contribution} $</span>
                              ) : (
                                <span className="rounded-full border border-gray-300 px-2 py-0.5 text-[11px] text-gray-500">gratuit</span>
                              )}
                              {followupSent && (
                                <span
                                  className="rounded-full bg-blue-100 px-2 py-0.5 text-[11px] font-medium text-blue-800"
                                  title={`Follow-up envoyé${item.followup_email_sent_at ? ` • ${new Date(item.followup_email_sent_at).toLocaleString()}` : ''}${item.followup_email_to ? ` → ${item.followup_email_to}` : ''}`}
                                >
                                  follow-up ✓
                                </span>
                              )}
                              {(item as any).first_in_city && !(item as any).fb_group_done && (
                                <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[11px] font-medium text-amber-800" title="Premier signalement de cette ville : groupe FB à créer">
                                  🚩 1re ville
                                </span>
                              )}
                            </div>
                            <div className="truncate text-xs text-gray-500">
                              #{ref ?? '—'} · {cityClean}{item.state_id ? `, ${item.state_id}` : ''} · perdu le {item.date || '—'}
                              {item.first_name ? ` · ${item.first_name} ${(item.last_name || '').charAt(0)}${item.last_name ? '.' : ''}` : ''}
                            </div>
                          </div>
                          {item.paid && (
                            <a
                              href={`/admin/case/${encodeURIComponent(item.id)}`}
                              onClick={(e) => e.stopPropagation()}
                              className="hidden shrink-0 items-center rounded-md bg-emerald-600 px-3 py-1.5 text-sm font-medium text-white hover:brightness-110 sm:inline-flex"
                              title="Dossier : échanges, assistant IA, compte rendu, stickers"
                            >
                              🗂️ Ouvrir le dossier
                            </a>
                          )}
                          <span className="shrink-0 text-gray-400">{isOpen ? '▲' : '▼'}</span>
                        </div>

                        {/* ── Panneau détaillé ── */}
                        {isOpen && (
                        <div className="space-y-4 border-t border-gray-100 px-4 py-4">
                        {item.paid && (
                          <a
                            href={`/admin/case/${encodeURIComponent(item.id)}`}
                            className="inline-flex items-center rounded-md bg-emerald-600 px-3 py-1.5 text-sm font-medium text-white hover:brightness-110 sm:hidden"
                          >
                            🗂️ Ouvrir le dossier
                          </a>
                        )}
                        <div className="grid gap-4 lg:grid-cols-2">
                        <div>
                        <div className="text-sm text-gray-600 mb-3">
                          <div className="space-y-0.5">
                            <div><strong>Créé :</strong> {createdLocalState} <span className="text-gray-400">(heure locale)</span></div>
                            <div className="text-gray-500">{createdFrance} (France)</div>
                          </div>
                          {(item.date || item.time_slot) && (
                            <div className="mt-1"><strong>Date of loss:</strong> {item.date || '—'} {item.time_slot ? `(${item.time_slot})` : ''}</div>
                          )}
                        </div>
                        {item.description && (
                          <div className="mb-2 text-sm text-gray-700 whitespace-pre-wrap">{item.description}</div>
                        )}
                        {(item as any).circumstances && (
                          <div className="text-sm text-gray-600 mb-2">
                            <strong>Circumstances:</strong> {(item as any).circumstances}
                          </div>
                        )}
                        <div className="text-sm text-gray-700 mb-2">
                          <strong>{[item.first_name, item.last_name].filter(Boolean).join(' ') || '—'}</strong>
                          {item.email ? ` · ${item.email}` : ''}
                        </div>
                        {/* ✅ Champs client éditables (tél, adresse, DOB, détail privé) */}
                        <ClientFieldsEditor item={item} />
                        </div>
                        <div>


                        {/* ✅ État de la veille IA + actions */}
                        <div className="rounded-lg border border-gray-200 bg-gray-50 p-3 text-xs text-gray-600">
                          <div className="mb-2 text-[11px] font-medium uppercase tracking-wide text-gray-400">Veille IA</div>
                          <div className="mb-2 flex flex-wrap items-center gap-3">
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

                          <button
                            type="button"
                            onClick={() => runOnlineSearch(item.id)}
                            disabled={searchingId === item.id}
                            className="inline-flex items-center rounded-md bg-blue-600 text-white px-3 py-1.5 text-sm font-medium hover:brightness-110 disabled:opacity-50"
                            title="Lancer la recherche en ligne pour ce dossier"
                          >
                            {searchingId === item.id ? 'Recherche…' : '🔎 Rechercher en ligne'}
                          </button>

                          {searchResults[item.id] && (
                            <div className="mt-2 w-full text-xs">
                              {searchResults[item.id].length === 0 ? (
                                <div className="text-gray-500">Aucun candidat crédible trouvé pour l&apos;instant.</div>
                              ) : (
                                <ul className="list-none space-y-2 pl-0">
                                  {searchResults[item.id].map((c: any, i: number) => (
                                    <li key={i} className="border-l-2 border-blue-200 pl-2">
                                      <span className={c.verdict === 'yes' ? 'font-semibold text-green-700' : 'font-semibold text-amber-700'}>
                                        {String(c.verdict).toUpperCase()} {c.confidence}%
                                      </span>{' '}
                                      <a href={c.link} target="_blank" rel="noreferrer" className="text-blue-600 underline">{c.title}</a>
                                      <span className="text-gray-400"> ({c.source})</span>
                                      {c.snippet && <div className="text-gray-600">{c.snippet}</div>}
                                      <div className="text-xs text-gray-500">🤖 {c.reason}</div>
                                    </li>
                                  ))}
                                </ul>
                              )}
                            </div>
                          )}
                        </div>
                        </div>
                        </div>

                        <div className="flex flex-wrap items-center gap-3 border-t border-gray-100 pt-3">
                          <span className="text-sm text-gray-700"><strong>Contribution:</strong> {item.contribution ?? 0} $</span>

                          <button
                            type="button"
                            onClick={async () => {
                              const label = item.title || item.description || item.id;
                              if (!window.confirm(`Supprimer définitivement ce signalement ?\n\n"${label}"\n\nIrréversible (dossier, messages et pistes de veille inclus).`)) return;
                              try {
                                const r = await fetch('/api/admin/delete-report', {
                                  method: 'POST',
                                  headers: { 'Content-Type': 'application/json' },
                                  body: JSON.stringify({ id: item.id }),
                                });
                                const j = await r.json();
                                if (!r.ok) throw new Error(j?.error || r.statusText);
                                setLostItems((prev) => prev.filter((it) => it.id !== item.id));
                              } catch (e: any) {
                                alert(`Erreur suppression : ${String(e?.message || e)}`);
                              }
                            }}
                            className="inline-flex items-center rounded-md bg-red-600 text-white px-2.5 py-1.5 text-sm font-medium hover:brightness-110"
                            title="Supprimer ce signalement (tests)"
                          >
                            🗑
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

                          {item.first_in_city && !item.fb_group_done && (
                            <a
                              href={`/admin/group-kit?city=${encodeURIComponent(
                                String(item.city || '').replace(/\s*\([^)]*\)\s*$/, '').trim()
                              )}&state=${encodeURIComponent(item.state_id || '')}`}
                              target="_blank"
                              rel="noreferrer"
                              className="inline-flex items-center rounded-md bg-teal-600 text-white px-3 py-1.5 text-sm font-medium hover:brightness-110"
                              title="1ère fois pour cette ville — générer le kit de groupe Facebook"
                            >
                              👥 Kit groupe FB
                            </a>
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

                        </div>
                        </div>
                        )}
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
