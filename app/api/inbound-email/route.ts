// app/api/inbound-email/route.ts
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import crypto from "crypto";
import nodemailer from "nodemailer";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/* ============================
   ENV attendus
   - NEXT_PUBLIC_SUPABASE_URL
   - SUPABASE_SERVICE_ROLE_KEY
   - ZOHO_USER  (ex: support@reportlost.org)
   - ZOHO_PASS  (mot de passe ou App Password)
   - MAILGUN_SIGNING_KEY (key-xxxxxxxx du domaine Mailgun)
   - SUPPORT_EMAIL (optionnel, défaut: support@reportlost.org)
   ============================ */

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const SUPPORT_EMAIL = process.env.SUPPORT_EMAIL || "support@reportlost.org";

/* ---------------- helpers --------------- */
function json(data: any, status = 200) {
  return NextResponse.json(data, {
    status,
    headers: { "Cache-Control": "no-store" },
  });
}

function escapeHtml(s: string) {
  return String(s || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function verifyMailgunSignature(ts: string, token: string, signature: string) {
  const key = process.env.MAILGUN_SIGNING_KEY;
  if (!key) return true; // on ne bloque pas si la clé n'est pas fournie (en dev)
  const hmac = crypto.createHmac("sha256", key).update(ts + token).digest("hex");
  try {
    return crypto.timingSafeEqual(Buffer.from(hmac), Buffer.from(signature));
  } catch {
    return false;
  }
}

// N’accepte que XXXXX@scan.reportlost.org (XXXXX = 5 chiffres)
function extractPublicId(recipientLower: string): string | null {
  const m = recipientLower.match(/^([0-9]{5})@scan\.reportlost\.org$/i);
  return m ? m[1] : null;
}

function buildTransport() {
  // Zoho Europe
  return nodemailer.createTransport({
    host: "smtp.zoho.eu",
    port: 465,
    secure: true,
    auth: {
      user: process.env.ZOHO_USER!,
      pass: process.env.ZOHO_PASS!,
    },
    connectionTimeout: 15000,
    greetingTimeout: 10000,
    socketTimeout: 20000,
  });
}

/* ------------- gabarits mails ------------- */

function renderOwnerHtml(params: {
  publicId: string;
  ownerFirstName?: string | null;
  senderHeader: string;
  bodyText?: string;
  bodyHtml?: string;
}) {
  const { publicId, ownerFirstName, senderHeader, bodyText, bodyHtml } = params;

  const originalHtmlBlock = bodyHtml
    ? `<div style="border:1px solid #e6e6e6;border-radius:8px;padding:16px;background:#fff;">
         ${bodyHtml}
       </div>`
    : `<pre style="white-space:pre-wrap;border:1px solid #e6e6e6;border-radius:8px;padding:16px;background:#fff;margin:0;">
${escapeHtml(bodyText || "(no text)")}
       </pre>`;

  return `
  <div style="background:#f6f7fb;padding:24px 0;font-family:Inter,system-ui,-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;color:#111;">
    <table role="presentation" cellpadding="0" cellspacing="0" border="0" align="center" style="width:100%;max-width:640px;background:#ffffff;border-radius:12px;box-shadow:0 1px 6px rgba(0,0,0,.06);">
      <tr>
        <td style="padding:24px 28px 8px 28px;">
          <div style="font-size:18px;font-weight:600;">Reportlost Relay</div>
          <div style="font-size:12px;color:#6b7280;margin-top:4px;">QR case #${escapeHtml(publicId)}</div>
        </td>
      </tr>
      <tr>
        <td style="padding:0 28px 8px 28px;">
          <h1 style="margin:12px 0 4px 0;font-size:20px;line-height:1.35;">Hello${ownerFirstName ? " " + escapeHtml(ownerFirstName) : ""},</h1>
          <p style="margin:0 0 12px 0;font-size:14px;line-height:1.6;">
            We received a message regarding one of your items that carries our QR code (ID <strong>${escapeHtml(
              publicId
            )}</strong>).
          </p>
          <p style="margin:0 0 6px 0;font-size:13px;color:#374151;"><strong>Sender:</strong> ${escapeHtml(
            senderHeader
          )}</p>
        </td>
      </tr>
      <tr>
        <td style="padding:0 28px 16px 28px;">
          ${originalHtmlBlock}
        </td>
      </tr>
      <tr>
        <td style="padding:0 28px 22px 28px;">
          <p style="margin:12px 0 0 0;font-size:13px;color:#374151;line-height:1.6;">
            You can <strong>reply directly to this email</strong> to contact the finder. Your personal address remains private.
          </p>
        </td>
      </tr>
      <tr>
        <td style="padding:16px 28px 26px 28px;border-top:1px solid #f0f2f5;">
          <div style="font-size:12px;color:#9ca3af;">
            — Reportlost • This email was sent by our relay for case #${escapeHtml(publicId)}
          </div>
        </td>
      </tr>
    </table>
  </div>`;
}

function renderOwnerText(params: {
  publicId: string;
  ownerFirstName?: string | null;
  senderHeader: string;
  bodyText?: string;
}) {
  const { publicId, ownerFirstName, senderHeader, bodyText } = params;
  return `Hello${ownerFirstName ? " " + ownerFirstName : ""},

We received a message regarding one of your items that carries our QR code (ID ${publicId}).

Sender: ${senderHeader}

Message:
${bodyText || "(no text)"}

You can reply directly to this email to contact the finder. Your personal address remains private.

— Reportlost (case #${publicId})`;
}

/* --------------- Routes --------------- */
export async function GET() {
  // Health-check simple pour Mailgun
  return json({ ok: true });
}

export async function POST(req: NextRequest) {
  try {
    // 1) Récup payload Mailgun (multipart/form-data)
    const form = await req.formData();

    const recipient = String(form.get("recipient") || "").trim();  // ex: 89572@scan.reportlost.org
    const fromHeader = String(form.get("from") || "");             // "Name <email@tld>"
    const subject = String(form.get("subject") || "");
    const text = String(form.get("stripped-text") || form.get("body-plain") || "");
    const html = String(form.get("stripped-html") || form.get("body-html") || "");

    const timestamp = String(form.get("timestamp") || "");
    const token = String(form.get("token") || "");
    const signature = String(form.get("signature") || "");

    if (!verifyMailgunSignature(timestamp, token, signature)) {
      return json({ ok: false, error: "Bad signature" }, 403);
    }

    // 2) Public ID
    const publicId = extractPublicId(recipient.toLowerCase());
    if (!publicId) {
      // alias non géré → on notifie juste le support
      const tr = buildTransport();
      await tr.sendMail({
        from: `Reportlost Router <${SUPPORT_EMAIL}>`,
        to: SUPPORT_EMAIL,
        subject: `[Router] Unhandled recipient: ${recipient}`,
        text: `Recipient: ${recipient}\n\nFrom: ${fromHeader}\nSubject: ${subject}\n\n${text || "(no text)"}`,
        html: `<p><strong>Recipient:</strong> ${escapeHtml(
          recipient
        )}</p><p><strong>From:</strong> ${escapeHtml(
          fromHeader
        )}</p><p><strong>Subject:</strong> ${escapeHtml(
          subject
        )}</p>${html ? html : `<pre>${escapeHtml(text || "(no text)")}</pre>`}`,
      });
      return json({ ok: true, routed: "support-only (unhandled alias)" });
    }

    // 3) Lookup propriétaire
    const { data: item, error } = await supabase
      .from("lost_items")
      .select("email, first_name")
      .eq("public_id", publicId)
      .maybeSingle();

    if (error || !item?.email) {
      const tr = buildTransport();
      await tr.sendMail({
        from: `Reportlost Router <${SUPPORT_EMAIL}>`,
        to: SUPPORT_EMAIL,
        subject: `[Router] No owner for ID ${publicId}`,
        text: `Recipient: ${recipient}\nFrom: ${fromHeader}\nSubject: ${subject}\n\n${text || "(no text)"}`,
        html: `<p><strong>Recipient:</strong> ${escapeHtml(
          recipient
        )}</p><p><strong>From:</strong> ${escapeHtml(
          fromHeader
        )}</p><p><strong>Subject:</strong> ${escapeHtml(
          subject
        )}</p>${html ? html : `<pre>${escapeHtml(text || "(no text)")}</pre>`}`,
      });
      return json({ ok: true, routed: "support-only (no owner)" });
    }

    // 4) Envoi au propriétaire (joli gabarit)
    const tr = buildTransport();

    const ownerHtml = renderOwnerHtml({
      publicId,
      ownerFirstName: item.first_name,
      senderHeader: fromHeader || "unknown sender",
      bodyText: text,
      bodyHtml: html || undefined,
    });

    const ownerText = renderOwnerText({
      publicId,
      ownerFirstName: item.first_name,
      senderHeader: fromHeader || "unknown sender",
      bodyText: text,
    });

    await tr.sendMail({
      from: `Reportlost Relay <${process.env.ZOHO_USER!}>`,
      to: item.email!,
      replyTo: recipient, // ← le client répond à l’alias tracké
      subject:
        subject ||
        `New message about your QR-tagged item (ID ${publicId})`,
      text: ownerText,
      html: ownerHtml,
      // BCC support si tu veux un œil côté admin
      // bcc: SUPPORT_EMAIL,
    });

    return json({ ok: true, routed: "owner", publicId, owner: item.email });
  } catch (e: any) {
    console.error("[inbound-email] fatal:", e);
    return json({ ok: false, error: String(e?.message || e) }, 500);
  }
}
