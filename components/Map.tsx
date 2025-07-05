'use client';

import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import { useEffect } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Icônes locales depuis /public/images
const DefaultIcon = L.icon({
  iconUrl: '/images/marker-icon.png',
  shadowUrl: '/images/marker-shadow.png',
  iconAnchor: [12, 41],
});
L.Marker.prototype.options.icon = DefaultIcon;

// Typage facultatif mais propre
type PoliceStation = {
  id: number;
  lat: number;
  lon: number;
  tags?: Record<string, string>;
};

export default function CityMap({
  stations,
}: {
  stations: PoliceStation[];
}) {
  const first = stations?.[0];

  useEffect(() => {
    console.log('🗺️ Map loaded with police stations:', stations);
  }, [stations]);

  if (!first) return <div className="text-red-500">No police stations found</div>;

  return (
    <MapContainer
      center={[first.lat, first.lon]}
      zoom={13}
      scrollWheelZoom={false}
      style={{ height: '100%', width: '100%' }}
    >
      {/* Carto Light – style moderne */}
      <TileLayer
        attribution='&copy; <a href="https://carto.com/">Carto</a>'
        url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
      />

      {stations.map((station) => {
        const tags = station.tags || {};
        const address = [tags['addr:housenumber'], tags['addr:street'], tags['addr:city']]
          .filter(Boolean)
          .join(' ');

        return (
          <Marker key={station.id} position={[station.lat, station.lon]}>
            <Popup>
              <strong>{tags.name || 'Police station'}</strong>
              <br />
              {address && <>{address}<br /></>}
              {tags.opening_hours && <>🕒 {tags.opening_hours}</>}
            </Popup>
          </Marker>
        );
      })}
    </MapContainer>
  );
}
