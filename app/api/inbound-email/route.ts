import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import crypto from "crypto";
import nodemailer from "nodemailer";

export const runtime = "nodejs"; // nécessaire pour nodemailer
export const dynamic = "force-dynamic";

// --- ENV requis ---
// NEXT_PUBLIC_SUPABASE_URL
// SUPABASE_SERVICE_ROLE_KEY
// ZOHO_USER  (ex: support@reportlost.org)
// ZOHO_PASS  (mot de passe/app password)
// MAILGUN_SIGNING_KEY (Key commençant par key-..., onglet Domain settings)
// (optionnel) SUPPORT_EMAIL = support@reportlost.org

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const SUPPORT_EMAIL = process.env.SUPPORT_EMAIL || "support@reportlost.org";

// --- utils ---

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

// Mailgun envoie parfois un GET “health check”
export async function GET() {
  return json({ ok: true });
}

// Vérif signature Mailgun (recommandé, sinon retourne true pour ne pas bloquer)
function verifyMailgunSignature(ts: string, token: string, signature: string) {
  const key = process.env.MAILGUN_SIGNING_KEY;
  if (!key) return true; // si pas configuré, ne bloque pas
  const hmac = crypto.createHmac("sha256", key).update(ts + token).digest("hex");
  try {
    return crypto.timingSafeEqual(Buffer.from(hmac), Buffer.from(signature));
  } catch {
    return false;
  }
}

// N'autoriser que les alias du sous-domaine scan : *****@scan.reportlost.org avec ***** = 5 chiffres
function extractPublicId(recipientLower: string): string | null {
  const mScan = recipientLower.match(/^([0-9]{5})@scan\.reportlost\.org$/i);
  if (mScan) return mScan[1]; // ex: "30860"
  return null; // tout le reste (y compris public_id@reportlost.org) n'est pas routé vers le client
}

function buildTransport() {
  return nodemailer.createTransport({
    host: "smtp.zoho.com",
    port: 587,         // STARTTLS
    secure: false,     // false pour 587 (STARTTLS)
    requireTLS: true,  // force l’upgrade TLS
    auth: {
      user: process.env.ZOHO_USER!,
      pass: process.env.ZOHO_PASS!, // idéalement un app password
    },
    connectionTimeout: 15000,
    greetingTimeout: 10000,
    socketTimeout: 20000,
  });
}

export async function POST(req: NextRequest) {
  try {
    // Mailgun → “store(notify=…)” envoie en multipart/form-data
    const form = await req.formData();

    // Champs Mailgun fréquents
    const recipient = String(form.get("recipient") || "").trim(); // ex: 30860@scan.reportlost.org
    const from = String(form.get("from") || "");                  // “Name <email@ex.tld>”
    const subject = String(form.get("subject") || "");
    const text = String(form.get("stripped-text") || form.get("body-plain") || "");
    const html = String(form.get("stripped-html") || form.get("body-html") || "");

    // Signature
    const ts = String(form.get("timestamp") || "");
    const token = String(form.get("token") || "");
    const signature = String(form.get("signature") || "");
    if (!verifyMailgunSignature(ts, token, signature)) {
      return json({ ok: false, error: "Bad signature" }, 403);
    }

    const recipientLower = recipient.toLowerCase();
    const publicId = extractPublicId(recipientLower); // ne renvoie quelque chose QUE pour 5 chiffres @scan

    if (!publicId) {
      // Alias non géré → on envoie un rapport au support pour ne rien perdre
      const tr = buildTransport();
      await tr.sendMail({
        from: `Reportlost Router <${SUPPORT_EMAIL}>`,
        to: SUPPORT_EMAIL,
        subject: `[Router] Unhandled recipient: ${recipient}`,
        text:
          `Recipient: ${recipient}\n\n` +
          `Subject: ${subject}\nFrom: ${from}\n\n` +
          (text || "(no text)"),
        html:
          html ||
          `<pre>${escapeHtml(
            `Recipient: ${recipient}\n\nSubject: ${subject}\nFrom: ${from}\n\n${text || "(no text)"}`
          )}</pre>`,
      });
      return json({ ok: true, routed: "support-only (unhandled alias)" });
    }

    // Lookup Supabase → email du propriétaire (colonne public_id = TEXT)
    const { data: item, error } = await supabase
      .from("lost_items")
      .select("email, first_name, title, description")
      .eq("public_id", publicId)
      .maybeSingle();

    if (error || !item?.email) {
      // Pas trouvé → copie au support
      const tr = buildTransport();
      await tr.sendMail({
        from: `Reportlost Router <${SUPPORT_EMAIL}>`,
        to: SUPPORT_EMAIL,
        subject: `[Router] No owner for ID ${publicId}`,
        text:
          `Recipient: ${recipient}\n\nSubject: ${subject}\nFrom: ${from}\n\n` +
          (text || "(no text)"),
        html:
          html ||
          `<pre>${escapeHtml(
            `Recipient: ${recipient}\n\nSubject: ${subject}\nFrom: ${from}\n\n${text || "(no text)"}`
          )}</pre>`,
      });
      return json({ ok: true, routed: "support-only (no owner)" });
    }

    // Email au client — Reply-To = alias scanné (pour préserver l’anonymat et garder le fil via la route)
    const tr = buildTransport();

    const introText =
      `Hello${item.first_name ? " " + item.first_name : ""},\n\n` +
      `We received a message regarding one of your items that carries our QR code (ID ${publicId}).\n` +
      `Here is the sender’s note (from ${from || "unknown sender"}):\n\n` +
      `${text || "(no text)"}\n\n` +
      `You can reply directly to this email to contact the finder while keeping your address private.\n\n` +
      `— Reportlost`;

    const introHtml =
      `<p>Hello${item.first_name ? " " + escapeHtml(item.first_name) : ""},</p>` +
      `<p>We received a message regarding one of your items that carries our QR code (ID <strong>${escapeHtml(
        publicId
      )}</strong>).</p>` +
      `<p><em>Sender:</em> ${escapeHtml(from || "unknown sender")}</p>` +
      (html
        ? html
        : `<pre style="white-space:pre-wrap">${escapeHtml(text || "(no text)")}</pre>`) +
      `<p>You can reply directly to this email to contact the finder while keeping your address private.</p>` +
      `<p>— Reportlost</p>`;

    await tr.sendMail({
      from: `Reportlost Relay <${process.env.ZOHO_USER!}>`,
      to: item.email!,
      replyTo: recipient, // ← IMPORTANT : le client répond à l’alias, donc retour via Mailgun
      subject: subject || `New message about your QR-tagged item (ID ${publicId})`,
      text: introText,
      html: introHtml,
    });

    return json({ ok: true, routed: "owner", publicId, owner: item.email });
  } catch (e: any) {
    return json({ ok: false, error: String(e?.message || e) }, 500);
  }
}
