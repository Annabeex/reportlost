'use client';

import Script from 'next/script';

// (optionnel mais propre en TS)
declare global {
  interface Window {
    dataLayer: any[];
    gtag: (...args: any[]) => void;
  }
}

const GA_ID = process.env.NEXT_PUBLIC_GA_ID;

export default function Analytics() {
  if (!GA_ID) {
    if (process.env.NODE_ENV === 'development') {
      console.warn(
        'Analytics: NEXT_PUBLIC_GA_ID is not defined; skipping Google Analytics scripts.'
      );
    }

    return null;
  }

  return (
    <>
      {/* charge la lib gtag */}
      <Script
        src={`https://www.googletagmanager.com/gtag/js?id=${GA_ID}`}
        strategy="afterInteractive"
      />
      {/* initialise dataLayer correctement */}
      <Script id="gtag-init" strategy="afterInteractive">
        {`
          window.dataLayer = window.dataLayer || [];
          function gtag(){window.dataLayer.push(arguments);}
          gtag('js', new Date());
          gtag('config', ${JSON.stringify(GA_ID)}, { anonymize_ip: true });
        `}
      </Script>
    </>
  );
}
