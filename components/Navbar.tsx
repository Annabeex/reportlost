'use client';

import Image from 'next/image';
import Link from 'next/link';

export default function Navbar() {
  return (
    <nav className="bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between shadow-sm">
      <Link href="/">
        <div className="flex items-center">
          <Image
            src="/images/logo-reportlost.png"
            alt="ReportLost Logo"
            width={160}
            height={40}
            priority
          />
        </div>
      </Link>
      <div className="space-x-4 text-sm text-gray-700">
        <Link href="/report">Report</Link>
        <Link href="/about">About</Link>
        <Link href="/contact">Contact</Link>
      </div>
    </nav>
  );
}
