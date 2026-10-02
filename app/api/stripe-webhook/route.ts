// app/api/stripe-webhook/route.ts
import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { createClient } from "@supabase/supabase-js";
import crypto from "crypto";
import { sendMailDirect } from "@/lib/mailer";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2024-06-20" as any,
});

export const dynamic = "force-dynamic"; // jamais de cache
export const runtime = "nodejs"; // obligatoire pour Stripe

function json(data: any, init?: ResponseInit) {
  const res = NextResponse.json(data, init);
  res.headers.set("Cache-Control", "no-store");
  return res;
}

/* ----- Helpers ----- */

// 5 chiffres dérivés d'un id (fallback stable)
function refCode5FromId(input: string): string {
  const b = crypto.createHash("sha1").update(input).digest();
  const n = b.readUInt32BE(0);
  return String((n % 90000) + 10000).padStart(5, "0");
}

// Priorité au public_id si déjà au format 5 chiffres, sinon fallback depuis id
function getReferenceCode(public_id: string | null | undefined, id: string): string {
  if (public_id && /^\d{5}$/.test(public_id)) return public_id;
  return refCode5FromId(id);
}

// (import de l'envoi direct)
function getBaseUrl(req: NextRequest): string {
  const env = (process.env.NEXT_PUBLIC_SITE_URL || "").trim();
  // ⚠️ Une valeur localhost en prod casserait les appels internes (mails post-paiement)
  const isLocalEnv = /localhost|127\.0\.0\.1/i.test(env);
  if (env && (!isLocalEnv || process.env.NODE_ENV !== "production")) return env;

  // Vercel/proxy headers
  const proto = req.headers.get("x-forwarded-proto") || "https";
  const host =
    req.headers.get("x-forwarded-host") || req.headers.get("host") || "reportlost.org";
  return `${proto}://${host}`;
}

export async function POST(req: NextRequest) {
  const sig = req.headers.get("stripe-signature");
  if (!sig) {
    return json({ error: "Missing Stripe signature" }, { status: 400 });
  }

  let event: Stripe.Event;
  try {
    const body = await req.text(); // raw body requis
    event = stripe.webhooks.constructEvent(body, sig, process.env.STRIPE_WEBHOOK_SECRET!);
  } catch (err: any) {
    console.error("❌ Stripe signature verification failed:", err.message || err);
    return json({ error: `Webhook Error: ${err.message || err}` }, { status: 400 });
  }

  try {
    // Supabase Admin client (service role)
    const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;
    const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // helper: look up row by id or public_id
    async function findRowByIdOrPublic(idOrPublic?: string | null) {
      if (!idOrPublic) return null;

      // try by id
      try {
        const byId = await supabaseAdmin
          .from("lost_items")
          .select(
            "id, paid, payment_email_sent, contribution, email, first_name, public_id, title, date, city, case_token, search_status, next_search_at"
          )
          .eq("id", idOrPublic)
          .maybeSingle();
        if (!byId.error && byId.data) return byId.data;
      } catch {
        /* ignore */
      }

      // fallback: by public_id
      try {
        const byPub = await supabaseAdmin
          .from("lost_items")
          .select(
            "id, paid, payment_email_sent, contribution, email, first_name, public_id, title, date, city, case_token, search_status, next_search_at"
          )
          .eq("public_id", idOrPublic)
          .maybeSingle();
        if (!byPub.error && byPub.data) return byPub.data;
      } catch {
        /* ignore */
      }

      return null;
    }

    switch (event.type) {
      case "payment_intent.succeeded": {
        const pi = event.data.object as Stripe.PaymentIntent;

        const metaReportId = String(pi.metadata?.report_id ?? "").trim();
        const metaPublicId = String(pi.metadata?.report_public_id ?? "").trim();

        // Find row
        let row: any = null;
        if (metaReportId) row = await findRowByIdOrPublic(metaReportId);
        if (!row && metaPublicId) row = await findRowByIdOrPublic(metaPublicId);

        if (!row) {
          console.warn("⚠️ payment_intent.succeeded: no report found for metadata", {
            metaReportId,
            metaPublicId,
          });
          return json({ received: true }); // ack anyway
        }

        const reportId = String(row.id);
        const paidAmount = (pi.amount_received ?? pi.amount ?? 0) / 100;

        // La veille démarre au paiement pour TOUTE formule payante. Elle était
        // Start monitoring for any paid search service. The admin override remains
        // available for exceptions.
        const hasPaidSearch = paidAmount > 0;

        // Update payment fields if needed
        try {
          const patch: Record<string, any> = {};

          if (!row.paid || Number(row.contribution ?? 0) !== Number(paidAmount)) {
            patch.paid = true;
            patch.paid_at = new Date().toISOString();
            patch.contribution = paidAmount;
          }

          // next_search_at n'a pas de valeur par défaut, et le worker filtre sur
          // next_search_at <= now() : tant qu'elle est NULL, le dossier n'est
          // jamais sélectionné. On l'amorce ici pour les dossiers automatiques.
          if (
            hasPaidSearch &&
            !(row as any).next_search_at &&
            (row as any).search_status !== "excluded"
          ) {
            patch.next_search_at = new Date().toISOString();
            patch.search_status = "active";
          }

          if (Object.keys(patch).length) {
            const { error: upErr } = await supabaseAdmin
              .from("lost_items")
              .update(patch)
              .eq("id", reportId);
            if (upErr) console.error("❌ Supabase update error:", upErr);
          }
        } catch (e) {
          console.error("❌ Exception while updating payment status:", e);
        }

        // Send confirmation email once
        try {
          if (!row.payment_email_sent && row.email) {
            const base = getBaseUrl(req);
            const ref5 = getReferenceCode(row.public_id, reportId);

            const caseUrl =
              (row as any).case_token && row.public_id
                ? `${base}/case/${encodeURIComponent(String(row.public_id))}?t=${encodeURIComponent(
                    String((row as any).case_token)
                  )}`
                : "";

            const hasTeamAssistedSearch = paidAmount >= 25;
            const isAutoPlan = !hasTeamAssistedSearch;
            const paidServiceLabel = hasTeamAssistedSearch ? "Team-assisted search" : "Automatic search";
            const monitoringMonths = hasTeamAssistedSearch ? 12 : 6;
            const subject = `Payment received — ${paidServiceLabel} is active`;
            const text = `Hello ${row.first_name || ""},

Your lost-item report has been published on ReportLost.org, and ${paidServiceLabel} is active.

Service details:
- Public-web monitoring runs for ${monitoringMonths} months. Potential matches are reviewed before notification.
${hasTeamAssistedSearch ? "- The team carries out relevant local outreach and can publish a notice for local groups. Reports are sent where third-party filing is accepted; otherwise, contact details and instructions are provided.\n" : "- Local outreach and a notice are not included with automatic search.\n"}
- The service includes a loss report confirmation and a printable QR sticker sheet.

Your report details:
- Item: ${row.title || ""}
- Date: ${row.date || ""}
- City: ${row.city || ""}
- Reference code: ${ref5}

Thank you for using ReportLost.`;

            const html = `
<div style="font-family:Arial,Helvetica,sans-serif;max-width:620px;margin:auto;border:1px solid #e5e7eb;border-radius:10px;overflow:hidden;background:#fff">
  <div style="background:linear-gradient(90deg,#2C7A4A,#3FAE68);color:#fff;padding:18px 16px;text-align:center;">
    <h2 style="margin:0;font-size:22px;letter-spacing:.3px">ReportLost</h2>
    <p style="margin:8px 0 0;font-size:14px;opacity:.95">✅ Payment received — your report has been published</p>
  </div>

  <div style="padding:20px;color:#111827;line-height:1.6">
    <p style="margin:0 0 12px">Hello <b>${row.first_name || ""}</b>,</p>

    <p style="margin:0 0 12px">
      Thank you for your payment. Your lost item report has been published on
      <a href="${base}" style="color:#2C7A4A;text-decoration:underline">reportlost.org</a>.
    </p>

    <p style="margin:0 0 10px"><b>Service details</b></p>
    <ul style="margin:0 0 16px;padding-left:18px">
      <li>Public-web monitoring runs for ${monitoringMonths} months. Potential matches are reviewed before notification.</li>
      ${hasTeamAssistedSearch ? "<li>The team carries out relevant local outreach and can publish a notice for local groups. Reports are sent where third-party filing is accepted; otherwise, contact details and instructions are provided.</li>" : "<li>Local outreach and a notice are not included with automatic search.</li>"}
      <li>A loss report confirmation and a printable QR sticker sheet are included.</li>
    </ul>

    <p style="margin:0 0 8px"><b>Your report details</b></p>
    <ul style="margin:0 16px 18px;padding-left:18px">
      <li><b>Item:</b> ${row.title || ""}</li>
      <li><b>Date:</b> ${row.date || ""}</li>
      <li><b>City:</b> ${row.city || ""}</li>
      <li><b>Reference code:</b> ${ref5}</li>
    </ul>

    <p style="margin:18px 0 0;font-size:13px;color:#6b7280">Thank you for using ReportLost.</p>
  </div>
</div>`;

            // --- Formule automatique : autre message, et surtout le lien privé
            // vers la page de suivi, seul chemin de retour puisqu'elle est
            // verrouillée par le case_token. ---
            const autoText = `Hello ${row.first_name || ""},

Your ${paidServiceLabel} is active.

Service details, for ${monitoringMonths} months:
- Public-web checks run daily during the first week, then weekly and monthly. Potential matches are reviewed before notification.
- Your loss report confirmation, downloadable at any time. It is not an official document and does not replace a police report.
- Your QR sticker sheet, a PDF to print yourself on adhesive paper.
${hasTeamAssistedSearch ? "- Relevant local outreach and a notice for relevant local groups. Reports are sent where third-party filing is accepted; otherwise, contact details and instructions are provided.\n" : "- Local outreach and a notice are not included with automatic search.\n"}

${caseUrl ? `Open your private case page: ${caseUrl}\n` : ""}

Your report details:
- Item: ${row.title || ""}
- Date: ${row.date || ""}
- City: ${row.city || ""}
- Reference code: ${ref5}

Thank you for using ReportLost.`;

            const autoHtml = `
<div style="font-family:Arial,Helvetica,sans-serif;max-width:620px;margin:auto;border:1px solid #e5e7eb;border-radius:10px;overflow:hidden;background:#fff">
  <div style="background:linear-gradient(90deg,#2C7A4A,#3FAE68);color:#fff;padding:18px 16px;text-align:center;">
    <h2 style="margin:0;font-size:22px;letter-spacing:.3px">ReportLost</h2>
    <p style="margin:8px 0 0;font-size:14px;opacity:.95">✅ Payment received — your search is running</p>
  </div>
  <div style="padding:20px;color:#111827;line-height:1.65">
    <p style="margin:0 0 12px">Hello <b>${row.first_name || ""}</b>,</p>
    <p style="margin:0 0 12px">Your <b>${paidServiceLabel}</b> is active.</p>

    <p style="margin:0 0 8px"><b>Service details, for ${monitoringMonths} months</b></p>
    <ul style="margin:0 0 16px;padding-left:18px">
      <li>Public-web checks run daily during the first week, then weekly and monthly. Potential matches are reviewed before notification.</li>
      <li>Your <b>loss report confirmation</b>, downloadable at any time. It is not an official document and does not replace a police report.</li>
      <li>Your <b>QR sticker sheet</b>, a PDF to print yourself on adhesive paper.</li>
      ${hasTeamAssistedSearch ? "<li>Relevant local outreach and a notice for relevant local groups. Reports are sent where third-party filing is accepted; otherwise, contact details and instructions are provided.</li>" : "<li>Local outreach and a notice are not included with automatic search.</li>"}
    </ul>

    ${
      caseUrl
        ? `<div style="margin:0 0 8px;text-align:center">
             <a href="${caseUrl}" style="display:inline-block;background:linear-gradient(90deg,#2C7A4A,#3FAE68);color:#fff;padding:12px 20px;border-radius:10px;text-decoration:none;font-weight:700">Open my case page</a>
           </div>
           <p style="margin:0 0 16px;font-size:12.5px;color:#6b7280;text-align:center">This is a private link to your case page.</p>`
        : ""
    }

    <p style="margin:0 0 14px;font-size:13px;color:#6b7280">ReportLost is independent of public agencies. Recovery cannot be guaranteed.</p>

    <p style="margin:0 0 8px"><b>Your report details</b></p>
    <ul style="margin:0 16px 18px;padding-left:18px">
      <li><b>Item:</b> ${row.title || ""}</li>
      <li><b>Date:</b> ${row.date || ""}</li>
      <li><b>City:</b> ${row.city || ""}</li>
      <li><b>Reference code:</b> ${ref5}</li>
    </ul>

    <p style="margin:18px 0 0;font-size:13px;color:#6b7280">Thank you for using ReportLost.</p>
  </div>
</div>`;

            // ✅ Envoi DIRECT via SMTP (lib/mailer) : plus d'appel HTTP interne fragile
            const okMail = await sendMailDirect({
              to: row.email,
              subject,
              text: isAutoPlan ? autoText : text,
              html: isAutoPlan ? autoHtml : html,
            });

            if (!okMail) {
              console.error("❌ sendMailDirect failed for", reportId);
            } else {
              try {
                await supabaseAdmin
                  .from("lost_items")
                  .update({ payment_email_sent: true })
                  .eq("id", reportId);
              } catch (e) {
                console.warn("Could not persist payment_email_sent:", e);
              }
            }
          }
        } catch (mailErr: any) {
          console.error("❌ Email sending failed:", mailErr?.message || mailErr);
        }

        break;
      }

      case "payment_intent.payment_failed": {
        const pi = event.data.object as Stripe.PaymentIntent;
        console.warn("⚠️ Payment failed:", pi.id);
        break;
      }

      default:
        console.log("ℹ️ Unhandled event type:", event.type);
    }

    return json({ received: true });
  } catch (err: any) {
    console.error("❌ Webhook handler failed:", err?.message || err);
    return json({ error: "Webhook handler failed" }, { status: 500 });
  }
}
