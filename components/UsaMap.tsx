'use client';

import { useRouter } from 'next/navigation';
import { ComposableMap, Geographies, Geography } from 'react-simple-maps';
import states from '@/lib/states';

const geoUrl = 'https://cdn.jsdelivr.net/npm/us-atlas@3/states-10m.json';

export default function UsaMap() {
  const router = useRouter();

  const stateSlugMap = states.reduce((acc, state) => {
    acc[state.name.toLowerCase()] = state.slug;
    return acc;
  }, {} as Record<string, string>);

  return (
    <div className="w-full max-w-5xl mx-auto">
      <ComposableMap projection="geoAlbersUsa">
        <Geographies geography={geoUrl}>
          {(geoData: { geographies: any[] }) =>
            geoData.geographies.map((geo) => {
              const stateName = geo.properties.name.toLowerCase();
              const slug = stateSlugMap[stateName];

              return (
                <Geography
                  key={geo.rsmKey}
                  geography={geo}
                  onClick={() => {
                    if (slug) {
                      router.push(`/states/${slug}`);
                    }
                  }}
                  style={{
                    default: { fill: '#E0E0E0', outline: 'none', cursor: 'pointer' },
                    hover: { fill: '#93C5FD', outline: 'none' }, // bleu clair
                    pressed: { fill: '#3B82F6', outline: 'none' },
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
