"use client";

import { useMemo } from "react";
import dynamic from "next/dynamic";

// 👉 on importe la vraie carte (qui importe leaflet/react-leaflet) dynamiquement, ssr: false
const LeafletMap = dynamic(() => import("./MapLeaflet").then(m => m.default), {
  ssr: false,
  loading: () => <div className="h-full w-full grid place-items-center text-gray-400">Loading map…</div>,
});

// types simples, “plain objects”
export type PoliceStation = {
  id?: string | number;
  lat: number | null | undefined;
  lon: number | null | undefined;
  name?: string | null;
};

export default function MapClient({ stations }: { stations: PoliceStation[] }) {
  // on normalise ici pour ne passer au composant Leaflet que des numbers
  const pts = useMemo(
    () =>
      (stations ?? [])
        .filter(s => typeof s.lat === "number" && typeof s.lon === "number")
        .map(s => ({ id: s.id ?? `${s.lat},${s.lon}`, lat: s.lat as number, lon: s.lon as number, name: s.name ?? null })),
    [stations]
  );

  return <LeafletMap stations={pts} />;
}
