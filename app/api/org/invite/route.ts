// app/api/org/invite/route.ts — invitation d'un collègue.
//   GET  ?token=  public : à quoi correspond ce lien (nom de l'établissement,
//                 adresse invitée), pour l'afficher sur l'écran de connexion.
//   POST {token}  connecté : rejoindre l'établissement.
//
// Le lien ne vaut que pour l'adresse invitée : transféré à quelqu'un d'autre,
// il n'ouvre rien.
import { NextRequest, NextResponse } from "next/server";
import { getOrgContext } from "@/lib/orgAuth";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";
import { scopeOfType } from "@/lib/orgScope";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

async function findInvite(token: string) {
  const sb = getSupabaseAdmin();
  if (!sb || token.length < 20) return null;
  const { data } = await sb
    .from("org_invites")
    .select("id, org_id, email, role, expires_at, accepted_at, organizations(id, name, type)")
    .eq("token", token)
    .maybeSingle();
  return (data as any) || null;
}

const state = (inv: any) =>
  !inv ? "invalid" : inv.accepted_at ? "used" : new Date(inv.expires_at).getTime() < Date.now() ? "expired" : "valid";

export async function GET(req: NextRequest) {
  const token = String(req.nextUrl.searchParams.get("token") || "");
  const inv = await findInvite(token);
  const st = state(inv);
  if (st !== "valid") return NextResponse.json({ ok: false, state: st }, { status: 404 });
  return NextResponse.json({
    ok: true,
    state: st,
    email: inv.email,
    org_name: inv.organizations?.name || "",
    scope: scopeOfType(inv.organizations?.type),
  });
}

export async function POST(req: NextRequest) {
  const ctx = await getOrgContext(req);
  if (!ctx) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const b = await req.json().catch(() => null);
  const inv = await findInvite(String(b?.token || ""));
  const st = state(inv);
  if (st === "expired") return NextResponse.json({ error: "This invitation has expired. Ask your colleague to send a new one." }, { status: 410 });
  if (st !== "valid") return NextResponse.json({ error: "This invitation link is no longer valid." }, { status: 404 });

  if (String(inv.email).toLowerCase() !== ctx.email.toLowerCase()) {
    return NextResponse.json(
      { error: `This invitation was sent to ${inv.email}. Sign in with that address to accept it.` },
      { status: 403 }
    );
  }

  const sb = getSupabaseAdmin()!;
  const { error } = await sb
    .from("org_members")
    .upsert({ org_id: inv.org_id, user_id: ctx.userId, role: inv.role === "admin" ? "admin" : "staff" }, { onConflict: "org_id,user_id", ignoreDuplicates: true });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  await sb.from("org_invites").update({ accepted_at: new Date().toISOString() }).eq("id", inv.id);

  return NextResponse.json({
    ok: true,
    org_id: inv.org_id,
    org_name: inv.organizations?.name || "",
    scope: scopeOfType(inv.organizations?.type),
  });
}
