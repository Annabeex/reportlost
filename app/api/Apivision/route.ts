// app/api/apivision/route.ts
import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";

const GOOGLE_API_KEY = process.env.GOOGLE_VISION_API_KEY;

export async function POST(req: NextRequest) {
  try {
    if (!GOOGLE_API_KEY) {
      console.error("Missing GOOGLE_VISION_API_KEY env var");
      return NextResponse.json({ error: "Server misconfiguration: missing Vision API key" }, { status: 500 });
    }

    const body = await req.json().catch(() => null);
    const image = body?.image;

    if (!image) {
      return NextResponse.json({ error: "Image manquante" }, { status: 400 });
    }

    const visionEndpoint = `https://vision.googleapis.com/v1/images:annotate?key=${GOOGLE_API_KEY}`;

    const requestBody = {
      requests: [
        {
          image: { content: image },
          features: [
            { type: "WEB_DETECTION", maxResults: 5 },
            { type: "TEXT_DETECTION" },
            { type: "LOGO_DETECTION", maxResults: 5 },
            { type: "OBJECT_LOCALIZATION", maxResults: 5 },
            { type: "LABEL_DETECTION", maxResults: 5 },
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
      const respText = await response.text().catch(() => "");
      console.error("Google Vision API error:", response.status, respText);
      return NextResponse.json({ error: "Erreur API Vision", details: respText }, { status: 502 });
    }

    const json = await response.json().catch(() => null);
    const annotations = json?.responses?.[0];

    if (!annotations) {
      console.error("Vision API returned empty response:", json);
      return NextResponse.json({ error: "Réponse vide de Vision API" }, { status: 502 });
    }

    const webLabels = annotations.webDetection?.bestGuessLabels?.map((l: any) => l.label) || [];
    const fallbackLabels = annotations.labelAnnotations?.map((l: any) => l.description) || [];
    const logos = annotations.logoAnnotations?.map((l: any) => l.description) || [];
    const objects = annotations.localizedObjectAnnotations?.map((o: any) => o.name) || [];
    const text = annotations.fullTextAnnotation?.text || "";

    const result = {
      labels: (webLabels.length ? webLabels : fallbackLabels) || [],
      logos,
      objects,
      text,
    };

    const res = NextResponse.json(result);
    res.headers.set("Cache-Control", "s-maxage=86400, stale-while-revalidate=600");
    return res;
  } catch (error) {
    console.error("Erreur analyse Vision API:", error);
    return NextResponse.json({ error: "Erreur Google Vision", details: String(error) }, { status: 500 });
  }
}
