'use client';
// 🇨🇦 COPIE CANADIENNE de components/Footer.tsx — pied de page des pages /ca.
// Aucun lien vers les pages américaines (guides par État, assistance USA).
// Les comptes X et Instagram sont communs (Anna y partage aussi le Canada). Le pied de page US est masqué sous /ca (SiteChrome).

import Link from 'next/link';

export default function CaFooter() {
  return (
    <footer className="bg-gray-100 border-t border-gray-200 mt-16 py-8 px-4 text-sm text-gray-600">
      <div className="max-w-6xl mx-auto grid grid-cols-2 sm:grid-cols-3 gap-4">
        <div>
          <h4 className="font-semibold mb-2">Canada</h4>
          <ul className="space-y-1">
            <li><Link href="/ca" prefetch={false}>Lost &amp; found in Canada</Link></li>
            <li><Link href="/ca/report" prefetch={false}>Report a lost item</Link></li>
            <li><Link href="/contact" prefetch={false}>Contact us</Link></li>
          </ul>
        </div>

        <div>
          <h4 className="font-semibold mb-2">Legal</h4>
          <ul className="space-y-1">
            <li><Link href="/ca/terms" prefetch={false}>Terms of Use (Canada)</Link></li>
            <li><Link href="/privacy" prefetch={false}>Privacy Policy</Link></li>
            <li><Link href="/cookies" prefetch={false}>Cookie Policy</Link></li>
            <li><Link href="/legal" prefetch={false}>Legal Notice</Link></li>
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
