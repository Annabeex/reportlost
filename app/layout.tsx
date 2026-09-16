// app/layout.tsx
import "./globals.css";
import { Inter } from "next/font/google";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import SiteChrome from "@/components/SiteChrome";
import Analytics from "@/components/Analytics";
import VisitTracker from "@/components/VisitTracker";
import { Suspense } from "react";

const inter = Inter({ subsets: ["latin"] });

export const metadata = {
  // Base URL (important pour canonical / OG)
  metadataBase: new URL("https://reportlost.org"),

  // ✅ Title par défaut (couvre home + pages légales)
  title: {
    default: "ReportLost | Lost & Found Reporting Service",
    template: "%s | ReportLost",
  },

  // ✅ Description par défaut (sobre, crédible, SEO-safe)
  description:
    "Report a lost item online and help match owners with found items across the United States.",

  openGraph: {
    siteName: "ReportLost",
    type: "website",
    url: "https://reportlost.org",
  },

  twitter: {
    card: "summary_large_image",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body
        className={`${inter.className} min-h-screen bg-gray-50 text-gray-800`}
      >
        {/* Analytics utilise useSearchParams → DOIT être sous Suspense */}
        <Suspense fallback={null}>
          <Analytics />
        </Suspense>
        <VisitTracker />

        {/* Masqués sur /org/* et /campus/*, qui ont leur propre en-tête. */}
        <SiteChrome>
          <header>
            <Navbar />
          </header>
        </SiteChrome>

        <main className="flex-1">{children}</main>

        <SiteChrome>
          <footer>
            <Footer />
          </footer>
        </SiteChrome>
      </body>
    </html>
  );
}
