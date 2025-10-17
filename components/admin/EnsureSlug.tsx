'use client';

import { useEffect, useRef, useState } from 'react';

type Props = {
  reportId: string;          // id Supabase
  initialSlug?: string | null;
  onSlugReady?: (slug: string) => void;
  auto?: boolean;            // true = auto-génère si manquant (par défaut)
};

export default function EnsureSlug({
  reportId,
  initialSlug,
  onSlugReady,
  auto = true,
}: Props) {
  const [slug, setSlug] = useState<string | null | undefined>(initialSlug);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const didRunRef = useRef(false); // évite double appel en React StrictMode

  const generate = async () => {
    if (!reportId) return;
    setLoading(true);
    setErr(null);
    try {
      const res = await fetch(`/api/generate-report-slug?id=${encodeURIComponent(reportId)}`, {
        method: 'GET',
      });
      const j = await res.json().catch(() => null);
      if (!res.ok || !j?.ok || !j?.slug) {
        throw new Error(j?.error || `HTTP ${res.status}`);
      }
      setSlug(j.slug);
      onSlugReady?.(j.slug);
    } catch (e: any) {
      setErr(String(e?.message || e));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // auto-génération au montage si demandé et si slug manquant
    if (didRunRef.current) return;
    didRunRef.current = true;

    if (auto && !slug) {
      void generate();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (slug) {
    return (
      <div className="flex items-center gap-2">
        <a
          href={`/lost/${slug}`}
          target="_blank"
          rel="noreferrer"
          className="text-blue-600 underline"
        >
          /lost/{slug}
        </a>
        <span className="text-xs text-gray-500">(slug ready)</span>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <button
        type="button"
        onClick={generate}
        disabled={loading}
        className="px-3 py-1.5 rounded bg-gray-900 text-white text-sm disabled:opacity-50"
      >
        {loading ? 'Generating…' : 'Generate slug'}
      </button>
      {err && <span className="text-xs text-red-600">Error: {err}</span>}
    </div>
  );
}
