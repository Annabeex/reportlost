'use client';

import { useEffect, useState } from 'react';

export default function PosterPage({ params }: { params: { id: string } }) {
  const id = params.id;

  const [en, setEn] = useState('');
  const [fr, setFr] = useState('');
  const [lang, setLang] = useState<'en' | 'fr'>('en');
  const [loadingCaption, setLoadingCaption] = useState(true);
  const [captionErr, setCaptionErr] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [downloading, setDownloading] = useState(false);

  // Titre du poster : modifiable à la main. Le modèle résume en 1-2 mots et
  // coupe parfois le mot qui porte le sens (« Car and Motorcycle Keys »).
  const [titre, setTitre] = useState('');
  const [titreEnregistre, setTitreEnregistre] = useState('');
  const [reperes, setReperes] = useState<{ reportTitle: string; category: string }>({ reportTitle: '', category: '' });
  const [maxTitre, setMaxTitre] = useState(32);
  const [titreBusy, setTitreBusy] = useState(false);
  const [titreMsg, setTitreMsg] = useState<string | null>(null);
  // Change à chaque enregistrement pour forcer le navigateur à recharger l'image.
  const [version, setVersion] = useState(0);

  // L'aperçu porte le titre en cours de saisie ; l'image enregistrée en base
  // reste celle que verront le client et les réseaux.
  const posterUrl =
    `/api/poster/${encodeURIComponent(id)}` +
    (titre.trim() ? `?title=${encodeURIComponent(titre.trim())}&v=${version}` : `?v=${version}`);

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

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch(`/api/admin/poster-title/${encodeURIComponent(id)}`, { cache: 'no-store' });
        const j = await res.json().catch(() => null);
        if (!res.ok || !j?.ok) return;
        setTitre(j.posterTitle || '');
        setTitreEnregistre(j.posterTitle || '');
        setReperes({ reportTitle: j.reportTitle || '', category: j.category || '' });
        if (Number(j.max)) setMaxTitre(Number(j.max));
      } catch {
        /* le titre reste celui déduit par le modèle */
      }
    })();
  }, [id]);

  const enregistrerTitre = async () => {
    setTitreBusy(true);
    setTitreMsg(null);
    try {
      const res = await fetch(`/api/admin/poster-title/${encodeURIComponent(id)}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ posterTitle: titre }),
      });
      const j = await res.json().catch(() => null);
      if (!res.ok || !j?.ok) throw new Error(j?.error || `Erreur ${res.status}`);
      setTitreEnregistre(j.posterTitle || '');
      setTitre(j.posterTitle || '');
      setVersion((v) => v + 1);
      setTitreMsg('✅ Titre enregistré — le poster du client est à jour.');
    } catch (e: any) {
      setTitreMsg(`⚠️ ${String(e?.message || e)}`);
    } finally {
      setTitreBusy(false);
    }
  };

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

      {/* Titre du poster */}
      <div className="mt-5 rounded-xl border border-gray-200 bg-gray-50 p-4">
        <label htmlFor="poster-titre" className="block text-sm font-semibold text-gray-800">
          Titre affiché sur le poster
        </label>
        <p className="mt-1 text-xs text-gray-500">
          Laisse vide pour garder le titre proposé automatiquement. {maxTitre} caractères maximum : au-delà, il
          serait coupé sur l’image.
        </p>
        <div className="mt-2 flex flex-wrap items-center gap-2">
          <input
            id="poster-titre"
            type="text"
            value={titre}
            maxLength={maxTitre}
            onChange={(e) => {
              setTitre(e.target.value);
              setTitreMsg(null);
            }}
            placeholder="ex. Car and Motorcycle Keys"
            className="flex-1 min-w-[220px] rounded-lg border border-gray-300 px-3 py-2 text-sm"
          />
          <span className="text-xs tabular-nums text-gray-400">
            {titre.trim().length}/{maxTitre}
          </span>
          <button
            type="button"
            onClick={enregistrerTitre}
            disabled={titreBusy || titre.trim() === titreEnregistre.trim()}
            className="rounded-lg bg-gray-900 px-4 py-2 text-sm font-semibold text-white hover:brightness-110 disabled:opacity-40"
          >
            {titreBusy ? 'Enregistrement…' : 'Enregistrer'}
          </button>
        </div>
        {(reperes.reportTitle || reperes.category) && (
          <p className="mt-2 text-xs text-gray-500">
            Dossier : <span className="text-gray-700">{reperes.reportTitle || '—'}</span>
            {reperes.category ? ` · catégorie : ${reperes.category}` : ''}
          </p>
        )}
        {titre.trim() !== titreEnregistre.trim() && (
          <p className="mt-2 text-xs text-amber-700">
            L’aperçu ci-dessus montre ce titre, mais il n’est pas encore enregistré : le client et les réseaux
            voient toujours l’ancien.
          </p>
        )}
        {titreMsg && <p className="mt-2 text-xs text-gray-700">{titreMsg}</p>}
      </div>

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
