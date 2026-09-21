// app/api/org/intakes/[id]/route.ts — l'accueil tranche un dépôt par QR code.
//   confirm : l'objet est en main → il entre dans l'inventaire (référence,
//             échéance, rapprochement), exactement comme une saisie d'agent.
//   reject  : l'objet n'a jamais été remis → le dépôt et sa photo disparaissent.
//   publish / unpublish : pour un signalement GARDÉ PAR SON TROUVEUR, l'afficher
//             ou non sur la page publique (catégorie + date + lieu, rien d'autre).
//             Listé par défaut dès le signalement ; l'agent peut le masquer.
import { NextRequest, NextResponse } from "next/server";
import { getOrgContext } from "@/lib/orgAuth";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";
import { buildItemRow, reserveRefs, guessPublicLabel } from "@/lib/orgItems";
import { removePhoto } from "@/lib/orgPhotos";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const ctx = await getOrgContext(req);
  if (!ctx?.org) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const sb = getSupabaseAdmin()!;

  const b = await req.json().catch(() => null);
  const action = String(b?.action || "");
  if (!["confirm", "reject", "publish", "unpublish"].includes(action)) {
    return NextResponse.json({ error: "action invalide" }, { status: 400 });
  }

  const { data: intake } = await sb
    .from("org_intakes")
    .select("*")
    .eq("id", params.id)
    .maybeSingle();
  // le dépôt doit appartenir à l'organisation du membre
  if (!intake || intake.org_id !== ctx.org.id) {
    return NextResponse.json({ error: "introuvable" }, { status: 404 });
  }

  if (action === "publish" || action === "unpublish") {
    if (intake.status !== "pending") {
      return NextResponse.json({ error: "Only an open report can be listed." }, { status: 400 });
    }
    const label = String(b?.public_label || "").trim().slice(0, 60) || intake.public_label || guessPublicLabel(intake.title);
    const { error } = await sb
      .from("org_intakes")
      .update({ public_visible: action === "publish", public_label: label })
      .eq("id", intake.id);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ ok: true, public_visible: action === "publish", public_label: label });
  }

  // Verrou : on ne passe de « pending » à autre chose qu'une fois. Deux agents
  // qui cliquent en même temps ne créent pas deux fiches.
  const next = action === "confirm" ? "confirmed" : "rejected";
  const { data: locked } = await sb
    .from("org_intakes")
    .update({ status: next, resolved_at: new Date().toISOString() })
    .eq("id", intake.id)
    .eq("status", "pending")
    .select("id");
  if (!locked?.length) {
    return NextResponse.json({ error: "This drop-off was already handled." }, { status: 409 });
  }

  if (action === "reject") {
    await removePhoto(sb, intake.photo_url);
    // Le formulaire public le promet : un dépôt jamais remis est supprimé,
    // description, photo et contact compris. On efface donc la ligne entière.
    await sb.from("org_intakes").delete().eq("id", intake.id);
    return NextResponse.json({ ok: true });
  }

  try {
    const [ref] = await reserveRefs(sb, ctx.org.id, 1);
    const row = buildItemRow(ctx.org, ref, {
      title: String(b?.title || intake.title),
      found_at: String(intake.found_at),
      description: b?.description !== undefined ? b.description : intake.description,
      photo_url: intake.photo_url,
      found_location: intake.found_location,
      storage_location: b?.storage_location,
      public_visible: b?.public_visible !== false,
      public_label: b?.public_label,
      intake_id: intake.id,
    });
    const { data, error } = await sb.from("found_items").insert(row).select("id, org_ref").single();
    if (error) throw new Error(error.message);

    await sb.from("org_intakes").update({ item_id: String(data.id) }).eq("id", intake.id);

    const finder = [intake.finder_name, intake.finder_email ? `<${intake.finder_email}>` : ""].filter(Boolean).join(" ");
    await sb.from("org_item_events").insert({
      org_id: ctx.org.id,
      item_id: String(data.id),
      type: "created",
      actor_email: ctx.email,
      note: `${row.title} · found ${row.date} · handed in via QR code (drop-off ${intake.code})${finder ? ` · finder: ${finder}` : ""}`,
    });

    try {
      const { runMatchForFoundItem } = await import("@/lib/orgMatchRun");
      await runMatchForFoundItem(String(data.id));
    } catch (e) {
      console.warn("runMatchForFoundItem (ignoré):", (e as Error)?.message || e);
    }

    return NextResponse.json({ ok: true, id: data.id, org_ref: data.org_ref });
  } catch (e) {
    // La fiche n'a pas pu être créée : le dépôt redevient confirmable.
    await sb.from("org_intakes").update({ status: "pending", resolved_at: null }).eq("id", intake.id);
    return NextResponse.json({ error: (e as Error).message }, { status: 500 });
  }
}
