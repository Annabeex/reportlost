'use client';

import Image from 'next/image';
import Link from 'next/link';

export default function Navbar() {
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
        <Link href="/report" className="hover:text-blue-600 transition-colors">Report</Link>
        <Link href="/about" className="hover:text-blue-600 transition-colors">About</Link>
        <Link href="/contact" className="hover:text-blue-600 transition-colors">Contact</Link>
      </div>
    </nav>
  );
}
