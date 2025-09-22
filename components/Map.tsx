"use client";

import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

const DefaultIcon = L.icon({
  iconUrl: "/images/marker-icon.png",
  shadowUrl: "/images/marker-shadow.png",
  iconAnchor: [12, 41],
});
L.Marker.prototype.options.icon = DefaultIcon;

type PoliceStation = {
  id?: string | number;
  lat: number | null | undefined;
  lon: number | null | undefined;
  name?: string | null;
};

// type guard : après ce filtre, on sait que lat/lon sont des number
function isValidStation(
  s: PoliceStation
): s is { id?: string | number; lat: number; lon: number; name?: string | null } {
  return typeof s.lat === "number" && typeof s.lon === "number" && !Number.isNaN(s.lat) && !Number.isNaN(s.lon);
}

export default function CityMap({ stations }: { stations: PoliceStation[] }) {
  const validStations = (stations ?? []).filter(isValidStation) as Array<{
    id?: string | number;
    lat: number;
    lon: number;
    name?: string | null;
  }>;

  if (validStations.length === 0) {
    return (
      <div className="text-gray-500 h-full w-full grid place-items-center">
        No police stations found
      </div>
    );
  }

  // ✅ après le check de length, on prend le premier en type pleinement défini
  const first = validStations[0]; // { lat: number; lon: number; ... }
  const center: [number, number] = [first.lat, first.lon];

  return (
    <MapContainer
      center={center}
      zoom={13}
      scrollWheelZoom={false}
      style={{ height: "100%", width: "100%" }}
    >
      <TileLayer
        attribution='&copy; <a href="https://carto.com/">Carto</a>'
        url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
      />

      {validStations.map((s, idx) => (
        <Marker
          key={String(s.id ?? `${s.lat},${s.lon},${idx}`)}
          position={[s.lat, s.lon] as [number, number]}  // cast tuple OK
        >
          <Popup>
            <strong>{s.name ?? "Police station"}</strong>
          </Popup>
        </Marker>
      ))}
    </MapContainer>
  );
}
