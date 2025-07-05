'use client';

import { useEffect } from 'react';
import 'leaflet/dist/leaflet.css';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';

import iconUrl from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';

// Définir l'icône par défaut de Leaflet
const DefaultIcon = L.icon({
  iconUrl: iconUrl as unknown as string,
  shadowUrl: iconShadow as unknown as string,
  iconAnchor: [12, 41],
});
L.Marker.prototype.options.icon = DefaultIcon;

export default function CityMap({
  lat,
  lon,
  name,
}: {
  lat: number;
  lon: number;
  name?: string;
}) {
  useEffect(() => {
    console.log('🗺️ CityMap mounted with:', { lat, lon, name });
  }, [lat, lon, name]);

if (!lat || !lon || isNaN(lat) || isNaN(lon)) {
  console.warn('❌ Invalid or missing coordinates. Falling back to default map center.');

  return (
    <MapContainer
      center={[37.0902, -95.7129]} // centre approximatif des USA
      zoom={4}
      scrollWheelZoom={false}
      style={{ height: '100%', width: '100%' }}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <Popup position={[37.0902, -95.7129]}>
        Default location — please check coordinates.
      </Popup>
    </MapContainer>
  );
}


  return (
    <MapContainer
      center={[lat, lon]}
      zoom={13}
      scrollWheelZoom={false}
      style={{ height: '100%', width: '100%' }}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <Marker position={[lat, lon]}>
        <Popup>{name || 'Police station'}</Popup>
      </Marker>
    </MapContainer>
  );
}
