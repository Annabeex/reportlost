import './globals.css';
import { Inter } from 'next/font/google';
import Navbar from '../components/Navbar'; 
import Footer from '../components/Footer'; 

// ✅ METADATA — unique déclaration !
export const metadata = {
  title: 'Lost and Found – ReportLost.org',
  description: 'Report your lost items and find them quickly with local help across the U.S.',
  openGraph: {
    title: 'Lost and Found – ReportLost.org',
    description: 'Find your lost belongings by contacting local authorities and checking known hotspots.',
    url: 'https://reportlost.org',
    type: 'website'
  },
  twitter: {
    card: 'summary',
    title: 'Lost and Found – ReportLost.org',
    description: 'Find your lost items by searching locally across the U.S.'
  },
  alternates: {
    canonical: 'https://reportlost.org'
  }
};

const inter = Inter({ subsets: ['latin'] });

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={`${inter.className} bg-gray-100`}>
        <Navbar />
        <main className="min-h-screen">{children}</main>
        <Footer />
      </body>
    </html>
  );
}

