'use client';

import { useEffect } from 'react';
import dynamic from 'next/dynamic';
import 'leaflet/dist/leaflet.css';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';

// 👉 Utilisation des icônes placées dans /public/images
const DefaultIcon = L.icon({
  iconUrl: '/images/marker-icon.png',
  shadowUrl: '/images/marker-shadow.png',
  iconAnchor: [12, 41],
});

L.Marker.prototype.options.icon = DefaultIcon;

export default function CityMap({
  lat,
  lon,
  name,
  tags,
}: {
  lat: number;
  lon: number;
  name?: string;
  tags?: Record<string, string>;
}) {

  useEffect(() => {
    console.log('📍 Map loaded with:', { lat, lon, name });
  }, [lat, lon, name]);

  if (!lat || !lon) return <div className="text-red-500">Invalid location data</div>;

  return (
    <MapContainer
      center={[lat, lon]}
      zoom={13}
      scrollWheelZoom={true}
      style={{ height: '100%', width: '100%' }}
    >
    <TileLayer
  attribution='&copy; <a href="https://carto.com/">CARTO</a>'
  url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
/>

      <Marker position={[lat, lon]}>
        <Popup>{name || 'Police station'}</Popup>
      </Marker>
    </MapContainer>
  );
}
