"use client";
// 🇨🇦 COPIE CANADIENNE de components/MapLeaflet.tsx (US, non modifié).
// Différence : la carte se cadre sur TOUS les repères (fitBounds). À Toronto,
// les bureaux des objets trouvés vont du centre-ville à Pearson (~20 km) :
// centrer sur le premier repère en zoom 13 aurait caché l'aéroport.
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

const DefaultIcon = L.icon({
  iconUrl: "/images/marker-icon.png",
  shadowUrl: "/images/marker-shadow.png",
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
});
L.Marker.prototype.options.icon = DefaultIcon;

export type CaMapPoint = { id: string | number; lat: number; lon: number; name: string | null; address?: string | null };

export default function CaMapLeaflet({ points, emptyLabel }: { points: CaMapPoint[]; emptyLabel: string }) {
  if (!points.length) {
    return <div className="grid h-full w-full place-items-center text-gray-500">{emptyLabel}</div>;
  }
  const single = points.length === 1;
  const bounds = single ? undefined : L.latLngBounds(points.map((p) => [p.lat, p.lon] as [number, number]));

  return (
    <MapContainer
      {...(single ? { center: [points[0].lat, points[0].lon] as [number, number], zoom: 15 } : { bounds, boundsOptions: { padding: [36, 36] } })}
      scrollWheelZoom={false}
      style={{ height: "100%", width: "100%" }}
    >
      {/* Tuiles OpenStreetMap : les fonds CARTO exigent désormais une clé
          (« API KEY REQUIRED » constaté le 5 novembre 2026). */}
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://tile.openstreetmap.org/{z}/{x}/{y}.png"
        maxZoom={19}
      />
      {points.map((p) => (
        <Marker key={String(p.id)} position={[p.lat, p.lon]}>
          <Popup>
            <strong>{p.name ?? "Police station"}</strong>
            {p.address && <span style={{ display: "block", marginTop: 4 }}>{p.address}</span>}
          </Popup>
        </Marker>
      ))}
    </MapContainer>
  );
}
