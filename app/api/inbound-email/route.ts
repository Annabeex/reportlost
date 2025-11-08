// app/api/inbound-email/route.ts
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import crypto from "crypto";
import nodemailer from "nodemailer";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// --- ENV requis ---
// NEXT_PUBLIC_SUPABASE_URL
// SUPABASE_SERVICE_ROLE_KEY
// ZOHO_USER  (ex: support@reportlost.org)
// ZOHO_PASS  (app password)
// MAILGUN_SIGNING_KEY (key-...)
// (optionnel) SUPPORT_EMAIL = support@reportlost.org

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const SUPPORT_EMAIL = process.env.SUPPORT_EMAIL || "support@reportlost.org";
const ZOHO_USER = process.env.ZOHO_USER!;
const ZOHO_PASS = process.env.ZOHO_PASS!;

function json(data: any, status = 200) {
  return NextResponse.json(data, {
    status,
    headers: { "Cache-Control": "no-store" },
  });
}

// --- Mailgun signature ---
function verifyMailgunSignature(ts: string, token: string, signature: string) {
  const key = process.env.MAILGUN_SIGNING_KEY;
  if (!key) return true; // ne bloque pas si non configuré
  const hmac = crypto.createHmac("sha256", key).update(ts + token).digest("hex");
  try {
    return crypto.timingSafeEqual(Buffer.from(hmac), Buffer.from(signature));
  } catch {
    return false;
  }
}

// --- SMTP (Zoho Europe) ---
function buildTransport() {
  return nodemailer.createTransport({
    host: "smtp.zoho.eu",
    port: 465,
    secure: true,
    auth: { user: ZOHO_USER, pass: ZOHO_PASS },
    connectionTimeout: 15000,
    greetingTimeout: 10000,
    socketTimeout: 20000,
  });
}

// Alias accepté : 5 chiffres @scan.reportlost.org
function extractPublicId(recipientLower: string): string | null {
  const m = recipientLower.match(/^([0-9]{5})@scan\.reportlost\.org$/i);
  return m ? m[1] : null;
}

function escapeHtml(s: string) {
  return String(s || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

// Health check
export async function GET() {
  return json({ ok: true });
}

export async function POST(req: NextRequest) {
  try {
    const form = await req.formData();

    const recipient = String(form.get("recipient") || "").trim(); // ex: 89572@scan.reportlost.org
    const from = String(form.get("from") || "");                   // “Name <email@ex.tld>”
    const subject = String(form.get("subject") || "");
    const text = String(form.get("stripped-text") || form.get("body-plain") || "");
    const html = String(form.get("stripped-html") || form.get("body-html") || "");

    // Sécurité Mailgun
    const ts = String(form.get("timestamp") || "");
    const token = String(form.get("token") || "");
    const signature = String(form.get("signature") || "");
    if (!verifyMailgunSignature(ts, token, signature)) {
      return json({ ok: false, error: "Bad signature" }, 403);
    }

    const recipientLower = recipient.toLowerCase();
    const publicId = extractPublicId(recipientLower);

    // 🔒 Anti-boucle / ignorer nos propres mails / réponses
    // - si l’expéditeur est notre domaine, on ignore
    // - si c’est une réponse (présence In-Reply-To / References), on ignore (pas de système de conversation pour l’instant)
    const headersJson = String(form.get("message-headers") || "[]");
    let headers: Array<[string, string]> = [];
    try { headers = JSON.parse(headersJson) as Array<[string, string]>; } catch {}
    const headerMap = new Map(headers.map(([k, v]) => [k.toLowerCase(), v]));
    const isReply = headerMap.has("in-reply-to") || headerMap.has("references");

    if (from.toLowerCase().includes("@reportlost.org") || isReply) {
      // on ne traite pas ces messages → copie support pour info, et 200
      try {
        const tr = buildTransport();
        await tr.sendMail({
          from: `Reportlost Router <${ZOHO_USER}>`,
          to: SUPPORT_EMAIL,
          subject: `[Router] Ignored loop/reply ${publicId ? `(ID ${publicId})` : ""}`,
          text: `Ignored message.\nRecipient: ${recipient}\nFrom: ${from}\nSubject: ${subject}\n\n${text || "(no text)"}`,
          html: `<p>Ignored message.</p><p><b>Recipient:</b> ${escapeHtml(recipient)}<br/><b>From:</b> ${escapeHtml(from)}<br/><b>Subject:</b> ${escapeHtml(subject)}</p><pre>${escapeHtml(text || "(no text)")}</pre>`,
        });
      } catch {}
      return json({ ok: true, routed: "ignored-reply-or-loop" });
    }

    // Si pas un alias chiffré → on avertit support puis 200
    if (!publicId) {
      const tr = buildTransport();
      await tr.sendMail({
        from: `Reportlost Router <${ZOHO_USER}>`,
        to: SUPPORT_EMAIL,
        subject: `[Router] Unhandled recipient: ${recipient}`,
        text: `Recipient: ${recipient}\nFrom: ${from}\nSubject: ${subject}\n\n${text || "(no text)"}`,
        html: `<p><b>Recipient:</b> ${escapeHtml(recipient)}</p><p><b>From:</b> ${escapeHtml(from)}</p><p><b>Subject:</b> ${escapeHtml(subject)}</p><pre>${escapeHtml(text || "(no text)")}</pre>`,
      });
      return json({ ok: true, routed: "support-only (unhandled alias)" });
    }

    // Trouver l’email du propriétaire
    const { data: item, error } = await supabase
      .from("lost_items")
      .select("email, first_name, title, description")
      .eq("public_id", publicId)
      .maybeSingle();

    if (error || !item?.email) {
      const tr = buildTransport();
      await tr.sendMail({
        from: `Reportlost Router <${ZOHO_USER}>`,
        to: SUPPORT_EMAIL,
        subject: `[Router] No owner for ID ${publicId}`,
        text: `Recipient: ${recipient}\nFrom: ${from}\nSubject: ${subject}\n\n${text || "(no text)"}`,
        html: `<p><b>Recipient:</b> ${escapeHtml(recipient)}</p><p><b>From:</b> ${escapeHtml(from)}</p><p><b>Subject:</b> ${escapeHtml(subject)}</p><pre>${escapeHtml(text || "(no text)")}</pre>`,
      });
      return json({ ok: true, routed: "support-only (no owner)" });
    }

    // ✅ Envoi AU PROPRIÉTAIRE (aller simple). Pas de Reply-To vers l’alias pour le moment.
    const tr = buildTransport();

    const introText =
`Hello${item.first_name ? " " + item.first_name : ""},
We received a message regarding one of your items that carries our QR code (ID ${publicId}).

Sender: ${from || "unknown sender"}

${text || "(no text)"}

— Reportlost`;

    const introHtml =
      `<p>Hello${item.first_name ? " " + escapeHtml(item.first_name) : ""},</p>` +
      `<p>We received a message regarding one of your items that carries our QR code (ID <b>${escapeHtml(publicId)}</b>).</p>` +
      `<p><em>Sender:</em> ${escapeHtml(from || "unknown sender")}</p>` +
      (html
        ? html
        : `<pre style="white-space:pre-wrap">${escapeHtml(text || "(no text)")}</pre>`) +
      `<p>— Reportlost</p>`;

    await tr.sendMail({
      from: `Reportlost Relay <${ZOHO_USER}>`,
      to: item.email!,
      // ⚠️ on retire le reply-to vers l’alias tant qu’il n’y a pas de “conversation”
      subject: subject || `New message about your QR-tagged item (ID ${publicId})`,
      text: introText,
      html: introHtml,
      headers: { "X-Reportlost-Relay": "1" }, // pour nos guardrails anti-boucle
    });

    // copie admin (facultatif) : mail original
    await tr.sendMail({
      from: `Reportlost Router <${ZOHO_USER}>`,
      to: SUPPORT_EMAIL,
      subject: `[Router] Delivered to owner (ID ${publicId})`,
      text: `To: ${item.email}\nRecipient alias: ${recipient}\nFrom: ${from}\nSubject: ${subject}\n\n${text || "(no text)"}`,
    });

    return json({ ok: true, routed: "owner", publicId, owner: item.email });
  } catch (e: any) {
    return json({ ok: false, error: String(e?.message || e) }, 500);
  }
}
