'use client';

import { useEffect, useState } from 'react';

type Kit = {
  cityUrl: string;
  groupName: string;
  description: string;
  posts: string[];
  foundPosts: string[];
  foundLeadsCount?: number;
  serperConfigured?: boolean;
};

function CopyBlock({ label, text }: { label: string; text: string }) {
  const [copied, setCopied] = useState(false);
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      /* ignore */
    }
  };
  return (
    <div className="border border-gray-200 rounded-lg p-4 bg-white">
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm font-semibold text-gray-700">{label}</span>
        <button
          type="button"
          onClick={copy}
          className="text-xs rounded bg-blue-600 text-white px-3 py-1 hover:brightness-110"
        >
          {copied ? 'Copié ✓' : 'Copier'}
        </button>
      </div>
      <div className="text-sm text-gray-800 whitespace-pre-wrap">{text}</div>
    </div>
  );
}

export default function GroupKitPage() {
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [kit, setKit] = useState<Kit | null>(null);
  const [fbDone, setFbDone] = useState<boolean | null>(null);

  // Liste de travail : villes par population + état du groupe FB
  type CityRow = { city: string; state: string; population: number | null; fb_group_done: boolean };
  const [cities, setCities] = useState<CityRow[]>([]);
  const [citySearch, setCitySearch] = useState('');

  const loadCities = async (q = '') => {
    try {
      const r = await fetch(`/api/admin/city-guide?cities=1&limit=300&q=${encodeURIComponent(q)}`, {
        cache: 'no-store',
      });
      const j = await r.json();
      if (r.ok) setCities(j.cities || []);
    } catch {}
  };

  useEffect(() => {
    loadCities();
  }, []);

  useEffect(() => {
    const t = setTimeout(() => loadCities(citySearch), 350);
    return () => clearTimeout(t);
  }, [citySearch]);

  const toggleCityDone = async (row: CityRow) => {
    const next = !row.fb_group_done;
    setCities((prev) =>
      prev.map((c) => (c.city === row.city && c.state === row.state ? { ...c, fb_group_done: next } : c))
    );
    if (city.trim().toLowerCase() === row.city.toLowerCase() && state.trim().toUpperCase() === row.state) {
      setFbDone(next);
    }
    try {
      await fetch('/api/admin/fb-group-done', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ city: row.city, state: row.state, done: next }),
      });
    } catch {
      setCities((prev) =>
        prev.map((c) => (c.city === row.city && c.state === row.state ? { ...c, fb_group_done: !next } : c))
      );
    }
  };

  const loadFbDone = async (c: string, s: string) => {
    try {
      const r = await fetch(
        `/api/admin/fb-group-done?city=${encodeURIComponent(c)}&state=${encodeURIComponent(s)}`,
        { cache: 'no-store' }
      );
      const j = await r.json();
      setFbDone(r.ok ? !!j.done : null);
    } catch {
      setFbDone(null);
    }
  };

  const toggleFbDone = async () => {
    const next = !fbDone;
    setFbDone(next);
    try {
      await fetch('/api/admin/fb-group-done', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ city: city.trim(), state: state.trim(), done: next }),
      });
    } catch {
      setFbDone(!next); // rollback
    }
  };

  const generate = async (cityArg?: string, stateArg?: string) => {
    const c = (cityArg ?? city).trim();
    const s = (stateArg ?? state).trim();
    if (!c || s.length !== 2) return;
    setLoading(true);
    setErr(null);
    setKit(null);
    try {
      const res = await fetch('/api/admin/group-kit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ city: c, state: s }),
      });
      const j = await res.json().catch(() => null);
      if (!res.ok || !j?.ok) {
        setErr(j?.error || `Erreur ${res.status}`);
        return;
      }
      setKit(j);
      loadFbDone(c, s);
    } catch (e: any) {
      setErr(String(e?.message || e));
    } finally {
      setLoading(false);
    }
  };

  // Pré-remplissage depuis l'URL (?city=&state=) + génération automatique
  useEffect(() => {
    const sp = new URLSearchParams(window.location.search);
    const c = sp.get('city') || '';
    const s = (sp.get('state') || '').toUpperCase();
    if (c) setCity(c);
    if (s) setState(s);
    if (c && s.length === 2) {
      generate(c, s);
      loadFbDone(c, s);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const bannerUrl = `/api/banner?city=${encodeURIComponent(city.trim())}&state=${encodeURIComponent(state.trim())}`;
  const downloadBanner = async () => {
    try {
      const res = await fetch(bannerUrl, { cache: 'no-store' });
      const blob = await res.blob();
      const u = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = u;
      a.download = `banner-${city.trim()}-${state.trim()}.png`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(u);
    } catch {
      window.open(bannerUrl, '_blank');
    }
  };

  return (
    <main className="max-w-3xl mx-auto p-6">
      <a
        href="/admin"
        className="mb-4 inline-flex items-center gap-1 rounded-md border border-gray-200 bg-white px-3 py-1.5 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-100"
      >
        ← Retour à l’admin
      </a>
      <div className="mb-1 flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-bold text-gray-900">Kit de groupe Facebook</h1>
        {city.trim() && state.trim().length === 2 && fbDone !== null && (
          <label
            className={`inline-flex cursor-pointer items-center gap-2 rounded-lg border px-3 py-2 text-sm font-medium ${
              fbDone ? 'border-green-300 bg-green-50 text-green-800' : 'border-gray-200 bg-white text-gray-700'
            }`}
          >
            <input type="checkbox" checked={!!fbDone} onChange={toggleFbDone} />
            {fbDone ? '✅ Groupe Facebook créé pour cette ville' : 'Groupe Facebook créé ?'}
          </label>
        )}
      </div>
      <p className="text-gray-600 text-sm mb-6">
        Entre une ville et son État (2 lettres) : l&apos;IA génère le nom du groupe, la description (avec le lien
        reportlost), 3 posts de démarrage, et 3 posts « FOUND ✅ » basés sur de vrais objets trouvés publics.
      </p>

      <div className="flex flex-wrap items-end gap-3 mb-6">
        <div>
          <label className="block text-xs font-semibold text-gray-600 mb-1">Ville</label>
          <input
            value={city}
            onChange={(e) => setCity(e.target.value)}
            placeholder="Pasadena"
            className="border border-gray-300 rounded-lg px-3 py-2 text-sm"
          />
        </div>
        <div>
          <label className="block text-xs font-semibold text-gray-600 mb-1">État (2 lettres)</label>
          <input
            value={state}
            onChange={(e) => setState(e.target.value.toUpperCase())}
            placeholder="CA"
            maxLength={2}
            className="border border-gray-300 rounded-lg px-3 py-2 text-sm w-20"
          />
        </div>
        <button
          type="button"
          onClick={() => generate()}
          disabled={loading || !city.trim() || state.trim().length !== 2}
          className="rounded-lg bg-green-600 text-white font-semibold px-5 py-2 text-sm hover:brightness-110 disabled:opacity-50"
        >
          {loading ? 'Génération…' : 'Générer le kit'}
        </button>
      </div>

      {err && <div className="text-sm text-red-600 mb-4">Erreur : {err}</div>}

      {city.trim() && state.trim().length === 2 && (
        <div className="mb-8">
          <h2 className="text-lg font-semibold text-gray-800 mb-2">Bannière du groupe</h2>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={bannerUrl}
            alt="Bannière Lost & Found"
            className="w-full max-w-xl rounded-lg border border-gray-200 shadow"
          />
          <div className="mt-3 flex flex-wrap gap-3">
            <button
              type="button"
              onClick={downloadBanner}
              className="rounded-lg bg-green-600 text-white font-semibold px-5 py-2 text-sm hover:brightness-110"
            >
              ⬇️ Enregistrer la bannière
            </button>
            <a
              href="https://www.facebook.com/groups/create/"
              target="_blank"
              rel="noreferrer"
              className="rounded-lg bg-[#1877F2] text-white font-semibold px-5 py-2 text-sm hover:brightness-110"
            >
              👥 Créer le groupe Facebook ↗
            </a>
          </div>
        </div>
      )}

      {kit && (
        <div className="space-y-4">
          <CopyBlock label="Nom du groupe" text={kit.groupName} />
          <CopyBlock label="Description (avec le lien reportlost)" text={kit.description} />
          <div className="text-xs text-gray-500">Lien promu : {kit.cityUrl}</div>

          <h2 className="text-lg font-semibold text-gray-800 pt-2">📌 Post à épingler</h2>
          {kit.posts.map((p, i) => (
            <CopyBlock key={`p-${i}`} label={kit.posts.length === 1 ? "Post à épingler" : `Post ${i + 1}`} text={p} />
          ))}

          {kit.foundPosts.length > 0 ? (
            <>
              <h2 className="text-lg font-semibold text-gray-800 pt-2">Posts « FOUND ✅ » (à vérifier avant de poster)</h2>
              {kit.foundPosts.map((p, i) => (
                <CopyBlock key={`f-${i}`} label={`FOUND ${i + 1}`} text={p} />
              ))}
            </>
          ) : (
            <div className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800">
              Aucun post FOUND généré.{" "}
              {!kit.serperConfigured
                ? "⚠️ SERPER_API_KEY absente sur le serveur."
                : (kit.foundLeadsCount ?? 0) === 0
                ? "⚠️ Serper n'a renvoyé aucune piste (vérifie le solde de crédits sur serper.dev)."
                : `ℹ️ ${kit.foundLeadsCount} piste(s) trouvée(s) mais aucune jugée exploitable par le modèle — régénère ou signale-le.`}
            </div>
          )}
        </div>
      )}

      {/* Liste de travail : villes par population + suivi des groupes créés */}
      <section className="mt-10 rounded-xl border border-gray-200 bg-white p-4">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-lg font-semibold text-gray-800">
            📋 Villes par population — groupes créés : {cities.filter((c) => c.fb_group_done).length}
          </h2>
          <input
            className="w-64 rounded border border-gray-300 px-3 py-2 text-sm"
            placeholder="🔍 Chercher une ville…"
            value={citySearch}
            onChange={(e) => setCitySearch(e.target.value)}
          />
        </div>
        <div className="max-h-[28rem] overflow-y-auto">
          <table className="w-full text-left text-sm">
            <thead className="sticky top-0 bg-white">
              <tr className="border-b text-xs text-gray-500">
                <th className="py-2">Ville</th>
                <th>État</th>
                <th className="text-right">Population</th>
                <th className="pl-6">Groupe FB créé</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {cities.map((c) => (
                <tr key={`${c.state}/${c.city}`} className={`border-b border-gray-100 ${c.fb_group_done ? 'bg-green-50/50' : ''}`}>
                  <td className="py-1.5">{c.city}</td>
                  <td>{c.state}</td>
                  <td className="text-right tabular-nums text-gray-600">
                    {c.population ? c.population.toLocaleString('en-US') : '—'}
                  </td>
                  <td className="pl-6">
                    <input type="checkbox" checked={c.fb_group_done} onChange={() => toggleCityDone(c)} />
                  </td>
                  <td>
                    <button
                      onClick={() => {
                        setCity(c.city);
                        setState(c.state);
                        generate(c.city, c.state);
                        window.scrollTo({ top: 0, behavior: 'smooth' });
                      }}
                      className="text-blue-600 underline"
                    >
                      Générer le kit
                    </button>
                  </td>
                </tr>
              ))}
              {cities.length === 0 && (
                <tr>
                  <td colSpan={5} className="py-4 text-center text-gray-500">
                    Aucune ville trouvée.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </main>
  );
}
