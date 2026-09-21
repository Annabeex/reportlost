import type { Metadata } from "next";
import PortalTeam from "@/components/portal/PortalTeam";

export const metadata: Metadata = { title: "Team | ReportLost for organizations", robots: { index: false, follow: false } };

export default function Page() {
  return <PortalTeam />;
}
