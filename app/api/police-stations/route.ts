// app/api/police-stations/route.ts
// Commissariats autour d'une ville, appelé par le navigateur APRÈS le rendu
// de la page (l'appel Overpass est lent et ne doit jamais bloquer l'affichage).
//
// Cache PERMANENT en base (us_cities.police_stations, comme les images) :
// Overpass n'est interrogé qu'une fois par ville, puis le résultat est servi
// depuis Supabase. Rafraîchissement de sécurité au-delà de 180 jours.
// Nécessite police-stations-cache.sql. Cache CDN 7 jours par-dessus.
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
  const lat = Number(req.nextUrl.searchParams.get("lat"));
  const lng = Number(req.nextUrl.searchParams.get("lng"));
  const cityId = req.nextUrl.searchParams.get("cityId");
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
    return NextResponse.json({ stations: [] }, { status: 400 });
  }

  const sb = getSupabaseAdmin({ fresh: false });

  // 1) Cache en base d'abord (une requête indexée par PK : quasi instantané)
  if (sb && cityId) {
    try {
      const { data } = await sb
        .from("us_cities")
        .select("police_stations, police_stations_at")
        .eq("id", cityId)
        .maybeSingle();
      const fresh =
        data?.police_stations_at &&
        Date.now() - new Date(data.police_stations_at).getTime() < REFRESH_DAYS * 86400000;
      if (Array.isArray(data?.police_stations) && fresh) {
        return NextResponse.json({ stations: data.police_stations }, { headers: CDN_HEADERS });
      }
    } catch {
      /* colonne absente (SQL pas encore exécuté) : on passe par Overpass */
    }
  }

  // 2) Sinon Overpass, puis on enregistre pour ne plus jamais refaire l'appel
  let stations: Awaited<ReturnType<typeof fetchPoliceStations>> = [];
  try {
    stations = await fetchPoliceStations(lat, lng);
  } catch {
    stations = [];
  }

  if (sb && cityId) {
    try {
      await sb
        .from("us_cities")
        .update({ police_stations: stations, police_stations_at: new Date().toISOString() })
        .eq("id", cityId);
    } catch {
      /* non bloquant */
    }
  }

  return NextResponse.json({ stations }, { headers: CDN_HEADERS });
}
