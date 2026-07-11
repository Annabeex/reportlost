// app/api/admin/case-send/route.ts
// Envoi d'un mail depuis un dossier, avec Reply-To tracké (12345@scan.reportlost.org)
// pour que les réponses reviennent automatiquement dans le dossier via le webhook Mailgun.
// Protégé par le middleware Basic Auth (/api/admin/*).
import { NextRequest, NextResponse } from "next/server";
import nodemailer from "nodemailer";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function buildTransport() {
  return nodemailer.createTransport({
    host: "smtp.zoho.eu",
    port: 465,
    secure: true,
    auth: { user: process.env.ZOHO_USER!, pass: process.env.ZOHO_PASS! },
    connectionTimeout: 15000,
    greetingTimeout: 10000,
    socketTimeout: 20000,
  });
}

export async function POST(req: NextRequest) {
  try {
    const { lostItemId, to, subject, body } = await req.json();
    if (!lostItemId || !to || !subject || !body) {
      return NextResponse.json(
        { error: "lostItemId, to, subject et body sont requis" },
        { status: 400 }
      );
    }

    const sb = getSupabaseAdmin();
    if (!sb) return NextResponse.json({ error: "Supabase non configuré" }, { status: 500 });

    const { data: item, error } = await sb
      .from("lost_items")
      .select("id, public_id")
      .eq("id", lostItemId)
      .maybeSingle();
    if (error || !item) {
      return NextResponse.json({ error: "Dossier introuvable" }, { status: 404 });
    }

    const supportEmail = process.env.ZOHO_USER || "support@reportlost.org";
    const replyTo = item.public_id
      ? `${item.public_id}@scan.reportlost.org`
      : supportEmail;

    const text = String(body);
    const html = text
      .split(/\n{2,}/)
      .map(
        (p) =>
          `<p style="margin:0 0 12px 0;font-size:14px;line-height:1.6;">${p
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/\n/g, "<br/>")}</p>`
      )
      .join("");

    const tr = buildTransport();
    await tr.sendMail({
      from: `ReportLost <${supportEmail}>`,
      to: String(to),
      replyTo,
      subject: String(subject),
      text,
      html: `<div style="font-family:Inter,system-ui,-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;color:#111;max-width:640px;">${html}</div>`,
    });

    await sb.from("case_messages").insert({
      lost_item_id: item.id,
      public_id: item.public_id,
      direction: "out",
      from_email: supportEmail,
      to_email: String(to).toLowerCase(),
      subject: String(subject),
      body_text: text,
      meta: { reply_to: replyTo },
    });

    return NextResponse.json({ ok: true, replyTo });
  } catch (e: any) {
    console.error("[case-send] fatal:", e);
    return NextResponse.json({ error: String(e?.message || e) }, { status: 500 });
  }
}
