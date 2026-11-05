"use client";
// 🇨🇦 Carte des pages villes canadiennes (inspirée de components/CityMapSection.tsx,
// US, non modifié). Deux usages :
//  - mode "places" : repères fournis par le guide (bureaux des objets trouvés,
//    hôtel de ville), aucun appel réseau ;
//  - mode "police" : postes de police chargés APRÈS le rendu
//    (/api/ca/police-stations, cache en base dans ca_cities).
// Le conteneur parent fixe la hauteur : aucun décalage de mise en page (CLS).
import { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import type { CaMapPoint } from "@/components/ca/CaMapLeaflet";
import type { CaGuidePlace } from "@/lib/ca/cityGuide";

// Leaflet touche à window : chargé côté navigateur seulement.
const CaMapLeaflet = dynamic(() => import("@/components/ca/CaMapLeaflet"), {
  ssr: false,
  loading: () => <div className="grid h-full w-full place-items-center text-gray-400">Loading map…</div>,
});

export default function CaCityMapSection({
  cityId,
  lat,
  lng,
  places,
}: {
  cityId?: number | null;
  lat?: number | null;
  lng?: number | null;
  places?: CaGuidePlace[] | null;
}) {
  const fixed = places && places.length > 0;
  const [points, setPoints] = useState<CaMapPoint[] | null>(
    fixed ? places!.map((p, i) => ({ id: i, lat: p.lat, lon: p.lng, name: p.name, address: p.address })) : null
  );

  useEffect(() => {
    if (fixed) return;
    if (cityId == null) {
      setPoints([]);
      return;
    }
    let alive = true;
    const q = new URLSearchParams({ cityId: String(cityId) });
    if (Number.isFinite(lat as number) && Number.isFinite(lng as number)) {
      q.set("lat", String(lat));
      q.set("lng", String(lng));
    }
    fetch(`/api/ca/police-stations?${q.toString()}`)
      .then((r) => (r.ok ? r.json() : { stations: [] }))
      .then((j) => {
        const list = Array.isArray(j?.stations) ? j.stations : [];
        const pts: CaMapPoint[] = list
          .filter((s: any) => typeof s?.lat === "number" && typeof s?.lon === "number")
          .map((s: any, i: number) => ({ id: s.id ?? i, lat: s.lat, lon: s.lon, name: s.name ?? null }));
        if (alive) setPoints(pts);
      })
      .catch(() => {
        if (alive) setPoints([]);
      });
    return () => {
      alive = false;
    };
  }, [fixed, cityId, lat, lng]);

  if (points === null) {
    return <div className="grid h-full w-full place-items-center bg-gray-50 text-gray-400">Loading map…</div>;
  }
  return <CaMapLeaflet points={points} emptyLabel={fixed ? "Map unavailable" : "No police stations found"} />;
}
