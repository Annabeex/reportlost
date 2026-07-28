// app/api/o/claim/route.ts — réclamation PUBLIQUE d'un objet listé par un
// établissement. Ne révèle rien : enregistre la demande (avec la description
// fournie comme preuve), passe l'objet en claim_pending et notifie
// l'établissement. C'est lui qui juge la preuve et recontacte.
import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";
import { sendMailDirect } from "@/lib/mailer";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const b = await req.json().catch(() => null);
    // Honeypot anti-bot : champ caché qui doit rester vide
    if (b?.website) return NextResponse.json({ ok: true });

    const slug = String(b?.org_slug || "").trim().toLowerCase();
    const itemId = String(b?.item_id || "").trim();
    const name = String(b?.name || "").trim().slice(0, 80);
    const email = String(b?.email || "").trim().slice(0, 160);
    const phone = String(b?.phone || "").trim().slice(0, 40);
    const proof = String(b?.proof || "").trim().slice(0, 1500);

    if (!slug || !itemId || !name || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || proof.length < 15) {
      return NextResponse.json(
        { error: "Please fill in your name, a valid email, and a detailed description of the item." },
        { status: 400 }
      );
    }

    const sb = getSupabaseAdmin();
    if (!sb) return NextResponse.json({ error: "unavailable" }, { status: 500 });

    const { data: org } = await sb
      .from("organizations")
      .select("id, name, slug, public_email, verified, public_listing")
      .eq("slug", slug)
      .maybeSingle();
    if (!org || !org.verified || !org.public_listing) {
      return NextResponse.json({ error: "not found" }, { status: 404 });
    }

    const { data: item } = await sb
      .from("found_items")
      .select("id, org_id, org_ref, public_label, title, status, public_visible")
      .eq("id", itemId)
      .maybeSingle();
    if (!item || item.org_id !== org.id || !item.public_visible || item.status !== "stored") {
      return NextResponse.json({ error: "This item is no longer available for claims." }, { status: 400 });
    }

    // Passe en réclamation + trace complète dans le journal
    await sb.from("found_items").update({ status: "claim_pending" }).eq("id", item.id);
    await sb.from("org_item_events").insert({
      org_id: org.id,
      item_id: String(item.id),
      type: "claim_received",
      note: `Claimant: ${name} <${email}>${phone ? " · " + phone : ""}\nProof provided:\n${proof}`,
      actor_email: email,
    });

    // Notifie l'établissement (ou support@ en relais si pas d'email public)
    const to = org.public_email || "support@reportlost.org";
    await sendMailDirect({
      to,
      subject: `Claim received: ${item.public_label || item.title} (${item.org_ref || item.id})`,
      text: `Hello,

Someone claimed an item listed on your ReportLost page (${org.name}).

Item: ${item.public_label || item.title} · ref ${item.org_ref || item.id}
Claimant: ${name} · ${email}${phone ? ` · ${phone}` : ""}

Their description (compare it with your internal notes and photo before any handover):
${proof}

Open your dashboard to review: https://reportlost.org/org/dashboard

ReportLost.org`,
      fromName: "ReportLost",
      replyTo: email,
    });

    return NextResponse.json({ ok: true });
  } catch (e: any) {
    return NextResponse.json({ error: String(e?.message || e) }, { status: 500 });
  }
}
