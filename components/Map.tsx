'use client';

import dynamic from 'next/dynamic';
import 'leaflet/dist/leaflet.css';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import { useEffect } from 'react';

import iconUrl from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';

const DefaultIcon = L.icon({
  iconUrl: iconUrl as unknown as string,
  shadowUrl: iconShadow as unknown as string,
  iconAnchor: [12, 41],
});

L.Marker.prototype.options.icon = DefaultIcon;

export const metadata = ({ params }: { params: { state: string; city: string } }) => {
  const city = decodeURIComponent(params.city).replace(/-/g, ' ');
  const state = decodeURIComponent(params.state).replace(/-/g, ' ');

  const title = `Lost and Found in ${city}, ${state}`;
  const description = `Looking for a lost item in ${city}, ${state}? Discover the local process to recover your belongings — from police to local hotspots.`;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      url: `https://reportlost.org/${params.state}/${params.city}`,
      type: 'website'
    },
    twitter: {
      card: 'summary',
      title,
      description
    },
    alternates: {
      canonical: `/us/${params.state}/${params.city}`
    }
  };
};

export default function CityMap({ lat, lon, name }: { lat: number; lon: number; name?: string }) {
  useEffect(() => {
    console.log('🗺️ CityMap mounted with:', { lat, lon, name });
  }, [lat, lon, name]);

  if (!lat || !lon) {
    console.warn('❌ Invalid coordinates passed to CityMap:', { lat, lon });
    return null;
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
