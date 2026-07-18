"use client";

// Charge les commissariats APRÈS le rendu de la page (l'appel Overpass est
// lent) puis affiche la carte. Le conteneur parent fixe la hauteur : aucun
// décalage de mise en page (CLS).
import { useEffect, useState } from "react";
import MapClient, { type PoliceStation } from "@/components/MapClient";

export default function CityMapSection({
  lat,
  lng,
  cityId,
}: {
  lat: number;
  lng: number;
  cityId?: string | number;
}) {
  const [stations, setStations] = useState<PoliceStation[] | null>(null);

  useEffect(() => {
    if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
      setStations([]);
      return;
    }
    let alive = true;
    fetch(`/api/police-stations?lat=${lat}&lng=${lng}${cityId != null ? `&cityId=${cityId}` : ""}`)
      .then((r) => (r.ok ? r.json() : { stations: [] }))
      .then((j) => {
        if (alive) setStations(Array.isArray(j?.stations) ? j.stations : []);
      })
      .catch(() => {
        if (alive) setStations([]);
      });
    return () => {
      alive = false;
    };
  }, [lat, lng, cityId]);

  if (stations === null) {
    return (
      <div className="h-full w-full grid place-items-center bg-gray-50 text-gray-400">
        Loading map…
      </div>
    );
  }
  return <MapClient stations={stations} />;
}
