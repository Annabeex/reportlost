import './globals.css';
import { Inter } from 'next/font/google';
import Navbar from '../components/Navbar'; // À créer dans un fichier séparé
import Footer from '../components/Footer'; // À créer aussi

const inter = Inter({ subsets: ['latin'] });

export const metadata = {
  title: 'Lost & Found USA',
  description: 'Find your lost items across U.S. cities',
};

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
