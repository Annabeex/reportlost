import { NextRequest, NextResponse } from "next/server";
import nodemailer, { Transporter } from "nodemailer";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/* ---------- Helpers JSON + CORS ---------- */
function json(data: any, init?: ResponseInit) {
  const res = NextResponse.json(data, init);
  res.headers.set("Cache-Control", "no-store");
  res.headers.set("Access-Control-Allow-Origin", "*");
  res.headers.set("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.headers.set("Access-Control-Allow-Headers", "Content-Type");
  return res;
}

export async function OPTIONS() {
  return new Response(null, {
    status: 204,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
      "Cache-Control": "no-store",
    },
  });
}

/* ---------- Transporter (réutilisé) ---------- */
let cachedTransporter: Transporter | null = null;

function getTransporter(): Transporter {
  if (cachedTransporter) return cachedTransporter;

  const smtpHostRaw = process.env.SMTP_HOST?.trim();
  const smtpPort = Number(process.env.SMTP_PORT || 587);
  const smtpUser = process.env.SMTP_USER;
  const smtpPass = process.env.SMTP_PASS;

  const isLocalHost = !!smtpHostRaw && /^(localhost|127\.0\.0\.1)$/i.test(smtpHostRaw);

  // 1) SMTP générique si host non-local ET identifiants présents
  if (smtpHostRaw && !isLocalHost && smtpUser && smtpPass) {
    cachedTransporter = nodemailer.createTransport({
      host: smtpHostRaw,
      port: smtpPort,
      secure: smtpPort === 465, // 465 = TLS implicite
      auth: { user: smtpUser, pass: smtpPass },
      // ⏱️ timeouts relevés à 20s
      connectionTimeout: 20_000,
      socketTimeout: 20_000,
      greetingTimeout: 20_000,
    });
    console.log(`[mail] Using generic SMTP: ${smtpHostRaw}:${smtpPort}`);
    return cachedTransporter;
  }

  // 2) Fallback Zoho (ancienne config)
  const zohoUser = process.env.ZOHO_USER;
  const zohoPass = process.env.ZOHO_PASS;
  if (zohoUser && zohoPass) {
    cachedTransporter = nodemailer.createTransport({
      host: "smtp.zoho.eu",
      port: 465,
      secure: true,
      auth: { user: zohoUser, pass: zohoPass },
      connectionTimeout: 20_000,
      socketTimeout: 20_000,
      greetingTimeout: 20_000,
    });
    console.log(`[mail] Using Zoho SMTP (smtp.zoho.eu:465)`);
    return cachedTransporter;
  }

  // 3) Dev-only: mock transport JSON
  if (process.env.NODE_ENV !== "production") {
    cachedTransporter = nodemailer.createTransport({
      jsonTransport: true,
    });
    console.warn(
      "[mail] No valid SMTP configured; using jsonTransport (dev only, no real email sent)."
    );
    return cachedTransporter;
  }

  // 4) Prod sans SMTP valide
  throw new Error(
    "Missing valid SMTP credentials. Provide non-local SMTP_HOST + SMTP_USER + SMTP_PASS, or ZOHO_USER + ZOHO_PASS."
  );
}

/* ---------- Sanitize ---------- */
function sanitizeHeader(value: string) {
  return value.replace(/(\r|\n)/g, " ").trim();
}

/* ---------- Utils destinataires ---------- */
function normalizeToList(input?: string | string[]): string[] {
  if (!input) return [];
  if (Array.isArray(input)) {
    return input
      .flatMap((v) => String(v).split(","))
      .map((s) => s.trim())
      .filter(Boolean);
  }
  return String(input)
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
}

/* ---------- Handler ---------- */
export async function POST(req: NextRequest) {
  try {
    const ct = req.headers.get("content-type") || "";
    if (!ct.includes("application/json")) {
      return json({ ok: false, error: "Content-Type must be application/json" }, { status: 415 });
    }

    const body = (await req.json().catch(() => null)) as {
      to?: string | string[];
      subject?: string;
      text?: string;
      html?: string;
      replyTo?: string;
      fromName?: string;
      publicId?: string | number; // ex "12345" ou 12345
      kind?: "followup" | string; // follow-up manuel => flag en base
    } | null;

    if (!body) return json({ ok: false, error: "Invalid JSON body" }, { status: 400 });

    const toList = normalizeToList(body.to);
    const subject = body.subject ? sanitizeHeader(body.subject) : "";
    const text = body.text ? String(body.text) : "";
    const html = body.html ? String(body.html) : undefined;

    if (!toList.length || !subject || !text) {
      return json({ ok: false, error: "Missing fields: to, subject, text" }, { status: 400 });
    }
    if (subject.length > 200) {
      return json({ ok: false, error: "Subject too long" }, { status: 400 });
    }

    // From / Reply-To
    const mailFromEnv = process.env.MAIL_FROM; // ex: "ReportLost <noreply@reportlost.org>"
    const smtpUser = process.env.SMTP_USER || process.env.ZOHO_USER || "";
    const fromName = sanitizeHeader(body.fromName || "ReportLost");
    const from =
      mailFromEnv ||
      (smtpUser ? `"${fromName}" <${smtpUser}>` : `"${fromName}" <noreply@reportlost.org>`);
    const replyTo = body.replyTo ? sanitizeHeader(body.replyTo) : undefined;

    const transporter = getTransporter();

    // Envoi
    const info = await transporter.sendMail({
      from,
      to: toList.join(", "),
      subject,
      text,
      html,
      ...(replyTo ? { replyTo } : {}),
    });

    // jsonTransport retourne le message dans info.message
    if ((transporter as any).options?.jsonTransport) {
      try {
        const parsed = typeof (info as any).message === "string" ? JSON.parse((info as any).message) : info;
        console.log("📧 [DEV] Email (jsonTransport):", JSON.stringify(parsed, null, 2));
      } catch {
        console.log("📧 [DEV] Email (jsonTransport):", info);
      }
    } else {
      console.log("📧 Email sent:", (info as any).messageId, "→", toList.join(", "));
    }

    // --- Mise à jour Supabase pour les follow-ups seulement ---
    if (body.kind === "followup" && body.publicId != null) {
      try {
        const supabase = getSupabaseAdmin();
        if (supabase) {
          const pidRaw = String(body.publicId);
          const pid = /^\d+$/.test(pidRaw) ? Number(pidRaw) : pidRaw;

          // Tentative 1: nouvelles colonnes *_bool
          let { error } = await supabase
            .from("lost_items")
            .update({
              followup_email_sent_bool: true,
              followup_email_sent_at: new Date().toISOString(),
              followup_email_to: toList.join(", "),
            })
            .eq("public_id", pid);

          if (error) {
            console.warn("followup flag update (bool) failed, retry legacy:", error?.message || error);
            // Tentative 2: anciennes colonnes (sans _bool)
            const r2 = await supabase
              .from("lost_items")
              .update({
                followup_email_sent: true,
                followup_email_sent_at: new Date().toISOString(),
                followup_email_to: toList.join(", "),
              })
              .eq("public_id", pid);
            if (r2.error) {
              console.warn("followup flag update (legacy) failed:", r2.error?.message || r2.error);
            } else {
              console.log("✅ followup flag updated (legacy) for", pid);
            }
          } else {
            console.log("✅ followup flag updated (bool) for", pid);
          }
        } else {
          console.warn("send-mail: Supabase not configured; skip followup flagging");
        }
      } catch (e) {
        console.warn("send-mail: followup flagging threw", e);
      }
    } else {
      // Autres types d’emails (publication/receipt/internal_alert, etc.) : pas de flag spécifique ici.
      console.log("ℹ️ Email sent (no follow-up flagging). kind:", body.kind || "none");
    }

    return json(
      { ok: true, messageId: (info as any).messageId || "dev-json-transport" },
      { status: 200 }
    );
  } catch (err: any) {
    if (err?.code || err?.responseCode) {
      console.error("SMTP error:", err);
      return json(
        { ok: false, error: "SMTP upstream error", code: err.code ?? err.responseCode },
        { status: 502 }
      );
    }
    console.error("Unexpected mail error:", err);
    return json({ ok: false, error: "Unexpected server error" }, { status: 500 });
  }
}
