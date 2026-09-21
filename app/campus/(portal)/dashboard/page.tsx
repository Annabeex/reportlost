import type { Metadata } from "next";
import PortalDashboard from "@/components/portal/PortalDashboard";

export const metadata: Metadata = { title: "Inventory | ReportLost for campus", robots: { index: false, follow: false } };

export default function Page() {
  return <PortalDashboard />;
}
