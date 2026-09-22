"use client";
// components/portal/PortalNav.tsx
//
// En-tête commune aux deux portails. Le nom de marque et les liens changent
// selon /campus ou /org, mais la disposition reste la même : un agent qui
// gère les deux ne doit pas avoir à réapprendre l'écran.

import type { ReactNode } from "react";
import Link from "next/link";
import OrgSwitcher from "@/components/OrgSwitcher";
import SupportDialog from "@/components/portal/SupportDialog";
import { usePortal } from "@/lib/portal";

export default function PortalNav({
  current,
  pending = 0,
  orgs,
  activeId,
  onChangeOrg,
  crossPortal = 0,
}: {
  current: "review" | "inventory" | "new" | "team" | "import";
  pending?: number;
  orgs: { id: string; name: string; type: string; city?: string | null }[];
  activeId: string;
  onChangeOrg: (id: string) => void;
  /** Nombre d'établissements que le compte gère dans l'AUTRE portail. */
  crossPortal?: number;
}) {
  const { base, otherBase, words, other } = usePortal();

  const link = (key: typeof current, href: string, label: ReactNode) =>
    current === key ? (
      <span key={key} className="font-bold text-gray-900">{label}</span>
    ) : (
      <Link key={key} href={href} className="hover:text-gray-900">{label}</Link>
    );

  return (
    <div className="border-b border-gray-200 bg-white">
      <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-4 px-5 py-4">
        <span className="text-[19px] font-bold tracking-tight">
          ReportLost <span className="font-semibold text-gray-400">{words.brandSuffix}</span>
        </span>
        <nav className="flex flex-wrap gap-x-5 gap-y-1 text-[14.5px] text-gray-600">
          {link("review", `${base}/review`, (
            <>
              To review
              {pending > 0 && (
                <span className="ml-1.5 rounded-full bg-amber-500 px-2 py-0.5 text-[11.5px] font-bold text-white">
                  {pending}
                </span>
              )}
            </>
          ))}
          {link("inventory", `${base}/dashboard`, "Inventory")}
          {link("new", `${base}/items/new`, "Log an item")}
          {link("team", `${base}/team`, "Team")}
        </nav>
        <div className="flex items-center gap-3">
          <SupportDialog />
          <OrgSwitcher orgs={orgs} activeId={activeId} onChange={onChangeOrg} />
          {crossPortal > 0 && (
            <Link href={`${otherBase}/dashboard`} className="text-[13px] text-gray-400 underline hover:text-gray-700">
              {other === "campus" ? "Campus portal" : "Organization portal"}
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}
