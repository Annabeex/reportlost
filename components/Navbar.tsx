'use client';

import Image from 'next/image';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Search } from 'lucide-react';

// ✅ Petite coche verte (sans rond)
function SmallCheck({ size = 18 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      aria-hidden="true"
      focusable="false"
      className="mr-2"
    >
      <path
        d="M6 12.5l4 4L18 8"
        fill="none"
        stroke="#2ea052"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export default function Navbar() {
  const pathname = usePathname() || '/';
  const slant = 28; // largeur de la pente oblique

  // --- Navbar "home" : logo + petits liens
  if (pathname === '/') {
    return (
      <nav className="bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between shadow-sm">
        <Link href="/" className="flex items-center" passHref>
          <Image
            src="/images/logo-reportlost.png"
            alt="ReportLost Logo"
            width={180}
            height={48}
            priority
            className="cursor-pointer"
          />
        </Link>
        <div className="space-x-4 text-sm text-gray-700">
          <Link href="/report" className="hover:text-blue-600 transition-colors">
            Report
          </Link>
          <Link href="/about" className="hover:text-blue-600 transition-colors">
            About
          </Link>
          <Link href="/contact" className="hover:text-blue-600 transition-colors">
            Contact
          </Link>
        </div>
      </nav>
    );
  }

  // --- Navbar "site" (autres pages)
  return (
    <nav
      className="relative bg-white border-b border-gray-200 flex items-center"
      style={{ height: 72, padding: 0, margin: 0 }}
    >
      <div className="max-w-7xl mx-auto w-full px-4 flex items-center justify-between h-full">
        <Link href="/" className="flex items-center" passHref>
          <Image
            src="/images/logo-reportlost.png"
            alt="ReportLost Logo"
            width={160}
            height={48}
            priority
            className="cursor-pointer"
          />
        </Link>

        <div className="flex items-stretch gap-0 h-full">
          {/* Left: green (report lost) – oblique gauche et droite */}
          <Link
            href="/report?tab=lost"
            className="flex items-center font-semibold text-white no-underline"
            style={{
              position: 'relative',
              padding: '0 26px 0 28px', // un peu plus de marge à gauche
              background: 'linear-gradient(90deg,#26723e 0%, #2ea052 100%)',
              clipPath: `polygon(${slant}px 0, 100% 0, calc(100% - ${slant}px) 100%, 0 100%)`,
              height: '100%',
              zIndex: 1,
            }}
          >
            <Search size={18} className="mr-2 opacity-95" />
            <span className="whitespace-nowrap">Report a lost item</span>
          </Link>

          {/* Right: blue (report found) – oblique gauche + triangle vert de continuité */}
          <Link
            href="/report?tab=found"
            className="flex items-center font-semibold text-white no-underline"
            style={{
              position: 'relative',
              padding: '0 22px',
              background: 'linear-gradient(90deg,#7fb7ff 0%, #8ec3ff 100%)',
              clipPath: `polygon(${slant}px 0, 100% 0, 100% 100%, 0 100%)`,
              marginLeft: `${-slant + 2}px`,
              height: '100%',
              zIndex: 2,
            }}
          >
            {/* Triangle vert de continuité */}
            <span
              aria-hidden="true"
              style={{
                position: 'absolute',
                left: `${-slant}px`,
                top: 0,
                width: `${slant}px`,
                height: '100%',
                background: 'linear-gradient(90deg,#26723e 0%, #2ea052 100%)',
                clipPath: 'polygon(0 100%, 100% 0, 100% 100%)',
              }}
            />
            <SmallCheck size={18} />
            <span className="whitespace-nowrap">Report a found item</span>
          </Link>
        </div>
      </div>
    </nav>
  );
}
