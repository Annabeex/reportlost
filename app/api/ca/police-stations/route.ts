// app/api/ca/police-stations/route.ts
// 🇨🇦 COPIE CANADIENNE de app/api/police-stations/route.ts (US, non modifié).
// Postes de police autour d'une ville canadienne, appelé par le navigateur APRÈS
// le rendu (Overpass est lent). Cache permanent dans ca_cities.police_stations
// (canada-phase2f-carte-image.sql), rafraîchi au-delà de 180 jours.
// Les coordonnées viennent de la base : seule une ville de ca_cities peut
// déclencher un appel Overpass. lat/lng en paramètre ne servent que si la ligne
// n'a pas de coordonnées.
import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";
import { fetchPoliceStations } from "@/lib/fetchPoliceStations";

export const runtime = "nodejs";
export const maxDuration = 30;

const REFRESH_DAYS = 180;

const CDN_HEADERS = {
  "Cache-Control": "public, s-maxage=604800, stale-while-revalidate=86400",
};

export async function GET(req: NextRequest) {
  const cityId = Number(req.nextUrl.searchParams.get("cityId"));
  if (!Number.isFinite(cityId) || cityId <= 0) {
    return NextResponse.json({ stations: [] }, { status: 400 });
  }

  const sb = getSupabaseAdmin({ fresh: false });
  if (!sb) return NextResponse.json({ stations: [] }, { status: 500 });

  const { data: row } = await sb
    .from("ca_cities")
    .select("id, lat, lng, police_stations, police_stations_at")
    .eq("id", cityId)
    .maybeSingle();
  if (!row) return NextResponse.json({ stations: [] }, { status: 404 });

  // 1) Cache en base
  const fresh =
    row.police_stations_at &&
    Date.now() - new Date(row.police_stations_at).getTime() < REFRESH_DAYS * 86400000;
  if (Array.isArray(row.police_stations) && fresh) {
    return NextResponse.json({ stations: row.police_stations }, { headers: CDN_HEADERS });
  }

  // 2) Coordonnées : la base d'abord, le paramètre en secours
  const qLat = Number(req.nextUrl.searchParams.get("lat"));
  const qLng = Number(req.nextUrl.searchParams.get("lng"));
  const lat = Number.isFinite(row.lat) && row.lat !== null ? Number(row.lat) : qLat;
  const lng = Number.isFinite(row.lng) && row.lng !== null ? Number(row.lng) : qLng;
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
    return NextResponse.json({ stations: [] }, { headers: CDN_HEADERS });
  }

  // 3) Overpass, puis on enregistre pour ne plus refaire l'appel
  let stations: Awaited<ReturnType<typeof fetchPoliceStations>> = [];
  try {
    stations = await fetchPoliceStations(lat, lng);
  } catch {
    stations = [];
  }

  // On ne met pas en cache une réponse vide : Overpass a pu échouer.
  if (stations.length > 0) {
    try {
      await sb
        .from("ca_cities")
        .update({ police_stations: stations, police_stations_at: new Date().toISOString() })
        .eq("id", cityId);
    } catch {
      /* non bloquant */
    }
  }

  return NextResponse.json({ stations }, { headers: stations.length ? CDN_HEADERS : { "Cache-Control": "no-store" } });
}
