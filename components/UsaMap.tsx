'use client';

// @ts-ignore
import USAMap from 'react-usa-map';
import { useRouter } from 'next/navigation';

export default function UsaMap() {
  const router = useRouter();

  const mapHandler = (event: React.MouseEvent<SVGPathElement>) => {
    const stateAbbr = event.currentTarget.dataset.name;
    if (stateAbbr) {
      router.push(`/states/${stateAbbr.toLowerCase()}`);
    }
  };

  return (
    <div className="usa-map-wrapper w-full max-w-[600px] mx-auto">
      <USAMap onClick={mapHandler} />
    </div>
  );
}
