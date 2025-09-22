// app/api/send-mail/route.ts
import { NextRequest, NextResponse } from "next/server";
import nodemailer, { Transporter } from "nodemailer";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function json(data: any, init?: ResponseInit) {
  const res = NextResponse.json(data, init);
  res.headers.set("Cache-Control", "no-store"); // jamais de cache pour l’envoi d’e-mails
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

// Réutilise le transporteur entre invocations (réduit le coût sur serverless)
let cachedTransporter: Transporter | null = null;
function getTransporter(): Transporter {
  if (cachedTransporter) return cachedTransporter;

  const user = process.env.ZOHO_USER;
  const pass = process.env.ZOHO_PASS;

  if (!user || !pass) {
    throw new Error("Missing ZOHO_USER/ZOHO_PASS");
  }

  cachedTransporter = nodemailer.createTransport({
    host: "smtp.zoho.eu",
    port: 465,
    secure: true,
    auth: { user, pass },
    // timeouts pour éviter de bloquer
    connectionTimeout: 10_000,
    socketTimeout: 15_000,
  });

  return cachedTransporter;
}

// petite sanitation pour éviter l’injection d’en-têtes via \r\n
function sanitizeHeader(value: string) {
  return value.replace(/(\r|\n)/g, " ").trim();
}

export async function POST(req: NextRequest) {
  try {
    const ct = req.headers.get("content-type") || "";
    if (!ct.includes("application/json")) {
      return json({ error: "Content-Type must be application/json" }, { status: 415 });
    }

    const body = await req.json().catch(() => null) as {
      to?: string | string[];
      subject?: string;
      text?: string;
      html?: string;
      replyTo?: string;
      fromName?: string; // optionnel
    } | null;

    if (!body) return json({ error: "Invalid JSON body" }, { status: 400 });

    const toList = Array.isArray(body.to) ? body.to : body.to ? [body.to] : [];
    const subject = body.subject ? sanitizeHeader(body.subject) : "";
    const text = body.text ? String(body.text) : "";
    const html = body.html ? String(body.html) : undefined;

    if (!toList.length || !subject || !text) {
      return json({ error: "Missing fields: to, subject, text" }, { status: 400 });
    }
    if (subject.length > 200) {
      return json({ error: "Subject too long" }, { status: 400 });
    }

    // from/reply-to
    const user = process.env.ZOHO_USER!;
    const fromName = sanitizeHeader(body.fromName || "ReportLost");
    const from = `"${fromName}" <${user}>`;
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

    // 200 OK avec id de message
    return json({ success: true, messageId: info.messageId }, { status: 200 });
  } catch (err: any) {
    // Erreurs SMTP = 502 (upstream)
    if (err?.code || err?.responseCode) {
      console.error("SMTP error:", err);
      return json(
        { error: "SMTP upstream error", code: err.code ?? err.responseCode },
        { status: 502 }
      );
    }
    console.error("Unexpected mail error:", err);
    return json({ error: "Unexpected server error" }, { status: 500 });
  }
}
