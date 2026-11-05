'use client';
// 🇨🇦 COPIE CANADIENNE de components/Navbar.tsx — bandeau des pages /ca.
// Le bandeau américain est masqué sous /ca par components/SiteChrome.tsx.

import Link from 'next/link';
import { Search } from 'lucide-react';

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

// Coche des boutons « found » (copie de components/Navbar.tsx).
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

export default function CaNavbar() {
  const slant = 28; // largeur de la pente oblique (identique au bandeau US)

  return (
    <nav className="relative m-0 flex h-[60px] items-center border-b border-gray-200 bg-white p-0 sm:h-[72px]">
      <div className="mx-auto flex h-full w-full max-w-7xl items-center justify-between px-2 sm:px-4">
        {/* Logo → accueil Canada */}
        <Link href="/ca" className="flex items-center" prefetch={false}>
          <span className="flex sm:hidden">
            <BrandLogo compact />
          </span>
          <span className="hidden sm:flex">
            <BrandLogo />
          </span>
          <span className="ml-2 rounded bg-red-50 px-1.5 py-0.5 text-[11px] font-semibold text-red-700">
            Canada
          </span>
        </Link>

        {/* Mobile : deux pastilles compactes, comme le bandeau US. */}
        <div className="flex items-center gap-1.5 sm:hidden">
          <Link
            href="/ca/report"
            prefetch={false}
            className="inline-flex items-center rounded-md bg-[#15803d] px-3 py-2 text-[11px] font-bold tracking-wide text-white"
          >
            <Search size={13} className="mr-1.5 opacity-95" />
            LOST
          </Link>
          <Link
            href="/ca/report?tab=found"
            prefetch={false}
            className="inline-flex items-center rounded-md bg-[#60a5fa] px-3 py-2 text-[11px] font-bold tracking-wide text-white"
          >
            <SmallCheck size={13} />
            FOUND
          </Link>
        </div>

        {/* Ordinateur : formes obliques pleine hauteur, comme le bandeau US. */}
        <div className="hidden h-full items-stretch gap-0 sm:flex">
          <Link
            href="/ca/report"
            prefetch={false}
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
            href="/ca/report?tab=found"
            prefetch={false}
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
        </div>
      </div>
    </nav>
  );
}
