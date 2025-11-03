// app/poster-preview/page.tsx
"use client";

import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import ReportLostPoster from "@/components/ReportLostPoster";

type StationRow = {
  slug: string;                // p.ex. "chicago-north"
  display_name: string;        // p.ex. "Chicago North Police Department"
  url_path: string | null;     // p.ex. "reportlost.org/chicago-north" (affiché sous le QR)
  qr_target_url: string | null;// p.ex. "https://reportlost.org/report?tab=lost&station=chicago-north"
  brand_blue?: string | null;
  brand_green?: string | null;
};

// ——— Fallbacks si Supabase n'est pas encore configuré
const FALLBACK: StationRow = {
  slug: "chicago-north",
  display_name: "Chicago North Police Department",
  url_path: "reportlost.org/chicago-north",
  qr_target_url: "https://reportlost.org/report?tab=lost&station=chicago-north",
  brand_blue: "#1E4B86",
  brand_green: "#12A150",
};

export default function PosterPreviewPage() {
  const sp = useSearchParams();
  const slug = sp.get("station") || "chicago-north";

  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  // État éditable (live preview)
  const [row, setRow] = useState<StationRow>(FALLBACK);

  // 1) Charger depuis API (si tu as branché Supabase)
  useEffect(() => {
    let alive = true;
    (async () => {
      setLoading(true);
      setErr(null);
      try {
        const res = await fetch(`/api/stations/get?slug=${encodeURIComponent(slug)}`, { cache: "no-store" });
        if (!res.ok) throw new Error(`GET /api/stations/get?slug=${slug} => ${res.status}`);
        const payload = await res.json();
        if (!alive) return;

        // si pas de ligne en base, on garde les fallbacks mais on remplace le slug dedans
        const data: StationRow | null = payload?.data || null;
        if (data) {
          setRow({
            slug: data.slug,
            display_name: data.display_name,
            url_path: data.url_path || `reportlost.org/${data.slug}`,
            qr_target_url:
              data.qr_target_url ||
              `https://reportlost.org/report?tab=lost&station=${data.slug}`,
            brand_blue: data.brand_blue || "#1E4B86",
            brand_green: data.brand_green || "#12A150",
          });
        } else {
          setRow({
            ...FALLBACK,
            slug,
            url_path: `reportlost.org/${slug}`,
            qr_target_url: `https://reportlost.org/report?tab=lost&station=${slug}`,
          });
        }
      } catch (e: any) {
        // Pas grave : on affiche quand même avec FALLBACK
        setErr(e?.message || "Load error");
        setRow({
          ...FALLBACK,
          slug,
          url_path: `reportlost.org/${slug}`,
          qr_target_url: `https://reportlost.org/report?tab=lost&station=${slug}`,
        });
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, [slug]);

  // 2) Handlers simples (MAJ en direct → le QR s’affiche immédiatement)
  const setField = (k: keyof StationRow) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setRow((r) => ({ ...r, [k]: e.target.value }));

  // 3) Enregistrer en base (si API branchée)
  const onSave = async () => {
    try {
      const res = await fetch("/api/stations/update", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(row),
      });
      const j = await res.json().catch(() => null);
      if (!res.ok || !j?.ok) throw new Error(j?.error || `Save failed (${res.status})`);
      alert("Saved!");
    } catch (e: any) {
      alert(e?.message || "Save error");
    }
  };

  // Valeurs sûres pour le poster (NE JAMAIS passer de valeur vide au <QRCode />)
  const qrValue = useMemo(
    () => row.qr_target_url?.trim() || `https://reportlost.org/report?tab=lost&station=${row.slug}`,
    [row.qr_target_url, row.slug]
  );
  const urlDisplay = useMemo(
    () => row.url_path?.trim() || `reportlost.org/${row.slug}`,
    [row.url_path, row.slug]
  );

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      <h1 className="text-2xl font-bold">Poster editor</h1>
      {loading && <div>Loading…</div>}
      {err && <div className="text-red-600 text-sm">Warning: {err}</div>}

      {/* Panneau d’édition */}
      <div className="grid md:grid-cols-2 gap-6">
        <div className="bg-white border rounded-xl p-4 space-y-3">
          <div>
            <label className="block text-sm font-medium">Station slug</label>
            <input className="mt-1 w-full border rounded px-3 py-2"
                   value={row.slug} onChange={setField("slug")} />
            <p className="text-xs text-gray-500">Paramètre d’URL: ?station={row.slug}</p>
          </div>

          <div>
            <label className="block text-sm font-medium">Display name</label>
            <input className="mt-1 w-full border rounded px-3 py-2"
                   value={row.display_name} onChange={setField("display_name")} />
          </div>

          <div>
            <label className="block text-sm font-medium">URL affichée sous le QR</label>
            <input className="mt-1 w-full border rounded px-3 py-2"
                   value={urlDisplay}
                   onChange={(e) => setRow((r) => ({ ...r, url_path: e.target.value }))} />
            <p className="text-xs text-gray-500">Ex: reportlost.org/{row.slug}</p>
          </div>

          <div>
            <label className="block text-sm font-medium">QR target URL (redirection)</label>
            <input className="mt-1 w-full border rounded px-3 py-2"
                   value={qrValue}
                   onChange={(e) => setRow((r) => ({ ...r, qr_target_url: e.target.value }))} />
            <p className="text-xs text-gray-500">
              Par défaut: https://reportlost.org/report?tab=lost&station={row.slug}
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium">Brand blue</label>
              <input className="mt-1 w-full border rounded px-3 py-2"
                     value={row.brand_blue || ""}
                     onChange={setField("brand_blue")} />
            </div>
            <div>
              <label className="block text-sm font-medium">Brand green</label>
              <input className="mt-1 w-full border rounded px-3 py-2"
                     value={row.brand_green || ""}
                     onChange={setField("brand_green")} />
            </div>
          </div>

          <div className="pt-2 flex gap-2">
            <button onClick={onSave}
                    className="px-3 py-2 rounded bg-emerald-600 text-white hover:brightness-110">
              Save to Supabase
            </button>
            <a href={`/poster-preview?station=${encodeURIComponent(row.slug)}`}
               className="px-3 py-2 rounded border">Reload with slug</a>
          </div>
        </div>

        {/* Aperçu en direct */}
        <div className="bg-white border rounded-xl p-3">
          <ReportLostPoster
            departmentName={row.display_name}
            url={urlDisplay}
            qrValue={qrValue}
            brandBlue={row.brand_blue || undefined}
            brandGreen={row.brand_green || undefined}
            // tu peux aussi exposer les titres/textes ici si tu veux les éditer
            showDownloadButtons
          />
        </div>
      </div>
    </div>
  );
}
