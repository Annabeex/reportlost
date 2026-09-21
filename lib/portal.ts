"use client";
// lib/portal.ts
//
// Le portail est déduit de l'URL, pas d'un état stocké : /campus/* est le
// portail universitaire, tout le reste est le portail des structures. Une
// URL collée dans un mail ouvre donc toujours le bon.
//
// Chaque appel API porte l'en-tête x-org-scope. Le serveur s'en sert pour
// n'exposer que les organisations du portail demandé : une université ne voit
// jamais l'inventaire d'un commissariat, même si le compte gère les deux.

import { usePathname } from "next/navigation";
import { supabaseBrowser } from "@/lib/supabaseBrowser";
import { activeOrgId } from "@/components/OrgSwitcher";
import { portalBase, otherScope, WORDS, type OrgScope } from "@/lib/orgScope";

export function scopeOfPath(pathname?: string | null): OrgScope {
  const p = String(pathname || "");
  return p === "/campus" || p.startsWith("/campus/") ? "campus" : "agency";
}

export function usePortal() {
  const scope = scopeOfPath(usePathname());
  const other = otherScope(scope);
  return {
    scope,
    other,
    base: portalBase(scope),
    otherBase: portalBase(other),
    words: WORDS[scope],
  };
}

/** Envoi d'un fichier (multipart) avec la même authentification. Pas de
 *  Content-Type ici : le navigateur doit poser lui-même la frontière multipart. */
export async function portalUpload(scope: OrgScope, url: string, form: FormData) {
  const { data: { session } } = await supabaseBrowser.auth.getSession();
  if (!session) throw new Error("no-session");
  const id = activeOrgId(scope);
  return fetch(url, {
    method: "POST",
    body: form,
    headers: {
      Authorization: `Bearer ${session.access_token}`,
      "x-org-scope": scope,
      ...(id ? { "x-org-id": id } : {}),
    },
  });
}

/** fetch authentifié, portant le portail et l'établissement actif. */
export async function portalFetch(scope: OrgScope, url: string, init?: RequestInit) {
  const { data: { session } } = await supabaseBrowser.auth.getSession();
  if (!session) throw new Error("no-session");
  const id = activeOrgId(scope);
  return fetch(url, {
    ...init,
    headers: {
      ...(init?.headers || {}),
      Authorization: `Bearer ${session.access_token}`,
      "Content-Type": "application/json",
      "x-org-scope": scope,
      // Revalidé côté serveur contre les appartenances réelles du compte.
      ...(id ? { "x-org-id": id } : {}),
    },
  });
}
