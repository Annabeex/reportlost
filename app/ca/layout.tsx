// app/ca/layout.tsx — habillage des pages canadiennes (/ca/…).
// Le bandeau et le pied de page américains y sont masqués par
// components/SiteChrome.tsx ; on affiche ici leurs versions canadiennes.
import CaNavbar from "@/components/ca/CaNavbar";
import CaFooter from "@/components/ca/CaFooter";

export default function CaLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <header>
        <CaNavbar />
      </header>
      {children}
      <CaFooter />
    </>
  );
}
