// app/api/pexels/route.ts
import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Helper: JSON + CORS + cache headers
function json(data: any, init?: ResponseInit, cache: "no-store" | "cdn" = "cdn") {
  const res = NextResponse.json(data, init);
  res.headers.set("Access-Control-Allow-Origin", "*");
  res.headers.set("Access-Control-Allow-Methods", "GET, OPTIONS");
  res.headers.set("Access-Control-Allow-Headers", "Content-Type");
  if (cache === "cdn") {
    // Cache côté CDN pour 24h + SWR 10min
    res.headers.set("Cache-Control", "s-maxage=86400, stale-while-revalidate=600");
  } else {
    res.headers.set("Cache-Control", "no-store");
  }
  return res;
}

// Petit util de timeout pour fetch
async function fetchWithTimeout(url: string, init: RequestInit = {}, ms = 6000) {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), ms);
  try {
    // @ts-ignore - signal est valide
    return await fetch(url, { ...init, signal: controller.signal });
  } finally {
    clearTimeout(id);
  }
}

export async function OPTIONS() {
  return new Response(null, {
    status: 204,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
      "Cache-Control": "no-store",
    },
  });
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const rawQuery = (searchParams.get("query") || "").trim();

    // Validation d’entrée
    if (!rawQuery) return json({ photos: [] }, { status: 400 }, "no-store");
    if (rawQuery.length > 80) {
      return json({ error: "Query too long" }, { status: 400 }, "no-store");
    }

    const apiKey = process.env.PEXELS_API_KEY || "";
    if (!apiKey) {
      console.error("PEXELS_API_KEY missing");
      return json({ error: "Server not configured" }, { status: 500 }, "no-store");
    }

    // Encode propre de la query
    const q = encodeURIComponent(rawQuery);

    // Appel Pexels (on limite à 1 pour ton usage)
    const pexelsUrl = `https://api.pexels.com/v1/search?query=${q}&per_page=1`;

    const res = await fetchWithTimeout(
      pexelsUrl,
      {
        headers: { Authorization: apiKey },
        // Pas de cache entre serveur et Pexels ; on met le cache sur la réponse à l’utilisateur
        cache: "no-store",
      },
      6000 // timeout 6s
    );

    if (!res.ok) {
      const txt = await res.text().catch(() => "");
      console.error("Pexels API error:", res.status, txt?.slice(0, 200));
      // 502: upstream error
      return json({ photos: [] }, { status: 502 }, "no-store");
    }

    const data = await res.json().catch(() => null);
    if (!data) return json({ photos: [] }, { status: 502 }, "no-store");

    // Réponse: cache CDN activé (SWR) car queries répétitives → soulage ton quota Pexels
    return json(data, { status: 200 }, "cdn");
  } catch (err: any) {
    // AbortError (timeout) ou autre erreur réseau
    if (err?.name === "AbortError") {
      console.warn("Pexels timeout");
      return json({ photos: [] }, { status: 504 }, "no-store");
    }
    console.error("Unexpected Pexels handler error:", err);
    return json({ error: "Unexpected server error" }, { status: 500 }, "no-store");
  }
}
