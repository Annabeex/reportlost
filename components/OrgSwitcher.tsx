"use client";
// components/OrgSwitcher.tsx
//
// Sélecteur d'établissement. Un même compte peut gérer plusieurs structures —
// un service de police municipal et le campus voisin, par exemple — et les
// deux n'ont ni le même vocabulaire, ni les mêmes règles de conservation.
//
// Le choix est mémorisé PAR PORTAIL : sélectionner une université dans
// /campus ne doit rien changer à ce qu'on voit dans /org. Il est renvoyé à
// chaque appel via l'en-tête x-org-id, que le serveur revalide contre les
// appartenances réelles.

import type { OrgScope } from "@/lib/orgScope";

const key = (scope: OrgScope) => `reportlost_active_org_${scope}`;

export function activeOrgId(scope: OrgScope): string {
  try {
    return localStorage.getItem(key(scope)) || "";
  } catch {
    return "";
  }
}

export function setActiveOrgId(scope: OrgScope, id: string) {
  try {
    if (id) localStorage.setItem(key(scope), id);
    else localStorage.removeItem(key(scope));
  } catch {
    /* navigation privée : sans effet, on retombe sur la première organisation */
  }
}

/** Libellé lisible du type, affiché à côté du nom. */
const TYPE_LABEL: Record<string, string> = {
  university: "University",
  college: "College",
  school: "School",
  police: "Police",
  city: "City",
  transit: "Transit",
  hotel: "Hotel",
  other: "Organization",
};

const TYPE_STYLE: Record<string, string> = {
  university: "bg-indigo-50 text-indigo-800 ring-indigo-200",
  college: "bg-indigo-50 text-indigo-800 ring-indigo-200",
  school: "bg-violet-50 text-violet-800 ring-violet-200",
  police: "bg-blue-50 text-blue-800 ring-blue-200",
  city: "bg-slate-100 text-slate-700 ring-slate-200",
  transit: "bg-amber-50 text-amber-800 ring-amber-200",
  hotel: "bg-rose-50 text-rose-800 ring-rose-200",
  other: "bg-gray-100 text-gray-700 ring-gray-200",
};

export function OrgTypeBadge({ type }: { type?: string | null }) {
  const t = String(type || "other");
  return (
    <span
      className={`rounded-full px-2.5 py-0.5 text-[11.5px] font-bold ring-1 ${
        TYPE_STYLE[t] || TYPE_STYLE.other
      }`}
    >
      {TYPE_LABEL[t] || TYPE_LABEL.other}
    </span>
  );
}

export default function OrgSwitcher({
  orgs,
  activeId,
  onChange,
}: {
  orgs: { id: string; name: string; type: string; city?: string | null }[];
  activeId: string;
  onChange: (id: string) => void;
}) {
  // Une seule organisation : pas de sélecteur, juste son nom et son type.
  // Un menu à une entrée est du bruit.
  if (!orgs || orgs.length <= 1) {
    const only = orgs?.[0];
    if (!only) return null;
    return (
      <span className="flex items-center gap-2 text-[14px] text-gray-700">
        {only.name}
        <OrgTypeBadge type={only.type} />
      </span>
    );
  }

  return (
    <label className="flex items-center gap-2">
      <span className="sr-only">Établissement</span>
      <select
        value={activeId}
        onChange={(e) => onChange(e.target.value)}
        className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-[14px] font-semibold text-gray-800"
      >
        {orgs.map((o) => (
          <option key={o.id} value={o.id}>
            {TYPE_LABEL[o.type] || TYPE_LABEL.other} · {o.name}
            {o.city ? ` — ${o.city}` : ""}
          </option>
        ))}
      </select>
    </label>
  );
}
