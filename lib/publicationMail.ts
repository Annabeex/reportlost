// lib/publicationMail.ts
//
// Le mail « votre annonce est publiée, la recherche n'a pas commencé ».
//
// Il était construit et envoyé depuis app/api/public/send-publication-email,
// déclenchée par le navigateur du visiteur à l'étape 5. Conséquence : quiconque
// referme l'onglet avant cet écran — sur l'écran des formules, par exemple —
// ne recevait jamais rien, alors que son annonce était en ligne depuis
// l'étape 2. Le contenu vit donc ici, pour qu'un rattrapage côté serveur
// (app/api/publication-mail-catchup) puisse envoyer exactement le même mail
// sans dépendre de la présence du visiteur.
import { createClient } from "@supabase/supabase-js";
import { sendMailDirect } from "@/lib/mailer";

export type PublicationMailResult =
  | { ok: true; skipped?: true; warning?: string }
  | { ok: false; error: string; status: number };

export function publicationMailAdmin() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL || "";
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || "";
  if (!url || !key) return null;
  return createClient(url, key, { auth: { persistSession: false } });
}

/**
 * Envoie le mail de publication pour un dépôt gratuit, et pose le drapeau
 * `publication_mail_sent`. Idempotent : un dossier déjà traité renvoie
 * `{ ok: true, skipped: true }` sans envoyer.
 *
 * @param expectedEmail si fourni, doit correspondre à l'e-mail du dossier
 *                      (protège la route publique d'un tiers qui devinerait
 *                      un identifiant).
 */
export async function sendPublicationMail(
  reportId: string,
  baseUrl: string,
  expectedEmail?: string,
): Promise<PublicationMailResult> {
  const id = String(reportId || "").trim();
  if (!id) return { ok: false, error: "Missing reportId", status: 400 };

  const supabaseAdmin = publicationMailAdmin();
  if (!supabaseAdmin) return { ok: false, error: "Server not configured", status: 500 };

  const { data: row, error } = await supabaseAdmin
    .from("lost_items")
    .select("id, publication_mail_sent, email, first_name, title, date, city, public_id")
    .eq("id", id)
    .maybeSingle();

  if (error) return { ok: false, error: error.message, status: 500 };
  if (!row) return { ok: false, error: "Report not found", status: 404 };

  if (
    expectedEmail &&
    row.email &&
    expectedEmail.trim().toLowerCase() !== String(row.email).trim().toLowerCase()
  ) {
    return { ok: false, error: "Email mismatch", status: 403 };
  }

  // ⚠️ Ce garde-fou lisait `mail_sent`, qui est posé par /api/save-report au
  // moment où le brouillon est enregistré — donc AVANT le choix de formule.
  // Chaque mail a désormais son propre drapeau.
  if (row.publication_mail_sent) return { ok: true, skipped: true };
  if (!row.email) return { ok: false, error: "No email on report", status: 400 };

  const base = String(baseUrl || "https://reportlost.org").replace(/\/+$/, "");
  const contributeUrl = `${base}/report?go=contribute&rid=${encodeURIComponent(id)}`;
  // Rattrapage : réservé à ceux qui n'ont pas pris la formule active, donc
  // sans effet de cannibalisation sur la formule à 25 $.
  const autoOfferUrl = `${contributeUrl}&offer=auto`;
  const ref5 = String(row.public_id || "").trim();

  const itemLabel = String(row.title || "").replace(/\s+/g, " ").trim().slice(0, 30);
  const subject = itemLabel
    ? `Your ${itemLabel} report is published`
    : "Your lost-item report is published";
  const preheader = "Your free public listing is available. Optional search services are described below.";
  const detailLine = [row.title || "", row.date ? `lost ${row.date}` : "", row.city || ""]
    .filter(Boolean)
    .join(" · ");

  const text = `Hello ${row.first_name || ""},

Your report has been published as a public listing on ReportLost.org. The free listing is available without a paid search service.

Search options, each with a one-time fee and no renewal:
- Automatic search ($12): six months of public-web monitoring, reviewed potential matches, a dated ReportLost certificate, an anonymous email address linked to the report, and printable QR stickers linked to it.
- Team-assisted search ($25): everything in the $12 option, with 12 months of monitoring, manual research, direct contact with relevant services and venues, report submission to appropriate services, and a notice shared with relevant local groups under their posting rules.

Potential matches from paid search services are reviewed before notification. Monitoring does not cover content inaccessible to public search tools. Recovery cannot be guaranteed, and ReportLost is not a public agency.

Review the search options: ${contributeUrl}
Review automatic search: ${autoOfferUrl}

${detailLine}${ref5 ? `\nReference ${ref5}` : ""}

Your free listing remains available either way.`;

  const html = `
<div style="display:none;max-height:0;overflow:hidden;mso-hide:all;font-size:1px;line-height:1px;color:#ffffff">${preheader}&#8199;&#65279;&#847;&#8199;&#65279;&#847;&#8199;&#65279;&#847;&#8199;&#65279;</div>
<div style="font-family:Arial,Helvetica,sans-serif;max-width:620px;margin:auto;border:1px solid #e5e7eb;border-radius:10px;overflow:hidden;background:#fff">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;border-bottom:1px solid #e5e7eb">
    <tr><td style="padding:14px 18px;font-size:17px;font-weight:bold;color:#111827">Report<span style="color:#3b82f6">Lost</span><span style="color:#9ca3af;font-size:10px">.org</span></td><td align="right" style="padding:14px 18px;font-size:11px;color:#6b7280">${ref5 ? `Reference <b style="color:#1f2937">${ref5}</b>` : ""}</td></tr>
  </table>
  <div style="padding:16px 18px;background:#f0fdf4;border-bottom:1px solid #dcfce7;color:#166534;font-size:14px"><b>Report published</b><div style="margin-top:3px;color:#4b5563">A free public listing is available. Search services are optional.</div></div>
  <div style="padding:18px;color:#1f2937;line-height:1.6;font-size:14px">
    <p style="margin:0 0 12px">Hello <b>${row.first_name || ""}</b>,</p>
    <p style="margin:0 0 14px">Your report has been published on <a href="${base}" style="color:#2C7A4A;text-decoration:underline">ReportLost.org</a>.</p>
    <p style="margin:0 0 8px"><b>Search options</b></p>
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;border-top:1px solid #e5e7eb">
      <tr><td style="padding:10px 0;border-bottom:1px solid #e5e7eb"><b>Automatic search, $12 once</b><br/>Six months of public-web monitoring, reviewed matches, a dated ReportLost certificate, an anonymous case email address, and printable QR stickers linked to it.</td></tr>
      <tr><td style="padding:10px 0;border-bottom:1px solid #e5e7eb"><b>Team-assisted search, $25 once</b><br/>Everything in the $12 option, with 12 months of monitoring, manual research, direct service contact and report submission, and a notice shared with relevant local groups under their posting rules.</td></tr>
    </table>
    <p style="margin:12px 0;color:#4b5563;font-size:12.5px">Potential matches from paid search services are reviewed before notification. Monitoring does not cover content inaccessible to public search tools. ReportLost is independent of public agencies and cannot guarantee recovery.</p>
    <div style="margin:16px 0 10px;text-align:center"><a href="${contributeUrl}" style="display:inline-block;background:#26723e;color:#fff;padding:12px 18px;border-radius:8px;text-decoration:none;font-weight:700">Review search options</a></div>
    <p style="margin:0 0 12px;text-align:center;font-size:12.5px"><a href="${autoOfferUrl}" style="color:#166534;text-decoration:underline">Review automatic search, $12</a></p>
    <p style="margin:14px 0 0;padding-top:10px;border-top:1px solid #f3f4f6;font-size:12px;color:#6b7280">${detailLine}</p>
    <p style="margin:8px 0 0;font-size:12px;color:#6b7280">Your free public listing remains available either way.</p>
  </div>
</div>`;

  // ✅ Envoi SMTP direct (plus de fetch interne vers /api/send-mail, source
  // des timeouts serverless corrigés partout ailleurs).
  const sent = await sendMailDirect({
    to: String(row.email),
    subject,
    text,
    html,
    fromName: "ReportLost",
  });
  if (!sent) return { ok: false, error: "send failed", status: 502 };

  const { error: upErr } = await supabaseAdmin
    .from("lost_items")
    .update({ publication_mail_sent: true })
    .eq("id", id);

  if (upErr) {
    // email envoyé mais drapeau non persisté : on renvoie ok quand même
    return { ok: true, warning: "mail sent but publication_mail_sent not persisted" };
  }
  return { ok: true };
}
