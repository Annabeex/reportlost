'use client';

import { useEffect, useState } from 'react';

export default function PosterPage({ params }: { params: { id: string } }) {
  const id = params.id;
  const posterUrl = `/api/poster/${encodeURIComponent(id)}`;

  const [en, setEn] = useState('');
  const [fr, setFr] = useState('');
  const [lang, setLang] = useState<'en' | 'fr'>('en');
  const [loadingCaption, setLoadingCaption] = useState(true);
  const [captionErr, setCaptionErr] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [downloading, setDownloading] = useState(false);

  useEffect(() => {
    (async () => {
      setLoadingCaption(true);
      setCaptionErr(null);
      try {
        const res = await fetch(`/api/admin/poster-caption/${encodeURIComponent(id)}`, { cache: 'no-store' });
        const j = await res.json().catch(() => null);
        if (!res.ok || !j?.ok) {
          setCaptionErr(j?.error || `Erreur ${res.status}`);
          return;
        }
        setEn(j.en || '');
        setFr(j.fr || '');
      } catch (e: any) {
        setCaptionErr(String(e?.message || e));
      } finally {
        setLoadingCaption(false);
      }
    })();
  }, [id]);

  const caption = lang === 'en' ? en : fr;

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(caption);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      /* ignore */
    }
  };

  const download = async () => {
    setDownloading(true);
    try {
      const res = await fetch(posterUrl, { cache: 'no-store' });
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `poster-${id}.png`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch {
      window.open(posterUrl, '_blank');
    } finally {
      setDownloading(false);
    }
  };

  return (
    <main className="max-w-2xl mx-auto p-6">
      <h1 className="text-2xl font-bold text-gray-900 mb-4">Poster — dossier {id}</h1>

      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={posterUrl}
        alt={`Poster ${id}`}
        className="w-full max-w-md mx-auto rounded-xl border border-gray-200 shadow"
      />

      <div className="flex flex-wrap items-center gap-3 justify-center mt-4">
        <button
          type="button"
          onClick={download}
          disabled={downloading}
          className="rounded-lg bg-green-600 text-white font-semibold px-5 py-2 text-sm hover:brightness-110 disabled:opacity-50"
        >
          {downloading ? 'Téléchargement…' : '⬇️ Télécharger l’image'}
        </button>
        <a
          href="https://www.instagram.com"
          target="_blank"
          rel="noreferrer"
          className="rounded-lg bg-pink-600 text-white font-semibold px-5 py-2 text-sm hover:brightness-110"
        >
          Ouvrir Instagram
        </a>
      </div>
      <p className="text-xs text-gray-400 text-center mt-2">
        Instagram ne permet pas de publier depuis un site. Télécharge l’image, puis publie-la dans l’app avec la légende ci-dessous.
      </p>

      {/* Légende */}
      <div className="mt-8">
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-lg font-semibold text-gray-800">Légende réseaux sociaux</h2>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setLang(lang === 'en' ? 'fr' : 'en')}
              className="text-xs rounded bg-gray-200 text-gray-800 px-3 py-1 hover:bg-gray-300"
            >
              {lang === 'en' ? 'Voir en français' : 'Voir en anglais'}
            </button>
            <button
              type="button"
              onClick={copy}
              disabled={!caption}
              className="text-xs rounded bg-blue-600 text-white px-3 py-1 hover:brightness-110 disabled:opacity-50"
            >
              {copied ? 'Copié ✓' : 'Copier'}
            </button>
          </div>
        </div>

        {loadingCaption ? (
          <div className="text-sm text-gray-500">Génération de la légende…</div>
        ) : captionErr ? (
          <div className="text-sm text-red-600">Erreur : {captionErr}</div>
        ) : (
          <div className="border border-gray-200 rounded-lg p-4 bg-white text-sm text-gray-800 whitespace-pre-wrap">
            {caption}
          </div>
        )}
      </div>
    </main>
  );
}
