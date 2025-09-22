"use client";

import Script from "next/script";

export default function Analytics() {
  return (
    <>
      {/* Chargement de la librairie Google Analytics */}
      <Script
        src="https://www.googletagmanager.com/gtag/js?id=G-JGM5658XGE"
        strategy="afterInteractive"
      />
      {/* Initialisation */}
      <Script id="google-analytics" strategy="afterInteractive">
        {`
          window.dataLayer = window.dataLayer || [];
          function gtag(){window.dataLayer.push(arguments);}
          gtag('js', new Date());
          gtag('config', 'G-JGM5658XGE');
        `}
      </Script>
    </>
  );
}
