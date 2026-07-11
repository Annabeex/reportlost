// lib/mailer.ts
// Envoi de mail DIRECT (SMTP) depuis les fonctions serveur, sans appel HTTP interne.
// Remplace les fetch vers /api/send-mail depuis save-report / stripe-webhook :
// plus de timeout lié au firewall, à la protection de déploiement ou au self-fetch.
import nodemailer, { Transporter } from "nodemailer";

let cachedTransporter: Transporter | null = null;

export function getMailTransporter(): Transporter {
  if (cachedTransporter) return cachedTransporter;

  const smtpHostRaw = process.env.SMTP_HOST?.trim();
  const smtpPort = Number(process.env.SMTP_PORT || 587);
  const smtpUser = process.env.SMTP_USER;
  const smtpPass = process.env.SMTP_PASS;
  const isLocalHost = !!smtpHostRaw && /^(localhost|127\.0\.0\.1)$/i.test(smtpHostRaw);

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
    return cachedTransporter;
  }

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
    return cachedTransporter;
  }

  throw new Error("Missing SMTP credentials (SMTP_* or ZOHO_*)");
}

export async function sendMailDirect(payload: {
  to: string | string[];
  subject: string;
  text: string;
  html?: string;
  fromName?: string;
  replyTo?: string;
}): Promise<boolean> {
  try {
    const transporter = getMailTransporter();
    const fromAddr = process.env.SMTP_USER || process.env.ZOHO_USER || "support@reportlost.org";
    await transporter.sendMail({
      from: `"${(payload.fromName || "ReportLost").replace(/(\r|\n)/g, " ")}" <${fromAddr}>`,
      to: payload.to,
      subject: payload.subject.replace(/(\r|\n)/g, " ").trim(),
      text: payload.text,
      ...(payload.html ? { html: payload.html } : {}),
      ...(payload.replyTo ? { replyTo: payload.replyTo } : {}),
    });
    return true;
  } catch (e) {
    console.error("sendMailDirect error:", (e as Error)?.message || e);
    return false;
  }
}
