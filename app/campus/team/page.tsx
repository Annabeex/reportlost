import type { Metadata } from "next";
import PortalTeam from "@/components/portal/PortalTeam";

export const metadata: Metadata = { title: "Team | ReportLost for campus", robots: { index: false, follow: false } };

export default function Page() {
  return <PortalTeam />;
}
