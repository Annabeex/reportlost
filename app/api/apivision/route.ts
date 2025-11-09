// app/api/apivision/route.ts
import { NextRequest, NextResponse } from "next/server";

// ⚠️ Sharp est utilisé côté serveur uniquement (runtime nodejs)
import sharp from "sharp";

export const runtime = "nodejs";

const GOOGLE_API_KEY = process.env.GOOGLE_VISION_API_KEY;

function json(data: any, init?: ResponseInit) {
  const res = NextResponse.json(data, init);
  res.headers.set("Cache-Control", "no-store");
  return res;
}

// Utilitaire fetch avec timeout pour éviter les longues attentes
async function fetchWithTimeout(
  url: string,
  init: RequestInit & { timeoutMs?: number } = {}
) {
  const { timeoutMs = 15000, ...rest } = init;
  const ctrl = new AbortController();
  const id = setTimeout(() => ctrl.abort(), timeoutMs);
  try {
    return await fetch(url, { ...rest, signal: ctrl.signal });
  } finally {
    clearTimeout(id);
  }
}

// Redimensionne une image base64 côté serveur (maxDim px), recompresse en JPEG q=0.8
async function resizeBase64IfNeeded(
  base64DataUrl: string,
  maxDim = 1600
): Promise<string> {
  // Nettoyage éventuel d’un dataURL
  const raw = base64DataUrl.replace(/^data:.*;base64,/, "");
  const input = Buffer.from(raw, "base64");

  // Lecture des métadonnées pour éviter un travail inutile
  const meta = await sharp(input).metadata();
  const width = meta.width ?? 0;
  const height = meta.height ?? 0;

  // Si déjà sous le seuil, on retourne tel quel
  if ((width && width <= maxDim) && (height && height <= maxDim)) {
    return raw; // sans l’en-tête data:
  }

  // Redimensionnement en conservant le ratio, sans agrandir si plus petit
  const resized = await sharp(input)
    .rotate() // auto-orientation EXIF
    .resize({ width: maxDim, height: maxDim, fit: "inside", withoutEnlargement: true })
    .jpeg({ quality: 80 })
    .toBuffer();

  return resized.toString("base64");
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => null);
    if (!body) return json({ error: "Invalid JSON" }, { status: 400 });

    const imageBase64 =
      typeof body.image === "string" && body.image.length ? body.image : null;
    const imageUrl =
      typeof body.image_url === "string" && body.image_url.length ? body.image_url : null;

    // Tu m’as dit que tu ne l’appelleras pas sans image, mais on reste “safe”.
    if (!imageBase64 && !imageUrl) {
      return json({
        ok: true,
        skipped: true,
        labels: [],
        logos: [],
        objects: [],
        text: "",
      });
    }

    if (!GOOGLE_API_KEY) {
      console.error("Missing GOOGLE_VISION_API_KEY");
      return json({ error: "Server misconfiguration" }, { status: 500 });
    }

    // Préférence pour imageUri si disponible (évite gros payloads)
    let requestImage: any;

    if (imageUrl) {
      requestImage = { source: { imageUri: imageUrl } };
    } else {
      // Redimensionnement automatique côté serveur si base64
      const resizedBase64 = await resizeBase64IfNeeded(imageBase64! /* dataURL ou pur base64 */);
      requestImage = { content: resizedBase64 };
    }

    // ⚡ Features ciblées pour aller plus vite
    const requestBody = {
      requests: [
        {
          image: requestImage,
          features: [
            { type: "LABEL_DETECTION", maxResults: 3 },
            { type: "LOGO_DETECTION", maxResults: 3 },
            { type: "TEXT_DETECTION" },
          ],
        },
      ],
    };

    const visionEndpoint = `https://vision.googleapis.com/v1/images:annotate?key=${GOOGLE_API_KEY}`;

    let response: Response;
    try {
      response = await fetchWithTimeout(visionEndpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(requestBody),
        cache: "no-store",
        timeoutMs: 15000,
      });
    } catch (e: any) {
      if (e?.name === "AbortError") {
        // Timeout : on renvoie un succès “dégradé” pour que le flux continue
        return json({
          ok: true,
          timed_out: true,
          labels: [],
          logos: [],
          objects: [],
          text: "",
        });
      }
      throw e;
    }

    if (!response.ok) {
      const txt = await response.text().catch(() => "");
      console.error("Google Vision error:", response.status, txt);
      // Succès dégradé pour ne pas bloquer le submit
      return json({
        ok: true,
        degraded: true,
        labels: [],
        logos: [],
        objects: [],
        text: "",
      });
    }

    const jsonBody = await response.json().catch(() => null);
    const annotations = jsonBody?.responses?.[0] ?? {};

    const labels = annotations.labelAnnotations?.map((l: any) => l.description) || [];
    const logos = annotations.logoAnnotations?.map((l: any) => l.description) || [];
    const objects = annotations.localizedObjectAnnotations?.map((o: any) => o.name) || [];
    const text = annotations.fullTextAnnotation?.text || "";

    return json({ ok: true, labels, logos, objects, text });
  } catch (err) {
    console.error("apivision unexpected:", err);
    return json({ error: "Unexpected server error", details: String(err) }, { status: 500 });
  }
}
