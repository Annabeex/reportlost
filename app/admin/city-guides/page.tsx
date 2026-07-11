"use client";

// Générateur de guides ville : recherche web réelle → brouillon → relecture → publication.
// Rien n'est publié sans clic explicite. URL : /admin/city-guides

import { useEffect, useState } from "react";

type Row = { state_id: string; city_slug: string; status: string; updated_at: string };

export default function CityGuidesAdmin() {
  const [rows, setRows] = useState<Row[]>([]);
  const [city, setCity] = useState("");
  const [state, setState] = useState("");
  const [busy, setBusy] = useState(false);
  const [info, setInfo] = useState<string | null>(null);

  // Éditeur
  const [current, setCurrent] = useState<{ state: string; city: string; status: string } | null>(null);
  const [guideText, setGuideText] = useState("");
  const [saveBusy, setSaveBusy] = useState(false);

  async function loadList() {
    try {
      const r = await fetch("/api/admin/city-guide", { cache: "no-store" });
      const j = await r.json();
      if (r.ok) setRows(j.rows || []);
    } catch {}
  }
  useEffect(() => {
    loadList();
  }, []);

  async function generate() {
    if (!city.trim() || state.trim().length !== 2 || busy) return;
    setBusy(true);
    setInfo("⏳ Recherche web + rédaction en cours (30-60 s)…");
    try {
      const r = await fetch("/api/admin/city-guide-generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ city: city.trim(), state: state.trim() }),
      });
      const j = await r.json();
      if (!r.ok) throw new Error(j?.error || r.statusText);
      setInfo("✅ Brouillon généré — relis-le ci-dessous puis publie.");
      setCurrent({ state: state.trim().toUpperCase(), city: city.trim().toLowerCase(), status: "draft" });
      setGuideText(JSON.stringify(j.guide, null, 2));
      loadList();
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
      setCurrent({ state: row.state_id, city: row.city_slug, status: j.row.status });
      setGuideText(JSON.stringify(j.row.guide, null, 2));
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
      <p className="mb-6 text-sm text-gray-600">
        Génère un guide enrichi (recherche Google réelle, liens vérifiables), relis-le, corrige, puis publie.
      </p>

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
          onClick={generate}
          disabled={busy || !city.trim() || state.trim().length !== 2}
          className="rounded bg-blue-600 px-4 py-2 text-sm font-medium text-white disabled:opacity-40"
        >
          {busy ? "Génération…" : "🔎 Générer (recherche web)"}
        </button>
        {info && <span className="text-sm">{info}</span>}
      </div>

      {current && (
        <div className="mb-6 rounded-xl bg-white p-4 shadow-sm">
          <div className="mb-2 flex flex-wrap items-center gap-3">
            <h2 className="font-semibold">
              {current.city} ({current.state}) —{" "}
              <span className={current.status === "published" ? "text-green-700" : "text-amber-600"}>
                {current.status === "published" ? "publié" : "brouillon"}
              </span>
            </h2>
            <a href={previewUrl} target="_blank" rel="noreferrer" className="text-sm text-blue-600 underline">
              👁 Aperçu
            </a>
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
                  </td>
                  <td className="text-gray-500">{new Date(r.updated_at).toLocaleString("fr-FR")}</td>
                  <td>
                    <button onClick={() => open(r)} className="text-blue-600 underline">
                      Ouvrir
                    </button>
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
