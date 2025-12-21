import { NextRequest, NextResponse } from "next/server";
import nodemailer, { Transporter } from "nodemailer";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * ENV à ajouter (local + Vercel) :
 * - MAIL_API_KEY=une_chaine_longue_random_de_40+_caracteres
 * - MAIL_ALLOWED_ORIGINS=https://reportlost.org,https://www.reportlost.org (optionnel)
 * - MAIL_RATE_LIMIT_PER_HOUR=30 (optionnel)
 */
const MAIL_API_KEY = (process.env.MAIL_API_KEY || "").trim();
const MAIL_ALLOWED_ORIGINS = (process.env.MAIL_ALLOWED_ORIGINS || "").trim();
const MAIL_RATE_LIMIT_PER_HOUR = Number(process.env.MAIL_RATE_LIMIT_PER_HOUR || 30);

type RateState = { count: number; resetAt: number };
const rateLimits = new Map<string, RateState>();

function getAllowedOrigins(): string[] {
  if (MAIL_ALLOWED_ORIGINS) {
    return MAIL_ALLOWED_ORIGINS
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
  }
  const site = (process.env.NEXT_PUBLIC_SITE_URL || "").trim();
  return site ? [site] : ["https://reportlost.org", "https://www.reportlost.org"];
}

function getCorsOrigin(req: NextRequest): string | null {
  const origin = req.headers.get("origin");
  if (!origin) return null;

  const allowed = getAllowedOrigins();
  // si on a une liste, on ne renvoie l'origin que si autorisé
  if (allowed.length) return allowed.includes(origin) ? origin : "null";
  return origin;
}

function getRequestIp(req: NextRequest): string {
  const forwarded = req.headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0].trim();
  return req.headers.get("x-real-ip") || "unknown";
}

function isRateLimited(req: NextRequest): boolean {
  if (!Number.isFinite(MAIL_RATE_LIMIT_PER_HOUR) || MAIL_RATE_LIMIT_PER_HOUR <= 0) return false;

  const now = Date.now();
  const key = getRequestIp(req);
  const state = rateLimits.get(key);

  if (!state || now > state.resetAt) {
    rateLimits.set(key, { count: 1, resetAt: now + 60 * 60 * 1000 });
    return false;
  }

  if (state.count >= MAIL_RATE_LIMIT_PER_HOUR) return true;
  state.count += 1;
  return false;
}

function hasValidMailKey(req: NextRequest): boolean {
  // si tu n'as pas défini MAIL_API_KEY (pas recommandé en prod), on laisse passer
  if (!MAIL_API_KEY) return true;

  const auth = req.headers.get("authorization") || "";
  if (!auth.startsWith("Bearer ")) return false;
  const token = auth.slice("Bearer ".length).trim();
  return token === MAIL_API_KEY;
}

/* ---------- Helpers JSON + CORS ---------- */
function json(data: any, init?: ResponseInit, origin?: string | null) {
  const res = NextResponse.json(data, init);
  res.headers.set("Cache-Control", "no-store");
  if (origin) res.headers.set("Access-Control-Allow-Origin", origin);
  res.headers.set("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.headers.set("Access-Control-Allow-Headers", "Content-Type, Authorization");
  return res;
}

export async function OPTIONS(req: NextRequest) {
  const origin = getCorsOrigin(req);
  return new Response(null, {
    status: 204,
    headers: {
      ...(origin ? { "Access-Control-Allow-Origin": origin } : {}),
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization",
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
      secure: smtpPort === 465,
      auth: { user: smtpUser, pass: smtpPass },
      connectionTimeout: 20_000,
      socketTimeout: 20_000,
      greetingTimeout: 20_000,
    });
    console.log(`[mail] Using generic SMTP: ${smtpHostRaw}:${smtpPort}`);
    return cachedTransporter;
  }

  // 2) Fallback Zoho
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
    cachedTransporter = nodemailer.createTransport({ jsonTransport: true });
    console.warn("[mail] No valid SMTP configured; using jsonTransport (dev only).");
    return cachedTransporter;
  }

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
  const origin = getCorsOrigin(req);

  // 1) Auth header obligatoire (si MAIL_API_KEY défini)
  if (!hasValidMailKey(req)) {
    return json({ ok: false, error: "Unauthorized" }, { status: 401 }, origin);
  }

  // 2) Rate limit par IP
  if (isRateLimited(req)) {
    return json({ ok: false, error: "Rate limit exceeded" }, { status: 429 }, origin);
  }

  try {
    const ct = req.headers.get("content-type") || "";
    if (!ct.includes("application/json")) {
      return json({ ok: false, error: "Content-Type must be application/json" }, { status: 415 }, origin);
    }

    const body = (await req.json().catch(() => null)) as {
      to?: string | string[];
      subject?: string;
      text?: string;
      html?: string;
      replyTo?: string;
      fromName?: string;
      publicId?: string | number;
      kind?: "followup" | string;
    } | null;

    if (!body) return json({ ok: false, error: "Invalid JSON body" }, { status: 400 }, origin);

    const toList = normalizeToList(body.to);
    const subject = body.subject ? sanitizeHeader(body.subject) : "";
    const text = body.text ? String(body.text) : "";
    const html = body.html ? String(body.html) : undefined;

    if (!toList.length || !subject || !text) {
      return json({ ok: false, error: "Missing fields: to, subject, text" }, { status: 400 }, origin);
    }
    if (subject.length > 200) {
      return json({ ok: false, error: "Subject too long" }, { status: 400 }, origin);
    }

    const mailFromEnv = process.env.MAIL_FROM;
    const smtpUser = process.env.SMTP_USER || process.env.ZOHO_USER || "";
    const fromName = sanitizeHeader(body.fromName || "ReportLost");
    const from =
      mailFromEnv ||
      (smtpUser ? `"${fromName}" <${smtpUser}>` : `"${fromName}" <noreply@reportlost.org>`);
    const replyTo = body.replyTo ? sanitizeHeader(body.replyTo) : undefined;

    const transporter = getTransporter();

    const info = await transporter.sendMail({
      from,
      to: toList.join(", "),
      subject,
      text,
      html,
      ...(replyTo ? { replyTo } : {}),
    });

    if ((transporter as any).options?.jsonTransport) {
      try {
        const parsed =
          typeof (info as any).message === "string" ? JSON.parse((info as any).message) : info;
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
      console.log("ℹ️ Email sent (no follow-up flagging). kind:", body.kind || "none");
    }

    return json({ ok: true, messageId: (info as any).messageId || "dev-json-transport" }, { status: 200 }, origin);
  } catch (err: any) {
    if (err?.code || err?.responseCode) {
      console.error("SMTP error:", err);
      return json(
        { ok: false, error: "SMTP upstream error", code: err.code ?? err.responseCode },
        { status: 502 },
        origin
      );
    }
    console.error("Unexpected mail error:", err);
    return json({ ok: false, error: "Unexpected server error" }, { status: 500 }, origin);
  }
}
