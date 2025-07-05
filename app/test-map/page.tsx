'use client';

import { useEffect } from 'react';
import 'leaflet/dist/leaflet.css';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';

const DefaultIcon = L.icon({
  iconUrl: '/images/marker-icon.png',
  shadowUrl: '/images/marker-shadow.png',
  iconAnchor: [12, 41],
});

L.Marker.prototype.options.icon = DefaultIcon;

export default function TestMapPage() {
  const lat = 40.7128;
  const lon = -74.006;
  const name = 'New York';

  useEffect(() => {
    console.log('🗺️ TestMap loaded!');
  }, []);

  return (
    <main className="h-screen w-screen p-8 bg-gray-100">
      <div className="h-full w-full border rounded shadow overflow-hidden">
        <MapContainer
          center={[lat, lon]}
          zoom={13}
          scrollWheelZoom={true}
          style={{ height: '100%', width: '100%' }}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/">OpenStreetMap</a>'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <Marker position={[lat, lon]}>
            <Popup>{name}</Popup>
          </Marker>
        </MapContainer>
      </div>
    </main>
  );
}
