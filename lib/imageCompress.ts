// lib/imageCompress.ts — réduit une photo de téléphone AVANT l'envoi.
//
// Un téléphone sort des photos de 3 à 8 Mo. Pour identifier un objet trouvé,
// 1600 px de côté en JPEG suffisent largement : ≈ 300 Ko. L'envoi passe de
// dix secondes à une en 4G, et le stockage est divisé par quinze.
//
// En cas d'échec (format exotique, navigateur ancien), on renvoie le fichier
// d'origine : une photo lourde vaut mieux que pas de photo.

const MAX_SIDE = 1600;
const QUALITY = 0.82;

async function decode(file: File): Promise<{ source: CanvasImageSource; w: number; h: number; close?: () => void }> {
  // createImageBitmap respecte l'orientation EXIF (photo prise en portrait).
  if (typeof createImageBitmap === "function") {
    try {
      const bmp = await createImageBitmap(file, { imageOrientation: "from-image" } as ImageBitmapOptions);
      return { source: bmp, w: bmp.width, h: bmp.height, close: () => bmp.close() };
    } catch {
      /* repli ci-dessous */
    }
  }
  const url = URL.createObjectURL(file);
  try {
    const img = await new Promise<HTMLImageElement>((resolve, reject) => {
      const i = new Image();
      i.onload = () => resolve(i);
      i.onerror = () => reject(new Error("decode"));
      i.src = url;
    });
    return { source: img, w: img.naturalWidth, h: img.naturalHeight };
  } finally {
    // L'image est décodée : l'URL temporaire peut être libérée.
    setTimeout(() => URL.revokeObjectURL(url), 0);
  }
}

export async function compressImage(file: File): Promise<File> {
  try {
    if (!file.type.startsWith("image/") || file.type === "image/gif" || file.type === "image/svg+xml") return file;

    const { source, w, h, close } = await decode(file);
    if (!w || !h) return file;

    const scale = Math.min(1, MAX_SIDE / Math.max(w, h));
    // Déjà petite et déjà légère : on n'y touche pas.
    if (scale === 1 && file.size < 600_000 && file.type === "image/jpeg") { close?.(); return file; }

    const cw = Math.max(1, Math.round(w * scale));
    const ch = Math.max(1, Math.round(h * scale));
    const canvas = document.createElement("canvas");
    canvas.width = cw;
    canvas.height = ch;
    const c2d = canvas.getContext("2d");
    if (!c2d) { close?.(); return file; }
    // Fond blanc : un PNG transparent deviendrait noir en JPEG.
    c2d.fillStyle = "#ffffff";
    c2d.fillRect(0, 0, cw, ch);
    c2d.drawImage(source, 0, 0, cw, ch);
    close?.();

    const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/jpeg", QUALITY));
    if (!blob || blob.size >= file.size) return file;

    const name = (file.name || "photo").replace(/\.[^.]+$/, "") + ".jpg";
    return new File([blob], name, { type: "image/jpeg", lastModified: Date.now() });
  } catch {
    return file;
  }
}
