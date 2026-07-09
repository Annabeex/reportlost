// lib/matchWatch/email.ts
// Envoi du digest quotidien (nodemailer, même config SMTP que /api/send-mail).

import nodemailer, { Transporter } from "nodemailer";
import type { LostReport, Candidate } from "./core";
import type { FbHelp } from "./fbGroups";

let cached: Transporter | null = null;
function getTransporter(): Transporter {
  if (cached) return cached;
  const smtpHost = process.env.SMTP_HOST?.trim();
  if (smtpHost) {
    cached = nodemailer.createTransport({
      host: smtpHost,
      port: Number(process.env.SMTP_PORT || 587),
      secure: Number(process.env.SMTP_PORT || 587) === 465,
      auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
    });
    return cached;
  }
  if (process.env.ZOHO_USER && process.env.ZOHO_PASS) {
    cached = nodemailer.createTransport({
      host: "smtp.zoho.eu",
      port: 465,
      secure: true,
      auth: { user: process.env.ZOHO_USER, pass: process.env.ZOHO_PASS },
    });
    return cached;
  }
  cached = nodemailer.createTransport({ jsonTransport: true }); // dev : n'envoie pas vraiment
  return cached;
}

export type DigestEntry = { report: LostReport; candidates: Candidate[]; fb: FbHelp };

function esc(s: string): string {
  return String(s || "").replace(/[<>&]/g, (c) => ({ "<": "&lt;", ">": "&gt;", "&": "&amp;" }[c] as string));
}

function verdictBadge(v: string, c: number): string {
  const color = v === "yes" ? "#16a34a" : v === "maybe" ? "#d97706" : "#6b7280";
  return `<span style="background:${color};color:#fff;font-size:11px;font-weight:700;padding:2px 8px;border-radius:9999px">${v.toUpperCase()} ${c}%</span>`;
}

export function buildDigestHtml(entries: DigestEntry[]): string {
  const blocks = entries
    .map((e) => {
      const loc = [e.report.city, e.report.state_id].filter(Boolean).join(", ");
      const cands = e.candidates
        .map(
          (c) => `
          <li style="margin:8px 0">
            ${verdictBadge(c.verdict, c.confidence)}
            <a href="${esc(c.link)}" style="color:#2563eb;font-weight:600">${esc(c.title)}</a>
            <span style="color:#9ca3af;font-size:12px">(${esc(c.source)}${c.date ? " · " + esc(c.date) : ""})</span>
            ${c.snippet ? `<div style="color:#374151;font-size:13px;margin-top:4px">${esc(c.snippet)}</div>` : ""}
            <div style="color:#6b7280;font-size:12px;margin-top:3px">🤖 ${esc(c.reason)}</div>
          </li>`
        )
        .join("");

      const fbGroups = e.fb.groups.length
        ? e.fb.groups
            .map((g) => `<a href="${esc(g.searchUrl)}" style="color:#2563eb">${esc(g.name)}</a>`)
            .join(" · ")
        : `<em style="color:#b45309">Aucun groupe lost &amp; found configuré pour cette ville — pense à en rejoindre un / créer un partenariat.</em>`;

      return `
      <div style="border:1px solid #e5e7eb;border-radius:12px;padding:16px;margin:14px 0">
        <div style="font-weight:700;color:#111827">${esc(e.report.title || "Lost item")} — ${esc(loc)}</div>
        <div style="color:#6b7280;font-size:12px;margin-bottom:8px">
          ID <strong>${esc(e.report.public_id || e.report.id)}</strong>${
        e.report.email ? ` · Client : <a href="mailto:${esc(e.report.email)}" style="color:#2563eb">${esc(e.report.email)}</a>` : ""
      }${
        e.report.public_id
          ? ` · <a href="https://reportlost.org/case/${esc(e.report.public_id)}?edit=1" style="color:#2563eb">Ouvrir le dossier</a>`
          : ""
      }
        </div>
        <ul style="list-style:none;padding-left:0;margin:0">${cands}</ul>
        <div style="margin-top:10px;font-size:13px">
          🔎 Vérif manuelle Facebook :
          <a href="${esc(e.fb.postSearchUrl)}" style="color:#2563eb">rechercher « ${esc(e.fb.query)} »</a><br/>
          👥 Groupes : ${fbGroups}
        </div>
      </div>`;
    })
    .join("");

  return `<div style="font-family:Inter,Arial,sans-serif;max-width:680px;margin:0 auto">
    <h2 style="color:#111827">Veille objets perdus — ${entries.length} signalement(s) avec candidats</h2>
    <p style="color:#6b7280">Candidats potentiels trouvés en ligne. À toi de valider avant de contacter le client.</p>
    ${blocks}
    <p style="color:#9ca3af;font-size:12px;margin-top:20px">ReportLost.org — veille automatique. Ce mail ne part que lorsqu'au moins un candidat crédible est trouvé.</p>
  </div>`;
}

export async function sendDigest(entries: DigestEntry[]): Promise<void> {
  if (!entries.length) return;
  const to =
    process.env.MATCH_DIGEST_TO ||
    process.env.NEXT_PUBLIC_REPORT_NOTIFICATION_EMAIL ||
    process.env.ZOHO_USER ||
    "";
  if (!to) throw new Error("Aucune adresse destinataire (MATCH_DIGEST_TO)");
  const from = process.env.MAIL_FROM || process.env.SMTP_USER || process.env.ZOHO_USER || to;

  await getTransporter().sendMail({
    from,
    to,
    subject: `🔎 Veille objets perdus — ${entries.length} signalement(s) à vérifier`,
    html: buildDigestHtml(entries),
  });
}
