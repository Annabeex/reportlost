"use client";

// Générateur de guides ville : recherche web réelle → brouillon → relecture → publication.
// Rien n'est publié sans clic explicite. URL : /admin/city-guides

import { useEffect, useState } from "react";
import { buildCityPath } from "@/lib/slugify";

type Row = { state_id: string; city_slug: string; status: string; verified?: boolean; updated_at: string };
type CityRow = { city: string; state: string; population: number | null; guide_status: string | null };

export default function CityGuidesAdmin() {
  const [rows, setRows] = useState<Row[]>([]);
  const [totals, setTotals] = useState<{ published: number; verified: number; drafts: number } | null>(null);
  const [city, setCity] = useState("");
  const [state, setState] = useState("");
  const [busy, setBusy] = useState(false);
  const [info, setInfo] = useState<string | null>(null);

  // Éditeur
  const [current, setCurrent] = useState<{ state: string; city: string; status: string; verified?: boolean } | null>(null);
  const [guideText, setGuideText] = useState("");
  const [saveBusy, setSaveBusy] = useState(false);

  // Liste de travail (villes triées par population)
  const [cities, setCities] = useState<CityRow[]>([]);
  const [citySearch, setCitySearch] = useState("");

  async function loadList() {
    try {
      const r = await fetch("/api/admin/city-guide", { cache: "no-store" });
      const j = await r.json();
      if (r.ok) {
        setRows(j.rows || []);
        if (j.totals) setTotals(j.totals);
      }
    } catch {}
  }

  async function loadCities(q = "") {
    try {
      const r = await fetch(`/api/admin/city-guide?cities=1&q=${encodeURIComponent(q)}`, { cache: "no-store" });
      const j = await r.json();
      if (r.ok) setCities(j.cities || []);
    } catch {}
  }

  useEffect(() => {
    loadList();
    loadCities();
  }, []);

  useEffect(() => {
    const t = setTimeout(() => loadCities(citySearch), 350);
    return () => clearTimeout(t);
  }, [citySearch]);

  async function generate(cityArg?: string, stateArg?: string) {
    const c = (cityArg ?? city).trim();
    const s = (stateArg ?? state).trim();
    if (!c || s.length !== 2 || busy) return;
    if (cityArg) {
      setCity(cityArg);
      setState(stateArg || "");
    }
    setBusy(true);
    setInfo(`⏳ ${c} (${s.toUpperCase()}) : recherche web + rédaction en cours (30-60 s)…`);
    try {
      const r = await fetch("/api/admin/city-guide-generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ city: c, state: s }),
      });
      const j = await r.json();
      if (!r.ok) throw new Error(j?.error || r.statusText);
      setInfo("✅ Brouillon généré — relis-le ci-dessous puis publie.");
      setCurrent({ state: s.toUpperCase(), city: c.toLowerCase(), status: "draft" });
      setGuideText(JSON.stringify(j.guide, null, 2));
      loadList();
      loadCities(citySearch);
    } catch (e: any) {
      setInfo(`⚠️ ${String(e?.message || e)}`);
    } finally {
      setBusy(false);
    }
  }

  async function open(row: Row) {
    setInfo(null);
    const r = await fetch(
      `/api/admin/city-guide?state=${encodeURIComponent(row.state_id)}&city=${encodeURIComponent(row.city_slug)}`,
      { cache: "no-store" }
    );
    const j = await r.json();
    if (r.ok && j.row) {
      setCurrent({ state: row.state_id, city: row.city_slug, status: j.row.status, verified: j.row.verified });
      setGuideText(JSON.stringify(j.row.guide, null, 2));
    }
  }

  async function markVerified() {
    if (!current) return;
    try {
      const r = await fetch("/api/admin/city-guide", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ state: current.state, city: current.city, verified: true }),
      });
      if (!r.ok) throw new Error((await r.json())?.error || r.statusText);
      setCurrent({ ...current, verified: true });
      setInfo("✅ Marqué comme vérifié.");
      loadList();
    } catch (e: any) {
      setInfo(`⚠️ ${String(e?.message || e)}`);
    }
  }

  async function save(status?: "draft" | "published") {
    if (!current || saveBusy) return;
    let guide: any;
    try {
      guide = JSON.parse(guideText);
    } catch {
      setInfo("⚠️ JSON invalide — corrige avant d'enregistrer.");
      return;
    }
    setSaveBusy(true);
    try {
      const r = await fetch("/api/admin/city-guide", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ state: current.state, city: current.city, guide, ...(status ? { status } : {}) }),
      });
      const j = await r.json();
      if (!r.ok) throw new Error(j?.error || r.statusText);
      if (status) setCurrent({ ...current, status });
      setInfo(status === "published" ? "✅ Publié — visible sur la page ville (délai ISR ≤ 24h, ou redéploie pour tout de suite)." : "✅ Enregistré.");
      loadList();
      loadCities(citySearch);
    } catch (e: any) {
      setInfo(`⚠️ ${String(e?.message || e)}`);
    } finally {
      setSaveBusy(false);
    }
  }

  const previewUrl = current
    ? `/admin/city-guides/preview?state=${encodeURIComponent(current.state)}&city=${encodeURIComponent(current.city)}`
    : "#";

  return (
    <main className="mx-auto max-w-5xl p-6">
      <a
        href="/admin"
        className="mb-4 inline-flex items-center gap-1 rounded-md border border-gray-200 bg-white px-3 py-1.5 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-100"
      >
        ← Retour à l’admin
      </a>
      <h1 className="mb-1 text-2xl font-bold text-gray-900">Guides ville</h1>
      <p className="mb-2 text-sm text-gray-600">
        Génère un guide enrichi (recherche Google réelle, liens vérifiables), relis-le, corrige, puis publie.
      </p>
      {totals && (
        <p className="mb-6 text-sm font-medium">
          <span className="text-green-700">🏙️ {totals.published} villes publiées</span>
          <span className="mx-2 text-gray-300">·</span>
          <span className="text-emerald-700">✓ {totals.verified} vérifiées</span>
          <span className="mx-2 text-gray-300">·</span>
          <span className="text-amber-600">📝 {totals.drafts} brouillons</span>
          <span className="mx-2 text-gray-300">·</span>
          <span className="text-gray-500">objectif : 6 000</span>
        </p>
      )}

      <div className="mb-6 flex flex-wrap items-end gap-3 rounded-xl bg-white p-4 shadow-sm">
        <div>
          <label className="block text-xs font-medium text-gray-500">Ville</label>
          <input
            className="mt-1 rounded border px-3 py-2 text-sm"
            placeholder="Belmar"
            value={city}
            onChange={(e) => setCity(e.target.value)}
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-500">État (2 lettres)</label>
          <input
            className="mt-1 w-24 rounded border px-3 py-2 text-sm uppercase"
            placeholder="NJ"
            maxLength={2}
            value={state}
            onChange={(e) => setState(e.target.value)}
          />
        </div>
        <button
          onClick={() => generate()}
          disabled={busy || !city.trim() || state.trim().length !== 2}
          className="rounded bg-blue-600 px-4 py-2 text-sm font-medium text-white disabled:opacity-40"
        >
          {busy ? "Génération…" : "🔎 Générer (recherche web)"}
        </button>
        {info && <span className="text-sm">{info}</span>}
      </div>

      {/* Liste de travail : villes par population décroissante */}
      <div className="mb-6 rounded-xl bg-white p-4 shadow-sm">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
          <h2 className="font-semibold">📋 Villes à traiter (par population)</h2>
          <input
            className="w-64 rounded border px-3 py-2 text-sm"
            placeholder="🔍 Chercher une ville…"
            value={citySearch}
            onChange={(e) => setCitySearch(e.target.value)}
          />
        </div>
        <div className="max-h-96 overflow-y-auto">
          <table className="w-full text-left text-sm">
            <thead className="sticky top-0 bg-white">
              <tr className="border-b text-xs text-gray-500">
                <th className="py-2">Ville</th>
                <th>État</th>
                <th className="text-right">Population</th>
                <th className="pl-6">Guide</th>
              </tr>
            </thead>
            <tbody>
              {cities.map((c) => {
                const done = c.guide_status === "published";
                const draft = c.guide_status === "draft";
                return (
                  <tr key={`${c.state}/${c.city}`} className="border-b border-gray-100">
                    <td className="py-1.5">{c.city}</td>
                    <td>{c.state}</td>
                    <td className="text-right tabular-nums text-gray-600">
                      {c.population ? c.population.toLocaleString("en-US") : "—"}
                    </td>
                    <td className="pl-6">
                      {c.guide_status === "legacy" ? (
                        <span className="text-xs font-medium text-gray-400" title="Page dédiée codée en dur, rien à générer">
                          🏛 page dédiée
                        </span>
                      ) : done ? (
                        <button
                          onClick={() => open({ state_id: c.state, city_slug: c.city.toLowerCase(), status: "published", updated_at: "" })}
                          className="font-medium text-green-700"
                          title="Publié — cliquer pour ouvrir"
                        >
                          ✅ publié
                        </button>
                      ) : draft ? (
                        <button
                          onClick={() => open({ state_id: c.state, city_slug: c.city.toLowerCase(), status: "draft", updated_at: "" })}
                          className="font-medium text-amber-600"
                          title="Brouillon en attente — cliquer pour ouvrir"
                        >
                          📝 brouillon
                        </button>
                      ) : (
                        <button
                          onClick={() => generate(c.city, c.state)}
                          disabled={busy}
                          className="rounded bg-blue-600 px-2 py-0.5 text-xs font-medium text-white disabled:opacity-40"
                        >
                          Générer
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
              {cities.length === 0 && (
                <tr>
                  <td colSpan={4} className="py-4 text-center text-gray-500">
                    Aucune ville trouvée.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {current && (
        <div className="mb-6 rounded-xl bg-white p-4 shadow-sm">
          <div className="mb-2 flex flex-wrap items-center gap-3">
            <h2 className="font-semibold">
              {current.city} ({current.state}) —{" "}
              <span className={current.status === "published" ? "text-green-700" : "text-amber-600"}>
                {current.status === "published" ? "publié" : "brouillon"}
              </span>
              {current.status === "published" && !current.verified && (
                <span className="ml-2 rounded-full bg-orange-100 px-2 py-0.5 text-xs font-semibold text-orange-700">
                  ⚠ non vérifié
                </span>
              )}
            </h2>
            {current.status === "published" && !current.verified && (
              <button
                onClick={markVerified}
                className="rounded bg-orange-500 px-3 py-1 text-xs font-medium text-white hover:brightness-110"
                title="J'ai relu cette page, elle est bonne telle quelle"
              >
                ✓ Marquer vérifié
              </button>
            )}
            <a href={previewUrl} target="_blank" rel="noreferrer" className="text-sm text-blue-600 underline">
              👁 Aperçu
            </a>
            {current.status === "published" && (
              <a
                href={buildCityPath(current.state, current.city)}
                target="_blank"
                rel="noreferrer"
                className="text-sm font-medium text-green-700 underline"
              >
                🌐 Voir la page
              </a>
            )}
            <button
              onClick={async () => {
                if (!current) return;
                setInfo("⏳ Génération de l'image (10-20 s)…");
                try {
                  const r = await fetch("/api/admin/city-image-generate", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ city: current.city, state: current.state }),
                  });
                  const j = await r.json();
                  if (!r.ok) throw new Error(j?.error || r.statusText);
                  setInfo("✅ Image générée — visible dans l'aperçu et sur la page (délai ISR).");
                } catch (e: any) {
                  setInfo(`⚠️ ${String(e?.message || e)}`);
                }
              }}
              className="rounded bg-purple-600 px-3 py-1 text-xs font-medium text-white hover:brightness-110"
              title="(Re)génère uniquement la photo IA de la ville, sans toucher au texte"
            >
              🖼️ Générer l'image
            </button>
          </div>
          <textarea
            className="h-96 w-full rounded border p-3 font-mono text-xs"
            value={guideText}
            onChange={(e) => setGuideText(e.target.value)}
            spellCheck={false}
          />
          <div className="mt-3 flex flex-wrap gap-3">
            <button
              onClick={() => save()}
              disabled={saveBusy}
              className="rounded bg-gray-800 px-4 py-2 text-sm font-medium text-white disabled:opacity-40"
            >
              💾 Enregistrer
            </button>
            {current.status !== "published" ? (
              <button
                onClick={() => save("published")}
                disabled={saveBusy}
                className="rounded bg-green-600 px-4 py-2 text-sm font-medium text-white disabled:opacity-40"
              >
                🚀 Publier
              </button>
            ) : (
              <button
                onClick={() => save("draft")}
                disabled={saveBusy}
                className="rounded bg-amber-600 px-4 py-2 text-sm font-medium text-white disabled:opacity-40"
              >
                ⏸ Dépublier
              </button>
            )}
          </div>
        </div>
      )}

      <div className="rounded-xl bg-white p-4 shadow-sm">
        <h2 className="mb-3 font-semibold">Guides existants ({rows.length})</h2>
        {rows.length === 0 ? (
          <p className="text-sm text-gray-500">Aucun guide pour l’instant — génère ta première ville ci-dessus.</p>
        ) : (
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b text-xs text-gray-500">
                <th className="py-2">Ville</th>
                <th>État</th>
                <th>Statut</th>
                <th>Mis à jour</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={`${r.state_id}/${r.city_slug}`} className="border-b border-gray-100">
                  <td className="py-2 capitalize">{r.city_slug}</td>
                  <td>{r.state_id}</td>
                  <td>
                    <span className={r.status === "published" ? "text-green-700" : "text-amber-600"}>{r.status}</span>
                    {r.status === "published" && !r.verified && (
                      <span className="ml-1 rounded-full bg-orange-100 px-1.5 py-0.5 text-[10px] font-semibold text-orange-700">
                        à vérifier
                      </span>
                    )}
                  </td>
                  <td className="text-gray-500">{new Date(r.updated_at).toLocaleString("fr-FR")}</td>
                  <td className="space-x-3">
                    <button onClick={() => open(r)} className="text-blue-600 underline">
                      Ouvrir
                    </button>
                    {r.status === "published" && (
                      <a
                        href={buildCityPath(r.state_id, r.city_slug)}
                        target="_blank"
                        rel="noreferrer"
                        className="text-green-700 underline"
                      >
                        🌐 Voir
                      </a>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </main>
  );
}
