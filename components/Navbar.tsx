'use client';

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

// ✅ Logo texte + pin (remplace l'ancien PNG /images/logo-reportlost.png)
function BrandLogo({ compact = false }: { compact?: boolean }) {
  const pin = compact ? 26 : 30;
  return (
    <span className="flex items-center gap-2">
      <svg width={pin} height={pin} viewBox="0 0 24 24" aria-hidden="true" focusable="false">
        <path
          fillRule="evenodd"
          clipRule="evenodd"
          d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5a2.5 2.5 0 110-5 2.5 2.5 0 010 5z"
          fill="#1e293b"
        />
      </svg>
      <span className={`${compact ? 'text-xl' : 'text-2xl'} font-extrabold tracking-tight leading-none`}>
        <span className="text-gray-900">Report</span>
        <span className="text-blue-500">Lost</span>
        <span className="text-gray-400 text-sm font-bold align-top ml-0.5">.org</span>
      </span>
    </span>
  );
}

export default function Navbar() {
  const pathname = usePathname() || '/';
  const slant = 28; // largeur de la pente oblique
  const [isMobile, setIsMobile] = useState(false);

  // ✅ UX: On détecte si on est sur une page université pour cacher les onglets
  const isUniPage = pathname.startsWith('/universities');

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
          <BrandLogo />
        </Link>
        <div className="space-x-4 text-sm text-gray-700">
          <Link href="/report" className="hover:text-blue-600 transition-colors">
            Report
          </Link>
          <Link href="/lost-pet-poster" className="hover:text-blue-600 transition-colors">
            🐾 Lost Pet Poster
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
          <BrandLogo compact={isMobile} />
        </Link>

        {/* Liens (Cachés si on est sur une page Université) */}
        {!isUniPage && !isMobile && (
          <Link
            href="/lost-pet-poster"
            className="mr-4 hidden items-center text-sm text-gray-700 transition-colors hover:text-blue-600 lg:flex"
          >
            🐾 Lost Pet Poster
          </Link>
        )}
        {!isUniPage && (
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
        )}
      </div>
    </nav>
  );
}