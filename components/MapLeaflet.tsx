"use client";

import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

// icônes locales (public/images/marker-icon.png, marker-shadow.png)
const DefaultIcon = L.icon({
  iconUrl: "/images/marker-icon.png",
  shadowUrl: "/images/marker-shadow.png",
  iconAnchor: [12, 41],
});
L.Marker.prototype.options.icon = DefaultIcon;

type Pt = { id: string | number; lat: number; lon: number; name: string | null };

export default function MapLeaflet({ stations }: { stations: Pt[] }) {
  if (!stations.length) {
    return <div className="h-full w-full grid place-items-center text-gray-500">No police stations found</div>;
  }
  const center: [number, number] = [stations[0].lat, stations[0].lon];

  return (
    <MapContainer center={center} zoom={13} scrollWheelZoom={false} style={{ height: "100%", width: "100%" }}>
      {/* Tuiles OpenStreetMap : les fonds CARTO exigent désormais une clé
          (« API KEY REQUIRED » constaté le 5 novembre 2026). */}
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://tile.openstreetmap.org/{z}/{x}/{y}.png"
        maxZoom={19}
      />
      {stations.map((s, i) => (
        <Marker key={String(s.id ?? i)} position={[s.lat, s.lon]}>
          <Popup>
            <strong>{s.name ?? "Police station"}</strong>
          </Popup>
        </Marker>
      ))}
    </MapContainer>
  );
}
