// lib/orgAuth.ts
// Vérifie la session utilisateur (Bearer token Supabase) et charge son
// organisation. Utilisé par toutes les routes /api/org/*.
import type { NextRequest } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";
import { scopeOfType, isScope, type OrgScope } from "@/lib/orgScope";

export type Org = {
  id: string;
  slug: string;
  name: string;
  type: string;
  state_id: string | null;
  city: string | null;
  public_email: string | null;
  verified: boolean;
  plan: string;
  retention_days: number | null;
  deadline_tracking: boolean | null;
  finder_held_enabled: boolean | null;
  public_intro: string | null;
  public_hours: string | null;
  public_location: string | null;
  auto_match: boolean | null;
};

export type OrgContext = {
  userId: string;
  email: string;
  /** Organisation active pour cette requête. */
  org: Org | null;
  /** Toutes les organisations du compte : un même agent peut gérer le
   *  service de police d'une ville ET le campus voisin. */
  orgs: Org[];
  /** Portail demandé, et organisations qui en relèvent. */
  scope: OrgScope | null;
  scopedOrgs: Org[];
  role: string | null;
};

export async function getOrgContext(req: NextRequest): Promise<OrgContext | null> {
  const auth = req.headers.get("authorization") || "";
  const token = auth.startsWith("Bearer ") ? auth.slice(7) : "";
  if (!token) return null;

  const sb = getSupabaseAdmin();
  if (!sb) return null;

  const { data: userData, error } = await sb.auth.getUser(token);
  if (error || !userData?.user) return null;

  const userId = userData.user.id;
  const email = userData.user.email || "";

  // ⚠️ Avant : .limit(1).maybeSingle(), donc la PREMIÈRE appartenance trouvée,
  // sans tri. Un compte membre de deux établissements — un commissariat et une
  // université, par exemple — tombait toujours sur le même sans pouvoir
  // changer. On charge désormais toutes ses organisations.
  const { data: memberships } = await sb
    .from("org_members")
    .select("role, organizations(id, slug, name, type, state_id, city, public_email, verified, plan, public_listing, retention_days, retention_set_at, deadline_tracking, finder_held_enabled, public_intro, public_hours, public_location, auto_match)")
    .eq("user_id", userId);

  const rows = (memberships || []) as any[];
  const orgs: Org[] = rows.map((m) => m.organizations).filter(Boolean);

  // Tri stable : par type puis par nom, pour que l'ordre ne change pas d'une
  // requête à l'autre (c'est ce qui rendait le comportement imprévisible).
  const TYPE_ORDER = ["university", "college", "school", "police", "city", "transit", "hotel", "other"];
  const rank = (t: string) => {
    const i = TYPE_ORDER.indexOf(t);
    return i === -1 ? TYPE_ORDER.length : i; // un type inconnu passe en fin, pas en tête
  };
  orgs.sort((a, b) => {
    const t = rank(a.type) - rank(b.type);
    return t !== 0 ? t : String(a.name).localeCompare(String(b.name));
  });

  // Portail d'où vient la demande : /campus n'expose que les universités,
  // /org que les autres structures. Une université ne doit jamais voir
  // l'inventaire d'un commissariat, et réciproquement.
  const rawScope = (req.headers.get("x-org-scope") || "").trim().toLowerCase();
  const scope: OrgScope | null = isScope(rawScope) ? rawScope : null;
  const scopedOrgs = scope ? orgs.filter((o) => scopeOfType(o.type) === scope) : orgs;

  // L'organisation active peut être choisie par l'appelant, via l'en-tête
  // x-org-id. Elle n'est retenue que si le compte en est réellement membre
  // ET qu'elle relève du portail demandé : un identifiant deviné, ou celui
  // d'une structure de l'autre portail, ne donne accès à rien.
  const wanted = (req.headers.get("x-org-id") || "").trim();
  const active =
    (wanted && scopedOrgs.find((o) => String(o.id) === wanted)) || scopedOrgs[0] || null;
  const role = rows.find((m) => m.organizations?.id === active?.id)?.role || null;

  return { userId, email, org: active, orgs, scope, scopedOrgs, role };
}
