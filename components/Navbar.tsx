'use client';

import Image from 'next/image';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

export default function Navbar() {
  const pathname = usePathname() || '/';
  const isHome = pathname === '/';

  if (isHome) {
    return (
      <nav className="bg-white border-b border-gray-200 px-6 py-3 flex items-center justify-between shadow-sm">
        <Link href="/" className="flex items-center">
          <Image
            src="/images/logo-reportlost.png"
            alt="ReportLost Logo"
            width={160}
            height={44}
            priority
            className="cursor-pointer"
          />
        </Link>

        <div className="space-x-6 text-sm text-gray-700">
          <Link href="/report" className="hover:text-blue-600 transition-colors">Report</Link>
          <Link href="/about" className="hover:text-blue-600 transition-colors">About</Link>
          <Link href="/contact" className="hover:text-blue-600 transition-colors">Contact</Link>
        </div>
      </nav>
    );
  }

  // Default navbar for all other pages (articles, report page, etc.)
  return (
    <nav className="bg-white border-b border-gray-200 px-6 py-3 flex items-center justify-between shadow-sm">
      <Link href="/" className="flex items-center">
        <Image
          src="/images/logo-reportlost.png"
          alt="ReportLost Logo"
          width={160}
          height={44}
          priority
          className="cursor-pointer"
        />
      </Link>

      <div className="flex items-center gap-4">
        <Link
          href="/report?tab=lost"
          className="inline-flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium shadow-sm
                     bg-gradient-to-r from-green-600 to-green-500 text-white hover:from-green-700 hover:to-green-600"
        >
          Report a lost item
        </Link>

        <Link
          href="/report?tab=found"
          className="inline-flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium shadow-sm
                     bg-blue-100 text-blue-800 hover:bg-blue-200"
        >
          Report a found item
        </Link>
      </div>
    </nav>
  );
}
