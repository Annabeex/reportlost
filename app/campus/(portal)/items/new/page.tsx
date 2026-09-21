import type { Metadata } from "next";
import PortalNewItem from "@/components/portal/PortalNewItem";

export const metadata: Metadata = { title: "Log a found item | ReportLost for campus", robots: { index: false, follow: false } };

export default function Page() {
  return <PortalNewItem />;
}
