// app/api/send-mail/route.ts

import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";
import nodemailer from "nodemailer";

export const runtime = "nodejs";

// === CONFIGURATION DU TRANSPORTEUR (tu gardes la tienne si différente) ===
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT || 587),
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

// ==========================================================
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { to, subject, text, html, publicId, kind } = body || {};

    if (!to || !subject || !text) {
      return NextResponse.json(
        { ok: false, error: "Missing required fields" },
        { status: 400 }
      );
    }

    // === ENVOI DE L’EMAIL ===
    const info = await transporter.sendMail({
      from: process.env.MAIL_FROM || "ReportLost <noreply@reportlost.org>",
      to,
      subject,
      text,
      html: html || undefined,
    });

    console.log("📧 Email sent:", info.messageId, "→", to);

    // === ✅ NE MARQUER LE SUIVI QUE POUR LES EMAILS MANUELS ===
    try {
      if (kind === "followup" && publicId) {
        const supabase = getSupabaseAdmin();
        if (!supabase) {
          console.warn("send-mail: missing Supabase credentials");
        } else {
          const pidRaw = String(publicId);
          const pid = /^\d+$/.test(pidRaw) ? Number(pidRaw) : pidRaw;

          const { error } = await supabase
            .from("lost_items")
            .update({
              followup_email_sent_bool: true,
              followup_email_sent_at: new Date().toISOString(),
              followup_email_to: to ?? null,
            })
            .eq("public_id", pid);

          if (error) {
            console.warn("send-mail: supabase update failed", error);
          } else {
            console.log("✅ followup_email_sent flag updated for", pid);
          }
        }
      } else {
        console.log(
          "ℹ️ Email sent but not flagged as follow-up (kind:",
          kind || "none",
          ")"
        );
      }
    } catch (err) {
      console.warn("send-mail: followup flagging threw", err);
    }

    return NextResponse.json({ ok: true, messageId: info.messageId });
  } catch (err: any) {
    console.error("send-mail error:", err);
    return NextResponse.json(
      { ok: false, error: String(err?.message || err) },
      { status: 500 }
    );
  }
}
