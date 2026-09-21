import type { Metadata } from "next";
import PortalReview from "@/components/portal/PortalReview";

export const metadata: Metadata = { title: "To review | ReportLost for organizations", robots: { index: false, follow: false } };

export default function Page() {
  return <PortalReview />;
}
