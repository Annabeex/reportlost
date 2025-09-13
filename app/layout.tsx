import './globals.css';
import { Inter } from 'next/font/google';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import Analytics from '@/components/Analytics';


// ✅ METADATA GÉNÉRALE — Next l’injecte dans <head>
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
};

const inter = Inter({ subsets: ['latin'] });

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      {/* Pas de <head> manuel : metadata ci-dessus suffit */}
      <body className={`${inter.className} bg-gray-100`}>
        <Analytics /> {/* GA scripts, côté client */}
        <Navbar />
        <main className="min-h-screen">{children}</main>
        <Footer />
      </body>
    </html>
  );
}
