'use client';

import { ComposableMap, Geographies, Geography } from 'react-simple-maps';
import Link from 'next/link';
import states from '@/lib/states';

const geoUrl = 'https://cdn.jsdelivr.net/npm/us-atlas@3/states-10m.json';

export default function UsaMap() {
  return (
    <div className="w-full max-w-5xl mx-auto">
      <ComposableMap projection="geoAlbersUsa">
        <Geographies geography={geoUrl}>
          {(geoData: any) =>
            geoData.geographies.map((geo: any) => {
              const stateCode = geo.properties?.postal;
              const state = states.find((s) => s.code === stateCode);
              const slug = state?.slug;

              const shape = (
                <Geography
                  key={geo.rsmKey}
                  geography={geo}
                  style={{
                    default: { fill: '#E0E0E0', outline: 'none' },
                    hover: { fill: '#3B82F6', outline: 'none' },
                    pressed: { fill: '#3B82F6', outline: 'none' },
                  }}
                />
              );

              return slug ? (
                <Link key={geo.rsmKey} href={`/states/${slug}`} legacyBehavior>
                  <a aria-label={state?.name}>{shape}</a>
                </Link>
              ) : (
                shape
              );
            })
          }
        </Geographies>
      </ComposableMap>
    </div>
  );
}
