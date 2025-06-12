'use client';

import Link from 'next/link';

export default function Footer() {
  return (
    <footer className="bg-gray-100 border-t border-gray-200 mt-16 py-8 px-4 text-sm text-gray-600">
      <div className="max-w-6xl mx-auto grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div>
          <h4 className="font-semibold mb-2">Company</h4>
          <ul className="space-y-1">
            <li><Link href="/about">About us</Link></li>
            <li><Link href="/team">Our team</Link></li>
            <li><Link href="/careers">Careers</Link></li>
          </ul>
        </div>
        <div>
          <h4 className="font-semibold mb-2">Support</h4>
          <ul className="space-y-1">
            <li><Link href="/help">Help center</Link></li>
            <li><Link href="/faq">FAQ</Link></li>
            <li><Link href="/contact">Contact us</Link></li>
          </ul>
        </div>
        <div>
          <h4 className="font-semibold mb-2">Legal</h4>
          <ul className="space-y-1">
            <li><Link href="/terms">Terms of use</Link></li>
            <li><Link href="/privacy">Privacy policy</Link></li>
            <li><Link href="/cookies">Cookie policy</Link></li>
          </ul>
        </div>
        <div>
          <h4 className="font-semibold mb-2">Follow</h4>
          <ul className="space-y-1">
            <li><a href="#">Twitter</a></li>
            <li><a href="#">Facebook</a></li>
            <li><a href="#">Instagram</a></li>
          </ul>
        </div>
      </div>
      <div className="text-center text-xs mt-6">© {new Date().getFullYear()} ReportLost. All rights reserved.</div>
    </footer>
  );
}
