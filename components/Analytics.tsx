// components/Analytics.tsx
'use client';

import { useEffect } from 'react';
import Script from 'next/script';
import { usePathname, useSearchParams } from 'next/navigation';

declare global {
  interface Window {
    dataLayer: any[];
    gtag: (...args: any[]) => void;
  }
}

const GA_ID = process.env.NEXT_PUBLIC_GA_ID; // ex: G-XXXXXXX

export default function Analytics() {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // Renvoie null si pas de clé (dev ou env non configuré)
  if (!GA_ID) {
    if (process.env.NODE_ENV === 'development') {
      console.warn('Analytics: NEXT_PUBLIC_GA_ID is not defined; skipping GA.');
    }
    return null;
  }

  // Envoie un page_view à chaque changement d’URL (App Router)
  useEffect(() => {
    const url = pathname + (searchParams?.toString() ? `?${searchParams}` : '');
    // GA4 : gtag('config', GA_ID, { page_path: url })
    if (typeof window !== 'undefined' && typeof window.gtag === 'function') {
      window.gtag('config', GA_ID, { page_path: url });
    }
  }, [pathname, searchParams]);

  return (
    <>
      {/* charge gtag.js */}
      <Script
        id="ga-loader"
        src={`https://www.googletagmanager.com/gtag/js?id=${GA_ID}`}
        strategy="afterInteractive"
      />
      {/* initialise dataLayer & première config */}
      <Script id="gtag-init" strategy="afterInteractive">
        {`
          window.dataLayer = window.dataLayer || [];
          function gtag(){window.dataLayer.push(arguments);}
          gtag('js', new Date());
          gtag('config', '${GA_ID}', { anonymize_ip: true });
        `}
      </Script>
    </>
  );
}
