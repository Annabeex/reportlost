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
          </ul>
        </div>

        <div>
          <h4 className="font-semibold mb-2">Support</h4>
          <ul className="space-y-1">
            <li><Link href="/helpcenter">Help center</Link></li>
            <li><Link href="/contact">Contact us</Link></li>
          </ul>
        </div>

        <div>
          <h4 className="font-semibold mb-2">Legal</h4>
          <ul className="space-y-1">
            <li><Link href="/legal">Legal Notice</Link></li>
            <li><Link href="/terms">Terms of Use</Link></li>
            <li><Link href="/privacy">Privacy Policy</Link></li>
            <li><Link href="/cookies">Cookie Policy</Link></li>
          </ul>
        </div>

        <div>
          <h4 className="font-semibold mb-2">Follow</h4>
          <ul className="space-y-1">
            <li>
              <a
                href="https://x.com/ReportlostUs"
                target="_blank"
                rel="noopener noreferrer"
              >
                X (Twitter)
              </a>
            </li>
            <li>
              <a
                href="https://www.facebook.com/profile.php?id=61581471865057"
                target="_blank"
                rel="noopener noreferrer"
              >
                Facebook
              </a>
            </li>
            <li>
              <a
                href="https://www.instagram.com/reportlost_us/"
                target="_blank"
                rel="noopener noreferrer"
              >
                Instagram
              </a>
            </li>
          </ul>
        </div>
      </div>

      <div className="flex items-center justify-center h-16 text-xs text-gray-500">
        © {new Date().getFullYear()} ReportLost. All rights reserved.
      </div>
    </footer>
  );
}
