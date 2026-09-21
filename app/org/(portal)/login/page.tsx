import type { Metadata } from "next";
import PortalLogin from "@/components/portal/PortalLogin";

export const metadata: Metadata = { title: "Organization sign in | ReportLost", robots: { index: false, follow: false } };

export default function Page() {
  return <PortalLogin />;
}
