// app/api/org/settings/route.ts — réglages de l'organisation
// (page publique on/off, durée de conservation, suivi des échéances on/off)
import { NextRequest, NextResponse } from "next/server";
import { getOrgContext } from "@/lib/orgAuth";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";
import { normalizeRetentionDays, orgRetention } from "@/lib/orgRetention";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function PATCH(req: NextRequest) {
  const ctx = await getOrgContext(req);
  if (!ctx?.org) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  // Les réglages engagent tout l'établissement : réservés aux administrateurs.
  if (ctx.role !== "admin") {
    return NextResponse.json({ error: "Only an administrator of this account can change settings." }, { status: 403 });
  }

  const b = await req.json().catch(() => null);
  const patch: Record<string, any> = {};

  if (typeof b?.public_listing === "boolean") patch.public_listing = b.public_listing;
  if (typeof b?.deadline_tracking === "boolean") patch.deadline_tracking = b.deadline_tracking;
  if (typeof b?.finder_held_enabled === "boolean") patch.finder_held_enabled = b.finder_held_enabled;

  // Identité de l'établissement. Le slug (adresse publique, QR codes imprimés)
  // ne change PAS avec le nom : une affiche déjà posée doit continuer de mener
  // au bon endroit. Le type non plus : il décide du portail.
  if (b?.name !== undefined) {
    const name = String(b.name || "").trim().slice(0, 120);
    if (name.length < 3) return NextResponse.json({ error: "The name must have at least 3 characters." }, { status: 400 });
    patch.name = name;
  }
  // Page publique : texte libre, borné, stocké tel quel (affiché sans HTML).
  if (b?.public_intro !== undefined) patch.public_intro = String(b.public_intro || "").trim().slice(0, 600) || null;
  if (b?.public_hours !== undefined) patch.public_hours = String(b.public_hours || "").trim().slice(0, 300) || null;
  if (b?.public_location !== undefined) patch.public_location = String(b.public_location || "").trim().slice(0, 200) || null;
  if (b?.city !== undefined) patch.city = String(b.city || "").trim().slice(0, 80) || null;
  if (b?.state_id !== undefined) patch.state_id = String(b.state_id || "").trim().toUpperCase().slice(0, 2) || null;
  if (b?.public_email !== undefined) {
    const em = String(b.public_email || "").trim().toLowerCase().slice(0, 160);
    if (em && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(em)) return NextResponse.json({ error: "Enter a valid email address." }, { status: 400 });
    patch.public_email = em || null;
  }

  let newDays: number | null = null;
  if (b?.retention_days !== undefined) {
    newDays = normalizeRetentionDays(b.retention_days);
    if (newDays === null) {
      return NextResponse.json(
        { error: "Holding period must be a number of days between 1 and 3650." },
        { status: 400 }
      );
    }
    patch.retention_days = newDays;
    patch.retention_set_at = new Date().toISOString();
  }

  if (!Object.keys(patch).length) {
    return NextResponse.json({ error: "rien à modifier" }, { status: 400 });
  }

  const sb = getSupabaseAdmin()!;
  const { error } = await sb.from("organizations").update(patch).eq("id", ctx.org.id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Changer la durée sans recalculer laisserait deux règles cohabiter dans le
  // même inventaire, sans rien pour l'expliquer. On reprend donc les objets
  // ENCORE EN STOCK depuis leur date de découverte. Ce qui a été rendu ou jeté
  // n'est jamais retouché : c'est un historique, pas un état courant.
  let recomputed = 0;
  if (newDays !== null) {
    const { data: items } = await sb
      .from("found_items")
      .select("id, date")
      .eq("org_id", ctx.org.id)
      .in("status", ["stored", "claim_pending"])
      .limit(5000);

    for (const it of items || []) {
      if (!it?.date) continue;
      const d = new Date(it.date);
      d.setDate(d.getDate() + newDays);
      const { error: e2 } = await sb
        .from("found_items")
        .update({ legal_deadline: d.toISOString().slice(0, 10) })
        .eq("id", it.id);
      if (!e2) recomputed++;
    }
  }

  const retention = orgRetention({ ...ctx.org, retention_days: patch.retention_days ?? ctx.org.retention_days });
  return NextResponse.json({ ok: true, recomputed, retention });
}
