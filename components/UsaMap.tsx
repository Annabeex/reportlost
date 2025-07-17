'use client';

import { ComposableMap, Geographies, Geography } from 'react-simple-maps';

const geoUrl = 'https://cdn.jsdelivr.net/npm/us-atlas@3/states-10m.json';

export default function UsaMap() {
  return (
    <div className="w-full max-w-5xl mx-auto">
      <ComposableMap projection="geoAlbersUsa">
        <Geographies geography={geoUrl}>
          {(geographiesData: any) =>
            geographiesData.geographies.map((geo: any) => (
              <Geography
                key={geo.rsmKey}
                geography={geo}
                style={{
                  default: { fill: '#E0E0E0', outline: 'none' },
                  hover: { fill: '#FF5722', outline: 'none' },
                  pressed: { fill: '#FF5722', outline: 'none' },
                }}
              />
            ))
          }
        </Geographies>
      </ComposableMap>
    </div>
  );
}
