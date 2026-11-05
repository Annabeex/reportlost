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

  // Ligne du dessous (la pastille colorée) et cadrage de la photo.
  const [lieu, setLieu] = useState('');
  const [lieuAuto, setLieuAuto] = useState('');
  const [maxLieu, setMaxLieu] = useState(72);
  const [fit, setFit] = useState<'cover' | 'contain'>('cover');
  const [zoom, setZoom] = useState(1);
  const [posX, setPosX] = useState(50);
  const [posY, setPosY] = useState(50);
  const [reglages, setReglages] = useState({ where: '', fit: 'cover' as 'cover' | 'contain', zoom: 1, x: 50, y: 50 });
  const [charge, setCharge] = useState(false);

  // L'aperçu ne suit pas la frappe ni le curseur en direct : chaque URL
  // différente déclenche un rendu PNG complet côté serveur. On attend 400 ms
  // d'immobilité avant de recalculer.
  const [apercu, setApercu] = useState({ titre: '', lieu: '', fit: 'cover' as 'cover' | 'contain', zoom: 1, x: 50, y: 50 });
  useEffect(() => {
    const t = setTimeout(() => setApercu({ titre, lieu, fit, zoom, x: posX, y: posY }), 400);
    return () => clearTimeout(t);
  }, [titre, lieu, fit, zoom, posX, posY]);

  // L'aperçu porte le titre en cours de saisie ; l'image enregistrée en base
  // reste celle que verront le client et les réseaux.
  // Tant que les réglages enregistrés ne sont pas chargés, on n'envoie aucun
  // paramètre : sinon l'aperçu afficherait les valeurs par défaut par-dessus
  // ce qui est en base, le temps d'un aller-retour.
  const posterUrl = (() => {
    const q = new URLSearchParams();
    if (charge) {
      q.set('title', apercu.titre.trim());
      q.set('where', apercu.lieu.trim());
      q.set('fit', apercu.fit);
      q.set('zoom', String(apercu.zoom));
      q.set('px', String(apercu.x));
      q.set('py', String(apercu.y));
    }
    q.set('v', String(version));
    return `/api/poster/${encodeURIComponent(id)}?${q.toString()}`;
  })();

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
        if (Number(j.maxLieu)) setMaxLieu(Number(j.maxLieu));
        const r = {
          where: String(j.opts?.where || ''),
          fit: (j.opts?.fit === 'contain' ? 'contain' : 'cover') as 'cover' | 'contain',
          zoom: Number(j.opts?.zoom) || 1,
          x: Number.isFinite(Number(j.opts?.x)) ? Number(j.opts.x) : 50,
          y: Number.isFinite(Number(j.opts?.y)) ? Number(j.opts.y) : 50,
        };
        setReglages(r);
        setLieu(r.where);
        setFit(r.fit);
        setZoom(r.zoom);
        setPosX(r.x);
        setPosY(r.y);
        setApercu({ titre: j.posterTitle || '', lieu: r.where, fit: r.fit, zoom: r.zoom, x: r.x, y: r.y });
      } catch {
        /* le titre reste celui déduit par le modèle */
      } finally {
        setCharge(true);
      }
    })();
  }, [id]);

  // La ligne du dessous calculée automatiquement, pour la montrer en repère.
  useEffect(() => {
    (async () => {
      try {
        const res = await fetch(`/api/poster/${encodeURIComponent(id)}?debug=1`, { cache: 'no-store' });
        const j = await res.json().catch(() => null);
        if (j?.where_auto) setLieuAuto(String(j.where_auto));
      } catch {
        /* simple repère, son absence ne gêne rien */
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
        body: JSON.stringify({
          posterTitle: titre,
          opts: { where: lieu, fit, zoom, x: posX, y: posY },
        }),
      });
      const j = await res.json().catch(() => null);
      if (!res.ok || !j?.ok) throw new Error(j?.error || `Erreur ${res.status}`);
      setTitreEnregistre(j.posterTitle || '');
      setTitre(j.posterTitle || '');
      if (j.opts) {
        const r = {
          where: String(j.opts.where || ''),
          fit: (j.opts.fit === 'contain' ? 'contain' : 'cover') as 'cover' | 'contain',
          zoom: Number(j.opts.zoom) || 1,
          x: Number(j.opts.x),
          y: Number(j.opts.y),
        };
        setReglages(r);
        setLieu(r.where);
        setFit(r.fit);
        setZoom(r.zoom);
        setPosX(r.x);
        setPosY(r.y);
      }
      setVersion((v) => v + 1);
      setTitreMsg('✅ Enregistré — le poster du client et des réseaux est à jour.');
    } catch (e: any) {
      setTitreMsg(`⚠️ ${String(e?.message || e)}`);
    } finally {
      setTitreBusy(false);
    }
  };

  const modifie =
    titre.trim() !== titreEnregistre.trim() ||
    lieu.trim() !== reglages.where ||
    fit !== reglages.fit ||
    zoom !== reglages.zoom ||
    posX !== reglages.x ||
    posY !== reglages.y;

  const reinitialiserCadrage = () => {
    setFit('cover');
    setZoom(1);
    setPosX(50);
    setPosY(50);
    setTitreMsg(null);
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
        </div>
        {(reperes.reportTitle || reperes.category) && (
          <p className="mt-2 text-xs text-gray-500">
            Dossier : <span className="text-gray-700">{reperes.reportTitle || '—'}</span>
            {reperes.category ? ` · catégorie : ${reperes.category}` : ''}
          </p>
        )}
      </div>

      {/* Cadrage de la photo */}
      <div className="mt-4 rounded-xl border border-gray-200 bg-gray-50 p-4">
        <div className="flex items-center justify-between gap-3">
          <span className="text-sm font-semibold text-gray-800">Cadrage de la photo</span>
          <button
            type="button"
            onClick={reinitialiserCadrage}
            className="text-xs text-gray-500 underline hover:text-gray-800"
          >
            Réinitialiser
          </button>
        </div>
        <p className="mt-1 text-xs text-gray-500">
          Par défaut la photo est recadrée au centre, ce qui coupe un objet décentré. Zoome, puis déplace le
          cadre pour le ramener dessus.
        </p>

        <div className="mt-3 flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => setFit('cover')}
            className={`rounded-lg border px-3 py-1.5 text-xs font-medium ${
              fit === 'cover' ? 'border-gray-900 bg-gray-900 text-white' : 'border-gray-300 bg-white text-gray-700'
            }`}
          >
            Remplir le cadre
          </button>
          <button
            type="button"
            onClick={() => setFit('contain')}
            className={`rounded-lg border px-3 py-1.5 text-xs font-medium ${
              fit === 'contain' ? 'border-gray-900 bg-gray-900 text-white' : 'border-gray-300 bg-white text-gray-700'
            }`}
          >
            Objet entier
          </button>
        </div>

        <label className="mt-3 block text-xs text-gray-600">
          Zoom <span className="tabular-nums text-gray-400">×{zoom.toFixed(2)}</span>
          <input
            type="range"
            min={1}
            max={3}
            step={0.05}
            value={zoom}
            onChange={(e) => {
              setZoom(Number(e.target.value));
              setTitreMsg(null);
            }}
            className="mt-1 w-full"
          />
        </label>

        <label className="mt-2 block text-xs text-gray-600">
          Position horizontale <span className="tabular-nums text-gray-400">{posX}%</span>
          <input
            type="range"
            min={0}
            max={100}
            step={1}
            value={posX}
            disabled={zoom <= 1}
            onChange={(e) => {
              setPosX(Number(e.target.value));
              setTitreMsg(null);
            }}
            className="mt-1 w-full disabled:opacity-40"
          />
        </label>

        <label className="mt-2 block text-xs text-gray-600">
          Position verticale <span className="tabular-nums text-gray-400">{posY}%</span>
          <input
            type="range"
            min={0}
            max={100}
            step={1}
            value={posY}
            disabled={zoom <= 1}
            onChange={(e) => {
              setPosY(Number(e.target.value));
              setTitreMsg(null);
            }}
            className="mt-1 w-full disabled:opacity-40"
          />
        </label>

        {zoom <= 1 && (
          <p className="mt-2 text-xs text-gray-500">
            Les deux positions s’activent dès que le zoom dépasse ×1 : sans zoom l’image remplit exactement le
            cadre, il n’y a rien à déplacer.
          </p>
        )}
      </div>

      {/* Ligne du dessous */}
      <div className="mt-4 rounded-xl border border-gray-200 bg-gray-50 p-4">
        <label htmlFor="poster-lieu" className="block text-sm font-semibold text-gray-800">
          Ligne du dessous
        </label>
        <p className="mt-1 text-xs text-gray-500">
          La pastille colorée sous le titre. Laisse vide pour la version automatique
          {lieuAuto ? ` : « ${lieuAuto} »` : ''}. {maxLieu} caractères maximum, la police se réduit toute seule
          si c’est long.
        </p>
        <div className="mt-2 flex flex-wrap items-center gap-2">
          <input
            id="poster-lieu"
            type="text"
            value={lieu}
            maxLength={maxLieu}
            onChange={(e) => {
              setLieu(e.target.value);
              setTitreMsg(null);
            }}
            placeholder={lieuAuto || 'IN BROOKLYN (NY) AT THE BEACH'}
            className="flex-1 min-w-[220px] rounded-lg border border-gray-300 px-3 py-2 text-sm"
          />
          <span className="text-xs tabular-nums text-gray-400">
            {lieu.trim().length}/{maxLieu}
          </span>
        </div>
      </div>

      {/* Enregistrement */}
      <div className="mt-4 flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={enregistrerTitre}
          disabled={titreBusy || !modifie}
          className="rounded-lg bg-gray-900 px-5 py-2 text-sm font-semibold text-white hover:brightness-110 disabled:opacity-40"
        >
          {titreBusy ? 'Enregistrement…' : 'Enregistrer le poster'}
        </button>
        {modifie && (
          <p className="text-xs text-amber-700">
            L’aperçu montre ces réglages, mais ils ne sont pas encore enregistrés : le client et les réseaux
            voient toujours l’ancienne version.
          </p>
        )}
        {titreMsg && <p className="text-xs text-gray-700">{titreMsg}</p>}
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
