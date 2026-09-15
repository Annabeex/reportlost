// app/api/public/send-publication-email/route.ts
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { sendMailDirect } from "@/lib/mailer";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function json(data: any, init?: ResponseInit) {
  const res = NextResponse.json(data, init);
  res.headers.set("Cache-Control", "no-store");
  return res;
}

function getBaseUrl(req: NextRequest): string {
  const env = (process.env.NEXT_PUBLIC_SITE_URL || "").trim();
  if (env) return env;
  const proto = req.headers.get("x-forwarded-proto") || "https";
  const host = req.headers.get("x-forwarded-host") || req.headers.get("host") || "reportlost.org";
  return `${proto}://${host}`;
}

export async function POST(req: NextRequest) {
  try {
    const ct = req.headers.get("content-type") || "";
    if (!ct.includes("application/json")) {
      return json({ ok: false, error: "Content-Type must be application/json" }, { status: 415 });
    }

    const body = (await req.json().catch(() => null)) as
      | { reportId?: string; email?: string }
      | null;

    const reportId = (body?.reportId || "").trim();
    if (!reportId) return json({ ok: false, error: "Missing reportId" }, { status: 400 });

    const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;
    if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
      return json({ ok: false, error: "Server not configured" }, { status: 500 });
    }

    const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // On lit la ligne (PII minimale)
    const { data: row, error } = await supabaseAdmin
      .from("lost_items")
      .select("id, publication_mail_sent, email, first_name, title, date, city, public_id")
      .eq("id", reportId)
      .maybeSingle();

    if (error) return json({ ok: false, error: error.message }, { status: 500 });
    if (!row) return json({ ok: false, error: "Report not found" }, { status: 404 });

    // Optionnel : vérif email (évite qu’un tiers spam un reportId)
    if (body?.email && row.email && body.email.trim().toLowerCase() !== String(row.email).trim().toLowerCase()) {
      return json({ ok: false, error: "Email mismatch" }, { status: 403 });
    }

    // ⚠️ Ce garde-fou lisait `mail_sent`, qui est posé par /api/save-report au
    // moment où le brouillon est enregistré — donc AVANT le choix de formule.
    // Résultat : ce mail-ci n'était jamais envoyé, et les dépôts gratuits ne
    // recevaient que le mail « one step away from going live », qui leur
    // annonçait à tort que leur annonce n'était pas publiée.
    // Chaque mail a désormais son propre drapeau.
    if (row.publication_mail_sent) return json({ ok: true, skipped: true }, { status: 200 });

    // Construire l’email (reprend ton ton actuel)
    const base = getBaseUrl(req);
    const contributeUrl = `${base}/report?go=contribute&rid=${encodeURIComponent(reportId)}`;
    // Rattrapage : réservé à ceux qui ont déjà choisi l'annonce gratuite, donc
    // sans effet de cannibalisation sur la formule à 25 $.
    const autoOfferUrl = `${contributeUrl}&offer=auto`;
    const ref5 = String(row.public_id || "").trim();

    const subject = "Your report is published — the search hasn't started yet";
    // Registre : la publication gratuite n'est pas un aboutissement, c'est un
    // état intermédiaire. L'ancien gabarit disait le contraire de son propre
    // texte — bandeau vert, coche, « Good news » — et la personne refermait en
    // croyant que tout était réglé. L'ambre signale ce qui reste à faire ; le
    // vert reste réservé à l'action (le bouton).
    const detailLine = [row.title || "", row.date ? `lost ${row.date}` : "", row.city || ""]
      .filter(Boolean)
      .join(" · ");

    const text = `Hello ${row.first_name || ""},

[x] Published in the public database
[ ] The search has not started — nothing is being done on your case at this stage.

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
      <td style="padding:14px 18px 4px;font-size:14px;line-height:1.45;color:#4b5563">
        <span style="color:#166534;font-weight:bold">&#10003;</span>&nbsp; Published in the public database
      </td>
    </tr>
    <tr>
      <td style="padding:5px 18px 14px;font-size:14px;line-height:1.45;color:#78350f">
        <b>&#9675;&nbsp; The search has not started</b>
        <div style="margin:3px 0 0 20px;font-size:12.5px;color:#92400e">Nothing is being done on your case at this stage.</div>
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
    if (!sent) return json({ ok: false, error: "send failed" }, { status: 502 });

    // Marque DB
    const { error: upErr } = await supabaseAdmin
      .from("lost_items")
      .update({ publication_mail_sent: true })
      .eq("id", reportId);

    if (upErr) {
      // email envoyé mais flag non persisté : on renvoie ok quand même
      return json({ ok: true, warning: "mail sent but publication_mail_sent not persisted" }, { status: 200 });
    }

    return json({ ok: true }, { status: 200 });
  } catch (e: any) {
    return json({ ok: false, error: e?.message || String(e) }, { status: 500 });
  }
}
