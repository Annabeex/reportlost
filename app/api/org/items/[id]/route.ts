// app/api/org/items/[id]/route.ts — changement de statut + journal d'audit
import { NextRequest, NextResponse } from "next/server";
import { getOrgContext } from "@/lib/orgAuth";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";
import { isDisposition, dispositionLabel, LEAVING_STATUSES } from "@/lib/orgDisposition";

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
  const disposition = b?.disposition !== undefined ? String(b.disposition) : null;
  const disposedTo = String(b?.disposed_to || "").trim().slice(0, 200) || null;
  if (status !== null && !STATUSES.has(status)) {
    return NextResponse.json({ error: "statut invalide" }, { status: 400 });
  }
  if (disposition !== null && !isDisposition(disposition)) {
    return NextResponse.json({ error: "destination invalide" }, { status: 400 });
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

    if (LEAVING_STATUSES.has(status)) {
      // Départ réel de l'objet : c'est CE moment, et lui seul, qui lance les
      // horloges de suppression. Jamais l'échéance légale.
      patch.disposed_at = new Date().toISOString();
      patch.disposition =
        disposition || (status === "returned" ? "returned_owner" : null);
      if (disposedTo) patch.disposed_to = disposedTo;
    } else {
      // Retour en stock : l'agent corrige une erreur de ligne. On efface la
      // sortie, sinon la photo serait supprimée dans 30 jours pour un objet
      // qui est toujours sur l'étagère.
      patch.disposed_at = null;
      patch.disposition = null;
      patch.disposed_to = null;
    }
  }
  if (publicVisible !== null) patch.public_visible = publicVisible;

  const { error } = await sb.from("found_items").update(patch).eq("id", params.id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  if (status !== null) {
    // Le journal garde la destination en clair : c'est lui qu'on relit quand
    // quelqu'un se manifeste des mois plus tard.
    const trail = [
      patch.disposition ? dispositionLabel(patch.disposition) : "",
      disposedTo || "",
      note || "",
    ].filter(Boolean).join(" · ");

    await sb.from("org_item_events").insert({
      org_id: ctx.org.id,
      item_id: String(params.id),
      type: EVENT_BY_STATUS[status],
      note: trail || null,
      actor_email: ctx.email,
    });
  }

  return NextResponse.json({ ok: true });
}
