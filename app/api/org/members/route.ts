// app/api/org/members/route.ts — équipe d'un établissement.
//   GET    : membres + invitations en attente (tout membre)
//   POST   : inviter un collègue par e-mail (administrateur)
//   PATCH  : changer un rôle (administrateur)
//   DELETE : retirer un membre ou annuler une invitation (administrateur)
//
// Deux rôles. « staff » enregistre, rend, confirme les dépôts : tout le
// quotidien. « admin » y ajoute ce qui engage l'établissement : réglages,
// équipe, import.
import { NextRequest, NextResponse } from "next/server";
import { randomBytes } from "node:crypto";
import { getOrgContext } from "@/lib/orgAuth";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";
import { sendMailDirect } from "@/lib/mailer";
import { portalBase, scopeOfType } from "@/lib/orgScope";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const ROLES = new Set(["admin", "staff"]);
const MAX_TEAM = 30;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const forbidden = () =>
  NextResponse.json({ error: "Only an administrator of this account can manage the team." }, { status: 403 });

async function adminCount(sb: any, orgId: string): Promise<number> {
  const { count } = await sb
    .from("org_members")
    .select("user_id", { count: "exact", head: true })
    .eq("org_id", orgId)
    .eq("role", "admin");
  return count || 0;
}

export async function GET(req: NextRequest) {
  const ctx = await getOrgContext(req);
  if (!ctx?.org) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const sb = getSupabaseAdmin()!;

  const { data: rows } = await sb
    .from("org_members")
    .select("user_id, role, created_at")
    .eq("org_id", ctx.org.id)
    .order("created_at", { ascending: true });

  const members = await Promise.all(
    (rows || []).map(async (m: any) => {
      let email = "";
      try {
        const { data: u } = await sb.auth.admin.getUserById(m.user_id);
        email = u?.user?.email || "";
      } catch {}
      return { user_id: m.user_id, role: m.role, email, joined_at: m.created_at, me: m.user_id === ctx.userId };
    })
  );

  const { data: invites } = await sb
    .from("org_invites")
    .select("id, email, role, created_at, expires_at")
    .eq("org_id", ctx.org.id)
    .is("accepted_at", null)
    .order("created_at", { ascending: false });

  const now = Date.now();
  return NextResponse.json({
    ok: true,
    role: ctx.role,
    members,
    invites: (invites || []).map((i: any) => ({ ...i, expired: new Date(i.expires_at).getTime() < now })),
  });
}

export async function POST(req: NextRequest) {
  const ctx = await getOrgContext(req);
  if (!ctx?.org) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  if (ctx.role !== "admin") return forbidden();
  const sb = getSupabaseAdmin()!;

  const b = await req.json().catch(() => null);
  const email = String(b?.email || "").trim().toLowerCase().slice(0, 160);
  const role = ROLES.has(b?.role) ? String(b.role) : "staff";
  if (!EMAIL_RE.test(email)) return NextResponse.json({ error: "Enter a valid email address." }, { status: 400 });
  if (email === ctx.email.toLowerCase()) {
    return NextResponse.json({ error: "This is your own address." }, { status: 400 });
  }

  const [{ count: nMembers }, { data: pendingInvites }] = await Promise.all([
    sb.from("org_members").select("user_id", { count: "exact", head: true }).eq("org_id", ctx.org.id),
    sb.from("org_invites").select("id, email").eq("org_id", ctx.org.id).is("accepted_at", null),
  ]);
  const existing = (pendingInvites || []).find((i: any) => String(i.email).toLowerCase() === email);
  if (!existing && (nMembers || 0) + (pendingInvites || []).length >= MAX_TEAM) {
    return NextResponse.json({ error: `A team is limited to ${MAX_TEAM} people. Contact us to raise the limit.` }, { status: 400 });
  }

  const token = randomBytes(24).toString("base64url");
  const expires = new Date(Date.now() + 14 * 86400000).toISOString();

  // Réinviter la même adresse renouvelle le lien au lieu d'empiler les lignes.
  const { error } = existing
    ? await sb.from("org_invites").update({ token, role, expires_at: expires, invited_by: ctx.email }).eq("id", existing.id)
    : await sb.from("org_invites").insert({ org_id: ctx.org.id, email, role, token, invited_by: ctx.email, expires_at: expires });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const base = (process.env.NEXT_PUBLIC_SITE_URL || "https://reportlost.org").replace(/\/+$/, "");
  const link = `${base}${portalBase(scopeOfType(ctx.org.type))}/login?invite=${encodeURIComponent(token)}`;
  const sent = await sendMailDirect({
    to: email,
    subject: `${ctx.org.name}: access to the lost and found inventory`,
    text: `Hello,

${ctx.email} invites you to join the lost and found inventory of ${ctx.org.name} on ReportLost.

Open this link and sign in, or create your account, with this email address (${email}):
${link}

The link is valid for 14 days and only works for this address. If you were not expecting this invitation, you can ignore this message.

ReportLost.org`,
    fromName: "ReportLost",
    replyTo: ctx.email,
    noBcc: true,
  });

  return NextResponse.json({ ok: true, sent, link });
}

export async function PATCH(req: NextRequest) {
  const ctx = await getOrgContext(req);
  if (!ctx?.org) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  if (ctx.role !== "admin") return forbidden();
  const sb = getSupabaseAdmin()!;

  const b = await req.json().catch(() => null);
  const userId = String(b?.user_id || "");
  const role = String(b?.role || "");
  if (!userId || !ROLES.has(role)) return NextResponse.json({ error: "requête invalide" }, { status: 400 });

  const { data: target } = await sb
    .from("org_members").select("role").eq("org_id", ctx.org.id).eq("user_id", userId).maybeSingle();
  if (!target) return NextResponse.json({ error: "introuvable" }, { status: 404 });

  // Un établissement sans administrateur ne pourrait plus rien régler.
  if (target.role === "admin" && role !== "admin" && (await adminCount(sb, ctx.org.id)) <= 1) {
    return NextResponse.json({ error: "An account needs at least one administrator." }, { status: 400 });
  }

  const { error } = await sb.from("org_members").update({ role }).eq("org_id", ctx.org.id).eq("user_id", userId);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}

export async function DELETE(req: NextRequest) {
  const ctx = await getOrgContext(req);
  if (!ctx?.org) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  if (ctx.role !== "admin") return forbidden();
  const sb = getSupabaseAdmin()!;

  const b = await req.json().catch(() => null);
  const inviteId = String(b?.invite_id || "");
  const userId = String(b?.user_id || "");

  if (inviteId) {
    const { error } = await sb.from("org_invites").delete().eq("id", inviteId).eq("org_id", ctx.org.id);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ ok: true });
  }

  if (!userId) return NextResponse.json({ error: "requête invalide" }, { status: 400 });
  const { data: target } = await sb
    .from("org_members").select("role").eq("org_id", ctx.org.id).eq("user_id", userId).maybeSingle();
  if (!target) return NextResponse.json({ error: "introuvable" }, { status: 404 });
  if (target.role === "admin" && (await adminCount(sb, ctx.org.id)) <= 1) {
    return NextResponse.json({ error: "An account needs at least one administrator." }, { status: 400 });
  }

  const { error } = await sb.from("org_members").delete().eq("org_id", ctx.org.id).eq("user_id", userId);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
