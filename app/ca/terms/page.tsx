// app/ca/terms/page.tsx — CGV canadiennes (prix en CA$).
// 🔒 noindex tant que le Canada n'est pas lancé.
import type { Metadata } from "next";
import CaTermsContent from "./CaTermsContent";

export const metadata: Metadata = {
  title: "Terms of Use (Canada)",
  description: "Terms of use for reports of items lost in Canada. Prices in Canadian dollars.",
  alternates: { canonical: "https://reportlost.org/ca/terms" },
  robots: { index: false, follow: true },
};

export default function CaTermsPage() {
  return <CaTermsContent />;
}
