'use client';

import Image from 'next/image';

export default function ClickableMap() {
  return (
    <div className="mt-12 text-center">
      <h2 className="text-2xl font-bold text-gray-800 mb-4">United States Coverage</h2>
      <p className="text-gray-600 mb-6">Our services are available in all 50 U.S. states.</p>
      <Image
        src="/images/usa-map-gray.svg"
        alt="Clickable map of the United States"
        width={800}
        height={500}
        className="mx-auto"
      />
    </div>
  );
}
