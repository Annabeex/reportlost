import './globals.css'
import { Inter } from 'next/font/google'
import Navbar from '../components/Navbar'
import Footer from '../components/Footer'
import Script from 'next/script'

// ✅ METADATA GÉNÉRALE — utile si une page n’en définit pas une spécifique
export const metadata = {
  title: 'Lost and Found – ReportLost.org',
  description: 'Report your lost items and find them quickly with local help across the U.S.',
  metadataBase: new URL('https://reportlost.org'),
  openGraph: {
    title: 'Lost and Found – ReportLost.org',
    description: 'Find your lost belongings by contacting local authorities and checking known hotspots.',
    url: 'https://reportlost.org',
    type: 'website',
    siteName: 'ReportLost.org',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Lost and Found – ReportLost.org',
    description: 'Find your lost items by searching locally across the U.S.',
  },
  alternates: {
    canonical: '/',
  },
}

const inter = Inter({ subsets: ['latin'] })

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        {/* Google Analytics */}
        <Script
          strategy="afterInteractive"
          src="https://www.googletagmanager.com/gtag/js?id=G-JGM5658XGE"
        />
        <Script
          id="google-analytics"
          strategy="afterInteractive"
          dangerouslySetInnerHTML={{
            __html: `
              window.dataLayer = window.dataLayer || [];
              function gtag(){dataLayer.push(arguments);}
              gtag('js', new Date());
              gtag('config', 'G-JGM5658XGE');
            `,
          }}
        />
      </head>
      <body className={`${inter.className} bg-gray-100`}>
        <Navbar />
        <main className="min-h-screen">{children}</main>
        <Footer />
      </body>
    </html>
  )
}
