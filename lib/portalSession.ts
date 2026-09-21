"use client";
// lib/portalSession.ts
//
// Ce que chaque écran du portail fait en arrivant : vérifier la session,
// charger l'établissement actif, renvoyer vers le bon portail ou l'inscription
// si besoin. Écrit une fois ici pour les nouveaux écrans (Team, Import).

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { usePortal, portalFetch } from "@/lib/portal";
import { scopeOfType, portalBase } from "@/lib/orgScope";
import { setActiveOrgId } from "@/components/OrgSwitcher";

export function usePortalSession(page: string) {
  const router = useRouter();
  const portal = usePortal();
  const { scope, base } = portal;
  const [org, setOrg] = useState<any>(null);
  const [orgs, setOrgs] = useState<any[]>([]);
  const [cross, setCross] = useState(0);
  const [role, setRole] = useState<string | null>(null);
  const [pending, setPending] = useState(0);

  const api = useCallback(
    (url: string, init?: RequestInit) => portalFetch(scope, url, init),
    [scope]
  );

  const load = useCallback(async () => {
    try {
      const me = await api("/api/org/me");
      if (me.status === 401) { router.push(`${base}/login`); return; }
      const mj = await me.json();
      const all = Array.isArray(mj.allOrgs) ? mj.allOrgs : [];
      if (!mj.org) {
        const elsewhere = all.filter((o: any) => scopeOfType(o.type) !== scope);
        router.push(
          elsewhere.length
            ? `${portalBase(scopeOfType(elsewhere[0].type))}/${page}`
            : `${base}/onboarding`
        );
        return;
      }
      setOrg(mj.org);
      setOrgs(Array.isArray(mj.orgs) ? mj.orgs : []);
      setRole(mj.role || null);
      setCross(all.filter((o: any) => scopeOfType(o.type) !== scope).length);

      api("/api/org/matches?status=new")
        .then((res) => res.json())
        .then((j) => setPending(Array.isArray(j.matches) ? j.matches.length : 0))
        .catch(() => {});
    } catch {
      router.push(`${base}/login`);
    }
  }, [api, base, page, router, scope]);

  useEffect(() => { load(); }, [load]);

  const switchOrg = useCallback(
    (id: string) => { setActiveOrgId(scope, id); setOrg(null); load(); },
    [load, scope]
  );

  return { ...portal, api, org, orgs, cross, role, pending, switchOrg };
}
