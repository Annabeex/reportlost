// lib/orgAuth.ts
// Vérifie la session utilisateur (Bearer token Supabase) et charge son
// organisation. Utilisé par toutes les routes /api/org/*.
import type { NextRequest } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";

export type OrgContext = {
  userId: string;
  email: string;
  org: {
    id: string;
    slug: string;
    name: string;
    type: string;
    state_id: string | null;
    city: string | null;
    public_email: string | null;
    verified: boolean;
    plan: string;
  } | null;
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

  const { data: membership } = await sb
    .from("org_members")
    .select("role, organizations(id, slug, name, type, state_id, city, public_email, verified, plan, public_listing)")
    .eq("user_id", userId)
    .limit(1)
    .maybeSingle();

  const org = (membership as any)?.organizations || null;
  return { userId, email, org, role: (membership as any)?.role || null };
}
