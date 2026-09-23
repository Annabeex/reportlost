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

  // ⚠️ L'objet est lu en notification, sur l'écran verrouillé. « Your report is
  // published » y jouait comme un accusé de réception : affaire classée, rien à
  // faire. Il ne doit contenir aucun mot de clôture, et nommer l'objet perdu
  // plutôt que le dossier — c'est ce que la personne reconnaît d'un coup d'œil.
  const itemLabel = String(row.title || "").replace(/\s+/g, " ").trim().slice(0, 30);
  const subject = itemLabel
    ? `Your ${itemLabel}: the search has not started`
    : "The search on your report has not started";

  // Texte d'aperçu, affiché juste après l'objet par Gmail, Apple Mail et
  // Outlook. Sans lui, ils vont chercher la première ligne du corps — donc
  // « Published in the public database ». On le fixe explicitement.
  const preheader = "Nothing has been sent to anyone yet. Filing and outreach are a separate step.";
  const detailLine = [row.title || "", row.date ? `lost ${row.date}` : "", row.city || ""]
    .filter(Boolean)
    .join(" · ");

  const text = `Hello ${row.first_name || ""},

[ ] The search has not started — nothing is being done on your case at this stage.
[x] Published in the public database

Your report is online, and anyone looking for your item can find it. That is what a free listing does, and it is all it does.

No one is contacting the local lost & found desks, no report is filed with the police, and no one is comparing new "found" posts with your description.

WHAT ACTIVE SEARCH ADDS
- Filing with the competent lost-property service, usually the local police department.
- Outreach to the places likely to hold your item, based on where you lost it.
- A visual notice published locally, with an anonymous relay address.
- Web monitoring for 12 months, every credible match reviewed by a person.
- A loss report certificate - not an official document.
- A printable sheet of QR stickers.

$25 - one payment, 12 months, no renewal.
Activate my search: ${contributeUrl}

Only want the automated part? $12 covers the web monitoring for six months, the certificate and the sticker sheet. No outreach, no filing.
Add the automatic search: ${autoOfferUrl}

${detailLine}${ref5 ? `\nReference ${ref5}` : ""}

Your free listing stays online either way.`;

  // Gabarit e-mail : tableaux et styles en ligne uniquement (pas de flexbox,
  // que Gmail et Outlook rendent mal).
  const adds: [string, string][] = [
    ["Filing", "with the competent lost-property service, usually the local police department."],
    ["Outreach", "to the places likely to hold your item, based on where you lost it."],
    ["A visual notice", "published locally, with an anonymous relay address."],
    ["Web monitoring", "for 12 months, every credible match reviewed by a person."],
    ["A loss report certificate", "&mdash; not an official document."],
    ["A printable sheet", "of QR stickers."],
  ];
  const addsRows = adds
    .map(
      ([lead, rest], i) => `
      <tr>
        <td style="padding:9px 0;${i ? "border-top:1px solid #f3f4f6;" : ""}font-size:13.5px;line-height:1.5;color:#374151">
          <span style="color:#1f6b3a">&bull;</span>&nbsp;
          <b style="color:#111827">${lead}</b> ${rest}
        </td>
      </tr>`
    )
    .join("");

  const html = `
<div style="display:none;max-height:0;overflow:hidden;mso-hide:all;font-size:1px;line-height:1px;color:#ffffff">${preheader}&#8199;&#65279;&#847;&#8199;&#65279;&#847;&#8199;&#65279;&#847;&#8199;&#65279;&#847;&#8199;&#65279;&#847;&#8199;&#65279;&#847;</div>
<div style="font-family:Arial,Helvetica,sans-serif;max-width:620px;margin:auto;border:1px solid #e5e7eb;border-radius:10px;overflow:hidden;background:#fff">

  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;border-bottom:1px solid #e5e7eb">
    <tr>
      <td style="padding:14px 18px;font-size:17px;font-weight:bold;color:#111827">Report<span style="color:#3b82f6">Lost</span><span style="color:#9ca3af;font-size:10px">.org</span></td>
      <td align="right" style="padding:14px 18px;font-size:11px;color:#6b7280">${
        ref5 ? `Reference <b style="color:#1f2937">${ref5}</b>` : ""
      }</td>
    </tr>
  </table>

  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;background:#fffbeb;border-bottom:1px solid #fde68a">
    <tr>
      <td style="padding:14px 18px 4px;font-size:14px;line-height:1.45;color:#78350f">
        <b>&#9675;&nbsp; The search has not started</b>
        <div style="margin:3px 0 0 20px;font-size:12.5px;color:#92400e">Nothing is being done on your case at this stage.</div>
      </td>
    </tr>
    <tr>
      <td style="padding:5px 18px 14px;font-size:14px;line-height:1.45;color:#4b5563">
        <span style="color:#166534;font-weight:bold">&#10003;</span>&nbsp; Published in the public database
      </td>
    </tr>
  </table>

  <div style="padding:17px 18px 19px;color:#1f2937;line-height:1.6;font-size:14.5px">
    <p style="margin:0 0 13px">Hello <b>${row.first_name || ""}</b>,</p>
    <p style="margin:0 0 13px">
      Your report is online, and anyone looking for your item can find it. That is what a free
      listing does &mdash; and it is all it does.
    </p>
    <p style="margin:0 0 13px">
      No one is contacting the local lost &amp; found desks, no report is filed with the police,
      and no one is comparing new &ldquo;found&rdquo; posts with your description.
    </p>

    <p style="margin:18px 0 6px;font-size:13.5px;font-weight:bold;color:#111827">What Active search adds</p>
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;border-top:1px solid #f3f4f6;border-bottom:1px solid #f3f4f6">
      ${addsRows}
    </table>

    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;margin:14px 0 0;border:1px solid #e5e7eb;border-radius:9px;background:#f9fafb">
      <tr>
        <td style="padding:11px 13px;font-size:15px;font-weight:bold;color:#111827">$25</td>
        <td align="right" style="padding:11px 13px;font-size:12.5px;color:#6b7280">one payment &middot; 12 months &middot; no renewal</td>
      </tr>
    </table>

    <div style="margin:13px 0 0">
      <a href="${contributeUrl}"
         style="display:block;text-align:center;background:linear-gradient(90deg,#26723e,#2ea052);background-color:#26723e;color:#fff;padding:13px 18px;border-radius:9px;text-decoration:none;font-weight:bold;font-size:15px">
        Activate my search
      </a>
    </div>

    <p style="margin:13px 0 0;font-size:12.5px;line-height:1.6;color:#4b5563">
      Only want the automated part? <b>$12</b> covers the web monitoring for six months with every
      credible match reviewed by a person, the certificate and the sticker sheet. No outreach, no filing.
      <a href="${autoOfferUrl}" style="color:#166534;font-weight:bold;text-decoration:underline">Add the automatic search &rarr;</a>
    </p>

    <p style="margin:15px 0 0;padding-top:12px;border-top:1px solid #f3f4f6;font-size:12px;color:#6b7280">
      ${detailLine}
    </p>
    <p style="margin:8px 0 0;font-size:11.5px;color:#9ca3af">Your free listing stays online either way.</p>
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
