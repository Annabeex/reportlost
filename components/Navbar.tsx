'use client';

import Image from 'next/image';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Search } from 'lucide-react';
import { useEffect, useState } from 'react';

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
  const [isMobile, setIsMobile] = useState(false);

  // Détection de la taille d’écran
  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 640);
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // --- Navbar home
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

  // --- Navbar site (autres pages)
  return (
    <nav
      className="relative bg-white border-b border-gray-200 flex items-center"
      style={{
        height: isMobile ? 60 : 72,
        padding: 0,
        margin: 0,
      }}
    >
      <div
        className={`max-w-7xl mx-auto w-full ${
          isMobile ? 'px-2' : 'px-4'
        } flex items-center justify-between h-full`}
      >
        {/* Logo */}
        <Link href="/" className="flex items-center" passHref>
          <Image
            src="/images/logo-reportlost.png"
            alt="ReportLost Logo"
            width={isMobile ? 140 : 160}
            height={48}
            priority
            className="cursor-pointer"
          />
        </Link>

        {/* Liens */}
        <div className="flex items-stretch gap-0 h-full">
          {/* --- VERSION MOBILE : droite et compacte --- */}
          {isMobile ? (
            <>
              <Link
                href="/report?tab=lost"
                className="flex items-center justify-center bg-green-600 text-white font-semibold px-3 py-1 text-xs rounded-l-md"
              >
                <Search size={14} className="mr-1 opacity-95" />
                LOST
              </Link>
              <Link
                href="/report?tab=found"
                className="flex items-center justify-center bg-blue-500 text-white font-semibold px-3 py-1 text-xs rounded-r-md"
              >
                <SmallCheck size={14} />
                FOUND
              </Link>
            </>
          ) : (
            <>
              {/* --- VERSION DESKTOP : oblique --- */}
              <Link
                href="/report?tab=lost"
                className="flex items-center font-semibold text-white no-underline"
                style={{
                  position: 'relative',
                  padding: '0 26px 0 28px',
                  background: 'linear-gradient(90deg,#26723e 0%, #2ea052 100%)',
                  clipPath: `polygon(${slant}px 0, 100% 0, calc(100% - ${slant}px) 100%, 0 100%)`,
                  height: '100%',
                  zIndex: 1,
                }}
              >
                <Search size={18} className="mr-2 opacity-95" />
                <span className="whitespace-nowrap">I lost something</span>
              </Link>

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
                <span className="whitespace-nowrap">I found something</span>
              </Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}
