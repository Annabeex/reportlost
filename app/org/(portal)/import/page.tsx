import type { Metadata } from "next";
import PortalImport from "@/components/portal/PortalImport";

export const metadata: Metadata = { title: "Import items | ReportLost for organizations", robots: { index: false, follow: false } };

export default function Page() {
  return <PortalImport />;
}
