// lib/imageToPosterSafe.ts
//
// La photo d'un signalement ne sert pas qu'à l'écran : elle est réutilisée par
// le générateur d'affiches /api/poster/<id>, qui repose sur next/og (satori +
// resvg) et ne sait décoder que PNG, JPEG et GIF. Une WebP — le format que
// donnent la plupart des images enregistrées depuis un site — n'y produit
// aucune erreur : juste un rectangle blanc au milieu de l'affiche.
//
// On normalise donc AU DÉPÔT, une fois, plutôt que de tenter une conversion à
// chaque rendu (impossible en edge). Effet secondaire utile : une photo de
// téléphone de 8 Mo descend à quelques centaines de Ko.
//
// Règle d'or : en cas d'échec, on renvoie le fichier d'origine. Une photo dans
// un format imparfait vaut infiniment mieux qu'un formulaire qui refuse.

const SAFE_TYPES = /^image\/(png|jpeg|gif)$/i;
const MAX_KEEP_BYTES = 3_000_000;
const MAX_SIDE = 1600;

async function decode(file: File): Promise<ImageBitmap | HTMLImageElement | null> {
  // createImageBitmap accepte plus de formats que <img> et évite un objet URL.
  if (typeof createImageBitmap === "function") {
    try {
      return await createImageBitmap(file);
    } catch {
      /* certains navigateurs refusent HEIC ici : on tente <img> ensuite */
    }
  }
  return new Promise((resolve) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => { URL.revokeObjectURL(url); resolve(img); };
    img.onerror = () => { URL.revokeObjectURL(url); resolve(null); };
    img.src = url;
  });
}

export async function toPosterSafeImage(file: File): Promise<File> {
  try {
    // Déjà dans un format lisible et de taille raisonnable : on n'y touche pas,
    // ré-encoder dégraderait l'image sans rien apporter.
    if (SAFE_TYPES.test(file.type) && file.size <= MAX_KEEP_BYTES) return file;

    const src = await decode(file);
    if (!src) return file;

    const w0 = "width" in src ? src.width : 0;
    const h0 = "height" in src ? src.height : 0;
    if (!w0 || !h0) return file;

    const ratio = Math.min(1, MAX_SIDE / Math.max(w0, h0));
    const w = Math.round(w0 * ratio);
    const h = Math.round(h0 * ratio);

    const canvas = document.createElement("canvas");
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext("2d");
    if (!ctx) return file;

    // La transparence d'un PNG devient noire en JPEG : on peint le fond d'abord.
    const keepPng = /png/i.test(file.type);
    if (!keepPng) {
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(0, 0, w, h);
    }
    ctx.drawImage(src as CanvasImageSource, 0, 0, w, h);
    if ("close" in src && typeof src.close === "function") src.close();

    const mime = keepPng ? "image/png" : "image/jpeg";
    const blob: Blob | null = await new Promise((resolve) =>
      canvas.toBlob(resolve, mime, keepPng ? undefined : 0.86)
    );
    if (!blob || !blob.size) return file;

    // Une conversion qui alourdit le fichier n'a pas lieu d'être.
    if (SAFE_TYPES.test(file.type) && blob.size >= file.size) return file;

    const base = file.name.replace(/\.[^.]+$/, "") || "photo";
    return new File([blob], `${base}.${keepPng ? "png" : "jpg"}`, {
      type: mime,
      lastModified: Date.now(),
    });
  } catch {
    return file;
  }
}
