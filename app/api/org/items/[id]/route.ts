// app/api/org/items/[id]/route.ts — changement de statut + journal d'audit
import { NextRequest, NextResponse } from "next/server";
import { getOrgContext } from "@/lib/orgAuth";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const STATUSES = new Set(["stored", "claim_pending", "returned", "disposed"]);
const EVENT_BY_STATUS: Record<string, string> = {
  stored: "note",
  claim_pending: "claim_received",
  returned: "returned",
  disposed: "disposed",
};

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const ctx = await getOrgContext(req);
  if (!ctx?.org) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const sb = getSupabaseAdmin()!;

  const b = await req.json().catch(() => null);
  const status = b?.status !== undefined ? String(b.status) : null;
  const note = String(b?.note || "").trim().slice(0, 500) || null;
  const publicVisible = typeof b?.public_visible === "boolean" ? b.public_visible : null;
  if (status !== null && !STATUSES.has(status)) {
    return NextResponse.json({ error: "statut invalide" }, { status: 400 });
  }
  if (status === null && publicVisible === null) {
    return NextResponse.json({ error: "rien à modifier" }, { status: 400 });
  }

  // l'objet doit appartenir à l'organisation du membre
  const { data: item } = await sb
    .from("found_items")
    .select("id, org_id, title")
    .eq("id", params.id)
    .maybeSingle();
  if (!item || item.org_id !== ctx.org.id) {
    return NextResponse.json({ error: "introuvable" }, { status: 404 });
  }

  const patch: Record<string, any> = {};
  if (status !== null) {
    patch.status = status;
    if (status === "returned") patch.returned_at = new Date().toISOString();
  }
  if (publicVisible !== null) patch.public_visible = publicVisible;

  const { error } = await sb.from("found_items").update(patch).eq("id", params.id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  if (status !== null) {
    await sb.from("org_item_events").insert({
      org_id: ctx.org.id,
      item_id: String(params.id),
      type: EVENT_BY_STATUS[status],
      note,
      actor_email: ctx.email,
    });
  }

  return NextResponse.json({ ok: true });
}
