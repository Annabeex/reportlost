import type { Metadata } from "next";
import PortalOnboarding from "@/components/portal/PortalOnboarding";

export const metadata: Metadata = { title: "Set up your organization | ReportLost", robots: { index: false, follow: false } };

export default function Page() {
  return <PortalOnboarding />;
}
