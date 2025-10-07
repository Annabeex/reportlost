// app/layout.tsx
import "./globals.css";
import { Inter } from "next/font/google";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import Analytics from "@/components/Analytics";
import { Suspense } from "react";

/**
 * IMPORTANT:
 * Do NOT set a static `title` or `description` here if you want per-route
 * `generateMetadata` to take effect. Keep only site-level metadata.
 */
export const metadata = {
  // base URL for open graph / canonical building
  metadataBase: new URL("https://reportlost.org"),

  // site-level only (no static title/description)
  openGraph: {
    siteName: "ReportLost.org",
    type: "website",
  },
  twitter: { card: "summary_large_image" },
  // Optionally:
  // title: { default: "ReportLost.org", template: "%s - ReportLost.org" },
};

const inter = Inter({ subsets: ["latin"] });

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={`${inter.className} min-h-screen bg-gray-50 text-gray-800`}>
        {/* ✅ Analytics utilise useSearchParams → il DOIT être sous Suspense */}
        <Suspense fallback={null}>
          <Analytics />
        </Suspense>

        {/* Global navbar */}
        <header>
          <Navbar />
        </header>

        {/* Main content */}
        <main className="flex-1">{children}</main>

        {/* Global footer */}
        <footer>
          <Footer />
        </footer>
      </body>
    </html>
  );
}
