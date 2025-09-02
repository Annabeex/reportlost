'use client';

import { useRouter } from 'next/navigation';
import { ComposableMap, Geographies, Geography } from 'react-simple-maps';
import states from '@/lib/states';

const geoUrl = 'https://cdn.jsdelivr.net/npm/us-atlas@3/states-10m.json';

// ✅ Création d’un mapping { "california": "CA", "new york": "NY", ... }
const NAME_TO_ABBR: Record<string, string> = states.reduce((acc, state) => {
  acc[state.name.toLowerCase()] = state.code; // on mappe vers l’abréviation
  return acc;
}, {} as Record<string, string>);

export default function UsaMap() {
  const router = useRouter();

  return (
    <div className="w-full max-w-5xl mx-auto">
      <ComposableMap projection="geoAlbersUsa">
        <Geographies geography={geoUrl}>
          {(geoData: { geographies: any[] }) =>
            geoData.geographies.map((geo) => {
              const stateName = String(geo.properties.name || '').toLowerCase();
              const abbr = NAME_TO_ABBR[stateName];

              return (
                <Geography
                  key={geo.rsmKey}
                  geography={geo}
                  onClick={() => {
                    if (abbr) {
                      router.push(`/lost-and-found/${abbr.toLowerCase()}`);
                    }
                  }}
                  style={{
                    default: { fill: '#E0E0E0', outline: 'none', cursor: abbr ? 'pointer' : 'default' },
                    hover: { fill: abbr ? '#93C5FD' : '#E0E0E0', outline: 'none' },
                    pressed: { fill: abbr ? '#3B82F6' : '#E0E0E0', outline: 'none' },
                  }}
                />
              );
            })
          }
        </Geographies>
      </ComposableMap>
    </div>
  );
}
