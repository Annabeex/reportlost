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

    // Mise en page soignée : gabarit ReportLost (bandeau vert) + paragraphes,
    // et conversion des lignes "- ..." en vraies listes à puces.
    const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
    const blocksHtml = text
      .split(/\n{2,}/)
      .map((block) => {
        const lines = block.split("\n").filter((l) => l.trim());
        const isList = lines.length > 0 && lines.every((l) => /^\s*[-•]\s+/.test(l));
        if (isList) {
          const items = lines
            .map((l) => `<li style="margin:0 0 6px 0;">${esc(l.replace(/^\s*[-•]\s+/, ""))}</li>`)
            .join("");
          return `<ul style="margin:0 0 14px 0;padding-left:20px;font-size:14px;line-height:1.6;">${items}</ul>`;
        }
        return `<p style="margin:0 0 14px 0;font-size:14px;line-height:1.6;">${esc(block).replace(/\n/g, "<br/>")}</p>`;
      })
      .join("");

    const html = `
<div style="font-family:Arial,Helvetica,sans-serif;max-width:620px;margin:auto;border:1px solid #e5e7eb;border-radius:10px;overflow:hidden">
  <div style="background:linear-gradient(90deg,#2C7A4A,#3FAE68);color:#fff;padding:18px 16px;text-align:center;">
    <h2 style="margin:0;font-size:22px;letter-spacing:.3px">ReportLost</h2>
    ${item.public_id ? `<p style="margin:8px 0 0;font-size:13px;opacity:.95">Case #${item.public_id}</p>` : ""}
  </div>
  <div style="padding:22px;color:#111827;background:#fff">${blocksHtml}</div>
  <div style="padding:12px 16px;background:#f9fafb;border-top:1px solid #f0f2f5;font-size:11px;color:#9ca3af;text-align:center;">
    ReportLost.org — independent lost &amp; found assistance in the USA
  </div>
</div>`;

    const tr = buildTransport();
    await tr.sendMail({
      from: `ReportLost <${supportEmail}>`,
      to: String(to),
      replyTo,
      subject: String(subject),
      text,
      html,
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
