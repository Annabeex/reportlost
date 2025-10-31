// app/api/apivision/route.ts
import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";

const GOOGLE_API_KEY = process.env.GOOGLE_VISION_API_KEY;

function json(data: any, init?: ResponseInit) {
  const res = NextResponse.json(data, init);
  res.headers.set("Cache-Control", "no-store");
  return res;
}

export async function POST(req: NextRequest) {
  try {
    if (!GOOGLE_API_KEY) {
      console.error("Missing GOOGLE_VISION_API_KEY");
      return json({ error: "Server misconfiguration" }, { status: 500 });
    }

    const body = await req.json().catch(() => null);
    if (!body) return json({ error: "Invalid JSON" }, { status: 400 });

    const imageBase64 = typeof body.image === "string" && body.image.length ? body.image : null;
    const imageUrl = typeof body.image_url === "string" && body.image_url.length ? body.image_url : null;

    if (!imageBase64 && !imageUrl) {
      return json({ error: "Provide image (base64) or image_url" }, { status: 400 });
    }

    // Build request for Google Vision: prefer imageUri if available (avoids base64 sizes)
    const requestImage = imageUrl
      ? { source: { imageUri: imageUrl } }
      : { content: imageBase64!.replace(/^data:.*;base64,/, "") };

    const visionEndpoint = `https://vision.googleapis.com/v1/images:annotate?key=${GOOGLE_API_KEY}`;
    const requestBody = {
      requests: [
        {
          image: requestImage,
          features: [
            // limit features to what's useful to reduce processing time
            { type: "WEB_DETECTION", maxResults: 5 },
            { type: "LABEL_DETECTION", maxResults: 5 },
            { type: "OBJECT_LOCALIZATION", maxResults: 5 },
            { type: "LOGO_DETECTION", maxResults: 5 },
            { type: "TEXT_DETECTION" },
          ],
        },
      ],
    };

    const response = await fetch(visionEndpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(requestBody),
      cache: "no-store",
    });

    if (!response.ok) {
      const txt = await response.text().catch(() => "");
      console.error("Google Vision error:", response.status, txt);
      return json({ error: "Vision API error", details: txt }, { status: 502 });
    }

    const jsonBody = await response.json().catch(() => null);
    const annotations = jsonBody?.responses?.[0] ?? {};

    const webLabels = annotations.webDetection?.bestGuessLabels?.map((l: any) => l.label) || [];
    const fallbackLabels = annotations.labelAnnotations?.map((l: any) => l.description) || [];
    const logos = annotations.logoAnnotations?.map((l: any) => l.description) || [];
    const objects = annotations.localizedObjectAnnotations?.map((o: any) => o.name) || [];
    const text = annotations.fullTextAnnotation?.text || "";

    return json({
      ok: true,
      labels: webLabels.length ? webLabels : fallbackLabels,
      logos,
      objects,
      text,
      raw: annotations, // utile pour debug (optionnel)
    });
  } catch (err) {
    console.error("apivision unexpected:", err);
    return json({ error: "Unexpected server error", details: String(err) }, { status: 500 });
  }
}
