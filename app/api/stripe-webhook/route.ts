// app/api/stripe-webhook/route.ts
import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { createClient } from "@supabase/supabase-js";
import crypto from "crypto";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2024-06-20" as any,
});

export const dynamic = "force-dynamic"; // jamais de cache
export const runtime = "nodejs";        // obligatoire pour Stripe

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

export async function POST(req: NextRequest) {
  const sig = req.headers.get("stripe-signature");
  if (!sig) {
    return json({ error: "Missing Stripe signature" }, { status: 400 });
  }

  let event: Stripe.Event;
  try {
    const body = await req.text(); // raw body requis
    event = stripe.webhooks.constructEvent(
      body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET!
    );
  } catch (err: any) {
    console.error("❌ Stripe signature verification failed:", err.message || err);
    return json({ error: `Webhook Error: ${err.message || err}` }, { status: 400 });
  }

  try {
    // Supabase Admin client (service role)
    const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;
    const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // helpers to look up row by id or public_id
    async function findRowByIdOrPublic(idOrPublic?: string | null) {
      if (!idOrPublic) return null;
      // try by id
      try {
        const byId = await supabaseAdmin
          .from("lost_items")
          .select("id, paid, payment_email_sent, contribution, email, first_name, public_id, title, date, city")
          .eq("id", idOrPublic)
          .maybeSingle();
        if (!byId.error && byId.data) return byId.data;
      } catch { /* ignore */ }

      // fallback: by public_id
      try {
        const byPub = await supabaseAdmin
          .from("lost_items")
          .select("id, paid, payment_email_sent, contribution, email, first_name, public_id, title, date, city")
          .eq("public_id", idOrPublic)
          .maybeSingle();
        if (!byPub.error && byPub.data) return byPub.data;
      } catch { /* ignore */ }

      return null;
    }

    switch (event.type) {
      case "payment_intent.succeeded": {
        const pi = event.data.object as Stripe.PaymentIntent;
        const metaReportId = String(pi.metadata?.report_id ?? "").trim();
        const metaPublicId = String(pi.metadata?.report_public_id ?? "").trim();

        // Find the row: try meta.report_id then meta.report_public_id
        let row: any = null;
        if (metaReportId) row = await findRowByIdOrPublic(metaReportId);
        if (!row && metaPublicId) row = await findRowByIdOrPublic(metaPublicId);

        if (!row) {
          console.warn("⚠️ payment_intent.succeeded: no report found for metadata", { metaReportId, metaPublicId });
          return json({ received: true }); // ack the webhook anyway
        }

        const reportId = String(row.id);
        const paidAmount = (pi.amount_received ?? pi.amount ?? 0) / 100;

        // Update payment fields if needed
        try {
          const needsUpdate = !row.paid || Number(row.contribution ?? 0) !== Number(paidAmount);
          if (needsUpdate) {
            const { error: upErr } = await supabaseAdmin
              .from("lost_items")
              .update({
                paid: true,
                paid_at: new Date().toISOString(),
                contribution: paidAmount,
              })
              .eq("id", reportId);
            if (upErr) console.error("❌ Supabase update error:", upErr);
          }
        } catch (e) {
          console.error("❌ Exception while updating payment status:", e);
        }

        // Send confirmation email once, with institutional tone + 5-digit reference
        try {
          if (!row.payment_email_sent && row.email) {
            const base = process.env.NEXT_PUBLIC_SITE_URL || new URL(req.url).origin;
            const ref5 = getReferenceCode(row.public_id, reportId);

            const subject = "✅ Payment received — your report has been published";
            const text = `Hello ${row.first_name || ""},

Thank you for your payment. Your lost item report has been published on reportlost.org.

What's next:
• Automatic search (AI) is starting now.
• A team member will contact you shortly to begin the manual investigation.
• If you have no news within 24 hours, please check your spam/junk folder.

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

    <p style="margin:0 0 10px"><b>What's next</b></p>
    <ul style="margin:0 0 16px;padding-left:18px">
      <li>Automatic search (AI) is <b>starting now</b>.</li>
      <li>A team member will contact you shortly to begin the manual investigation.</li>
      <li>If you have no news within <b>24 hours</b>, please check your <b>spam/junk folder</b>.</li>
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

            const controller = new AbortController();
            const timeout = setTimeout(() => controller.abort(), 8000); // max 8s

            const res = await fetch(`${base}/api/send-mail`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                to: row.email,
                subject,
                text,
                html,
              }),
              signal: controller.signal,
            });

            clearTimeout(timeout);

            if (!res.ok) {
              const t = await res.text().catch(() => "");
              console.error("❌ /api/send-mail returned non-ok:", res.status, t);
            } else {
              // mark payment_email_sent = true
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
