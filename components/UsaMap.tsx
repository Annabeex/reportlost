'use client';

import { useRouter } from 'next/navigation';
import { ComposableMap, Geographies, Geography } from 'react-simple-maps';
import states from '@/lib/states';

const geoUrl = 'https://cdn.jsdelivr.net/npm/us-atlas@3/states-10m.json';

export default function UsaMap() {
  const router = useRouter();

  return (
    <div className="w-full max-w-5xl mx-auto">
      <ComposableMap projection="geoAlbersUsa">
        <Geographies geography={geoUrl}>
          {(geoData: any) =>
            geoData.geographies.map((geo: any) => {
              const stateCode = geo.properties?.postal;
              const state = states.find((s) => s.code === stateCode);
              const slug = state?.slug;

              return (
                <Geography
                  key={geo.rsmKey}
                  geography={geo}
                  onClick={() => {
                    if (slug) router.push(`/states/${slug}`);
                  }}
                  style={{
                    default: { fill: '#E0E0E0', outline: 'none', cursor: slug ? 'pointer' : 'default' },
                    hover: { fill: '#93C5FD', outline: 'none' }, // bleu clair Tailwind (blue-300)
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
