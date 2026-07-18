// app/api/police-stations/route.ts
// Commissariats autour d'un point (Overpass/OSM), appelé par le navigateur
// APRÈS le rendu de la page ville : l'appel Overpass (lent, miroirs à 5 s de
// timeout) ne bloque plus jamais l'affichage. Cache CDN 7 jours par ville.
import { NextRequest, NextResponse } from "next/server";
import { fetchPoliceStations } from "@/lib/fetchPoliceStations";

export const runtime = "nodejs";
export const maxDuration = 30;

export async function GET(req: NextRequest) {
  const lat = Number(req.nextUrl.searchParams.get("lat"));
  const lng = Number(req.nextUrl.searchParams.get("lng"));
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
    return NextResponse.json({ stations: [] }, { status: 400 });
  }

  let stations: Awaited<ReturnType<typeof fetchPoliceStations>> = [];
  try {
    stations = await fetchPoliceStations(lat, lng);
  } catch {
    stations = [];
  }

  return NextResponse.json(
    { stations },
    {
      headers: {
        // Cache CDN : 7 jours + resservir l'ancien pendant la revalidation.
        "Cache-Control": "public, s-maxage=604800, stale-while-revalidate=86400",
      },
    }
  );
}
