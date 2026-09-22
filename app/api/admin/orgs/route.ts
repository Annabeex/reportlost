// app/api/admin/orgs/route.ts — gestion des organisations depuis l'admin.
// GET  : liste des orgs + compteurs d'objets + email du membre fondateur.
// PATCH: { id, verified } → valide ou suspend. À la 1re validation, un mail
// de bienvenue avec le lien de la page publique part à l'établissement.
// Protégé par Basic Auth via le middleware /api/admin/*.
import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";
import { sendMailDirect } from "@/lib/mailer";
import { signRows } from "@/lib/orgPhotos";
import { portalBase, scopeOfType, publicPath } from "@/lib/orgScope";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const sb = getSupabaseAdmin();
  if (!sb) return NextResponse.json({ error: "Supabase non configuré" }, { status: 500 });

  const { data: orgs, error } = await sb
    .from("organizations")
    .select("id, slug, name, type, state_id, city, public_email, phone, verified, public_listing, plan, created_at")
    .order("created_at", { ascending: false });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Avant : TOUS les objets de TOUS les établissements chargés à chaque
  // ouverture. Désormais les compteurs sont calculés en base, et l'aperçu se
  // limite aux 12 derniers objets par établissement.
  const orgIds = (orgs || []).map((o) => String(o.id));
  const counts: Record<string, { total: number; stored: number; claims: number }> = {};
  const preview: Record<string, any[]> = {};
  await Promise.all(orgIds.map(async (id) => {
    const head = (extra?: (q: any) => any) => {
      let q = sb.from("found_items").select("id", { count: "exact", head: true }).eq("org_id", id);
      if (extra) q = extra(q);
      return q.then((r: any) => r.count || 0);
    };
    const [total, stored, claims, { data: last }] = await Promise.all([
      head(),
      head((q) => q.eq("status", "stored")),
      head((q) => q.eq("status", "claim_pending")),
      sb.from("found_items")
        .select("id, org_ref, title, image_url, status, date, public_visible")
        .eq("org_id", id).order("created_at", { ascending: false }).limit(12),
    ]);
    counts[id] = { total, stored, claims };
    preview[id] = await signRows(sb, (last || []) as any[]);
  }));

  // Email du membre fondateur (compte de connexion), utile quand public_email est vide
  const { data: members } = await sb.from("org_members").select("org_id, user_id");
  const memberEmail: Record<string, string> = {};
  for (const m of members || []) {
    if (memberEmail[String(m.org_id)]) continue;
    try {
      const { data: u } = await sb.auth.admin.getUserById(m.user_id);
      if (u?.user?.email) memberEmail[String(m.org_id)] = u.user.email;
    } catch {}
  }

  return NextResponse.json({
    orgs: (orgs || []).map((o) => ({
      ...o,
      counts: counts[String(o.id)] || { total: 0, stored: 0, claims: 0 },
      items: preview[String(o.id)] || [],
      member_email: memberEmail[String(o.id)] || null,
    })),
  });
}

export async function PATCH(req: NextRequest) {
  try {
    const b = await req.json().catch(() => null);
    const id = String(b?.id || "").trim();
    const verified = b?.verified;
    if (!id || typeof verified !== "boolean") {
      return NextResponse.json({ error: "id et verified requis" }, { status: 400 });
    }

    const sb = getSupabaseAdmin();
    if (!sb) return NextResponse.json({ error: "Supabase non configuré" }, { status: 500 });

    const { data: org } = await sb
      .from("organizations")
      .select("id, slug, name, type, public_email, verified")
      .eq("id", id)
      .maybeSingle();
    if (!org) return NextResponse.json({ error: "organisation introuvable" }, { status: 404 });

    const firstApproval = verified && !org.verified;
    const { error } = await sb.from("organizations").update({ verified }).eq("id", id);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    if (firstApproval) {
      // Mail de bienvenue : public_email sinon email du membre fondateur
      let to = org.public_email || "";
      if (!to) {
        const { data: m } = await sb.from("org_members").select("user_id").eq("org_id", id).limit(1).maybeSingle();
        if (m?.user_id) {
          try {
            const { data: u } = await sb.auth.admin.getUserById(m.user_id);
            to = u?.user?.email || "";
          } catch {}
        }
      }
      if (to) {
        try {
          await sendMailDirect({
            to,
            subject: `${org.name} is now live on ReportLost`,
            text: `Hello,

Good news: your organization has been approved. Your public lost & found page is now live:

https://reportlost.org${publicPath(org)}

What it shows: only the generic label, the found date and the drop-off location of the items you chose to list. Details and photos stay private and are used to verify ownership claims.

You can manage everything (items, visibility, claims) from your dashboard:
${"https://reportlost.org" + portalBase(scopeOfType(org.type)) + "/dashboard"}

Feel free to link your public page from your website or share it at your front desk. If you have any question, just reply to this email.

ReportLost.org`,
            fromName: "ReportLost",
          });
        } catch {}
      }
    }

    return NextResponse.json({ ok: true, notified: firstApproval });
  } catch (e: any) {
    return NextResponse.json({ error: String(e?.message || e) }, { status: 500 });
  }
}
