// app/api/inbound-email/route.ts
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import crypto from "crypto";
import nodemailer from "nodemailer";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// ───────────────────────────────────────────────────────────────────────────────
// ENV requis
// NEXT_PUBLIC_SUPABASE_URL
// SUPABASE_SERVICE_ROLE_KEY
// ZOHO_USER (ex: support@reportlost.org)
// ZOHO_PASS (mot de passe/app password)
// MAILGUN_SIGNING_KEY (key-…)
// (optionnel) SUPPORT_EMAIL = support@reportlost.org
// ───────────────────────────────────────────────────────────────────────────────

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const SUPPORT_EMAIL = process.env.SUPPORT_EMAIL || "support@reportlost.org";

// ───────────────────────────────────────────────────────────────────────────────
// Utils
// ───────────────────────────────────────────────────────────────────────────────
function json(data: any, status = 200) {
  return NextResponse.json(data, { status, headers: { "Cache-Control": "no-store" } });
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

// Vérif signature Mailgun (recommandé)
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

// Parse une adresse dans un "From: Name <user@domaine>"
function extractEmail(addr: string): string | null {
  const m = addr.match(/[<\s]([A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,})>?/i);
  return m ? m[1].toLowerCase() : null;
}

// Capture public_id et thread éventuel : 89572@scan…  ou 89572-k9a3z@scan…
function parseRecipient(recipientLower: string): { publicId: string | null; threadId: string | null } {
  // 89572-k9a3z@scan.reportlost.org  OU  89572@scan.reportlost.org
  const m = recipientLower.match(/^([0-9]{5})(?:-([a-z0-9]{4,10}))?@scan\.reportlost\.org$/i);
  if (!m) return { publicId: null, threadId: null };
  return { publicId: m[1], threadId: m[2] || null };
}

function randThreadId() {
  return Math.random().toString(36).slice(2, 7); // 5 chars
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

// ───────────────────────────────────────────────────────────────────────────────
// Route principale
// ───────────────────────────────────────────────────────────────────────────────
export async function POST(req: NextRequest) {
  try {
    // Mailgun → multipart/form-data
    const form = await req.formData();

    const recipient = String(form.get("recipient") || "").trim();   // ex: 89572[-thread]@scan.reportlost.org
    const from = String(form.get("from") || "");                    // “Name <email@ex.tld>”
    const subject = String(form.get("subject") || "");
    const text = String(form.get("stripped-text") || form.get("body-plain") || "");
    const html = String(form.get("stripped-html") || form.get("body-html") || "");

    const ts = String(form.get("timestamp") || "");
    const token = String(form.get("token") || "");
    const signature = String(form.get("signature") || "");
    if (!verifyMailgunSignature(ts, token, signature)) {
      return json({ ok: false, error: "Bad signature" }, 403);
    }

    const recipientLower = recipient.toLowerCase();
    const { publicId, threadId: incomingThread } = parseRecipient(recipientLower);
    if (!publicId) {
      // Pas pour nous → prévenir support
      const tr = buildTransport();
      await tr.sendMail({
        from: `Reportlost Router <${SUPPORT_EMAIL}>`,
        to: SUPPORT_EMAIL,
        subject: `[Router] Unhandled recipient: ${recipient}`,
        text: `Recipient: ${recipient}\nFrom: ${from}\nSubject: ${subject}\n\n${text || "(no text)"}`,
        html:
          html ||
          `<pre>${escapeHtml(
            `Recipient: ${recipient}\nFrom: ${from}\nSubject: ${subject}\n\n${text || "(no text)"}`
          )}</pre>`,
      });
      return json({ ok: true, routed: "support-only (unhandled alias)" });
    }

    // Récupère l’email propriétaire
    const { data: item, error } = await supabase
      .from("lost_items")
      .select("email, first_name, title, description")
      .eq("public_id", publicId)
      .maybeSingle();

    if (error || !item?.email) {
      const tr = buildTransport();
      await tr.sendMail({
        from: `Reportlost Router <${SUPPORT_EMAIL}>`,
        to: SUPPORT_EMAIL,
        subject: `[Router] No owner for ID ${publicId}`,
        text: `Recipient: ${recipient}\nFrom: ${from}\nSubject: ${subject}\n\n${text || "(no text)"}`,
        html:
          html ||
          `<pre>${escapeHtml(
            `Recipient: ${recipient}\nFrom: ${from}\nSubject: ${subject}\n\n${text || "(no text)"}`
          )}</pre>`,
      });
      return json({ ok: true, routed: "support-only (no owner)" });
    }

    const ownerEmail = String(item.email).toLowerCase();
    const senderEmail = extractEmail(from) || ""; // expéditeur réel

    const tr = buildTransport();

    // ───────────────────────────────────────────────────────────────────────────
    // CAS A) Message venant d’un TROUVEUR -> on crée/maj une conversation
    //       et on relaye au propriétaire. Reply-To = public_id-thread@…
    // ───────────────────────────────────────────────────────────────────────────
    if (senderEmail && senderEmail !== ownerEmail) {
      // Crée un thread_id si absent
      const threadId = incomingThread || randThreadId();

      // upsert conversation
      await supabase
        .from("conversations")
        .upsert(
          {
            public_id: publicId,
            thread_id: threadId,
            owner_email: ownerEmail,
            finder_email: senderEmail,
            last_msg_at: new Date().toISOString(),
          },
          { onConflict: "public_id,thread_id" }
        );

      const replyAlias = `${publicId}-${threadId}@scan.reportlost.org`;

      const introText =
        `Hello${item.first_name ? " " + item.first_name : ""},\n\n` +
        `We received a message about one of your QR-tagged items (ID ${publicId}).\n` +
        `Sender: ${from}\n\n` +
        (text || "(no text)") +
        `\n\nYou can reply directly to this email (Reply-To is preserved).`;

      const introHtml =
        `<p>Hello${item.first_name ? " " + escapeHtml(item.first_name) : ""},</p>` +
        `<p>We received a message about one of your QR-tagged items (ID <strong>${escapeHtml(publicId)}</strong>).</p>` +
        `<p><em>Sender:</em> ${escapeHtml(from || "unknown sender")}</p>` +
        (html ? html : `<pre style="white-space:pre-wrap">${escapeHtml(text || "(no text)")}</pre>`) +
        `<p>You can reply directly to this email; we’ll relay it to the finder.</p>`;

      await tr.sendMail({
        from: `Reportlost Relay <${process.env.ZOHO_USER!}>`,
        to: ownerEmail,
        replyTo: replyAlias, // ← très important
        subject: subject || `New message about your item (ID ${publicId})`,
        text: introText,
        html: introHtml,
      });

      return json({ ok: true, routed: "finder->owner", publicId, threadId });
    }

    // ───────────────────────────────────────────────────────────────────────────
    // CAS B) Message venant du PROPRIÉTAIRE -> on relaye au TROUVEUR
    //        on doit connaître le finder_email (via le thread_id le plus récent).
    // ───────────────────────────────────────────────────────────────────────────
    // On cherche le thread à utiliser :
    //  1) si l’alias contenait déjà un threadId, on s’en sert
    //  2) sinon, on prend la dernière conversation (last_msg_at) de ce public_id
    let convo: any = null;

    if (incomingThread) {
      const { data } = await supabase
        .from("conversations")
        .select("*")
        .eq("public_id", publicId)
        .eq("thread_id", incomingThread)
        .maybeSingle();
      convo = data || null;
    } else {
      const { data } = await supabase
        .from("conversations")
        .select("*")
        .eq("public_id", publicId)
        .order("last_msg_at", { ascending: false })
        .limit(1);
      convo = (data && data[0]) || null;
    }

    if (!convo?.finder_email) {
      // Pas de conversation connue -> on renvoie vers support
      await tr.sendMail({
        from: `Reportlost Router <${SUPPORT_EMAIL}>`,
        to: SUPPORT_EMAIL,
        subject: `[Router] Owner replied but no conversation found (ID ${publicId})`,
        text: `Owner: ${ownerEmail}\nRecipient: ${recipient}\nSubject: ${subject}\n\n${text || "(no text)"}`,
        html:
          html ||
          `<pre>${escapeHtml(
            `Owner: ${ownerEmail}\nRecipient: ${recipient}\nSubject: ${subject}\n\n${text || "(no text)"}`
          )}</pre>`,
      });
      return json({ ok: true, routed: "support-only (no conversation)" });
    }

    // Relais au trouveur
    const threadId = convo.thread_id;
    const replyAlias = `${publicId}-${threadId}@scan.reportlost.org`;

    await tr.sendMail({
      from: `Reportlost Relay <${process.env.ZOHO_USER!}>`,
      to: convo.finder_email,
      replyTo: replyAlias, // conserve la boucle
      subject: subject || `Reply from owner (ID ${publicId})`,
      text: text || "(no text)",
      html: html || `<pre style="white-space:pre-wrap">${escapeHtml(text || "(no text)")}</pre>`,
    });

    // MAJ horodatage
    await supabase
      .from("conversations")
      .update({ last_msg_at: new Date().toISOString() })
      .eq("public_id", publicId)
      .eq("thread_id", threadId);

    return json({ ok: true, routed: "owner->finder", publicId, threadId });
  } catch (e: any) {
    console.error("[inbound-email] FATAL:", e);
    return json({ ok: false, error: String(e?.message || e) }, 500);
  }
}
