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
  const status = String(b?.status || "");
  const note = String(b?.note || "").trim().slice(0, 500) || null;
  if (!STATUSES.has(status)) return NextResponse.json({ error: "statut invalide" }, { status: 400 });

  // l'objet doit appartenir à l'organisation du membre
  const { data: item } = await sb
    .from("found_items")
    .select("id, org_id, title")
    .eq("id", params.id)
    .maybeSingle();
  if (!item || item.org_id !== ctx.org.id) {
    return NextResponse.json({ error: "introuvable" }, { status: 404 });
  }

  const patch: Record<string, any> = { status };
  if (status === "returned") patch.returned_at = new Date().toISOString();

  const { error } = await sb.from("found_items").update(patch).eq("id", params.id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  await sb.from("org_item_events").insert({
    org_id: ctx.org.id,
    item_id: String(params.id),
    type: EVENT_BY_STATUS[status],
    note,
    actor_email: ctx.email,
  });

  return NextResponse.json({ ok: true });
}
