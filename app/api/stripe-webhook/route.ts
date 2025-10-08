// app/api/stripe-webhook/route.ts
import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { createClient } from "@supabase/supabase-js";

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
    // Supabase Admin client (service role) — attention : MUST be present in env
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
          .select("id, paid, payment_email_sent, contribution, email, first_name, public_id")
          .eq("id", idOrPublic)
          .maybeSingle();
        if (!byId.error && byId.data) return byId.data;
      } catch (e) {
        /* ignore */
      }

      // fallback: by public_id
      try {
        const byPub = await supabaseAdmin
          .from("lost_items")
          .select("id, paid, payment_email_sent, contribution, email, first_name, public_id")
          .eq("public_id", idOrPublic)
          .maybeSingle();
        if (!byPub.error && byPub.data) return byPub.data;
      } catch (e) {
        /* ignore */
      }
      return null;
    }

    switch (event.type) {
      case "payment_intent.succeeded": {
        const pi = event.data.object as Stripe.PaymentIntent;
        const metaReportId = String(pi.metadata?.report_id ?? "").trim();
        const metaPublicId = String(pi.metadata?.report_public_id ?? "").trim();

        // Find the row: try meta.report_id then meta.report_public_id
        let row: any = null;
        if (metaReportId) {
          row = await findRowByIdOrPublic(metaReportId);
        }
        if (!row && metaPublicId) {
          row = await findRowByIdOrPublic(metaPublicId);
        }
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
            if (upErr) {
              console.error("❌ Supabase update error:", upErr);
            }
          }
        } catch (e) {
          console.error("❌ Exception while updating payment status:", e);
        }

        // Send confirmation email once
        try {
          if (!row.payment_email_sent && row.email) {
            const base = process.env.NEXT_PUBLIC_BASE_URL || new URL(req.url).origin;

            const controller = new AbortController();
            const timeout = setTimeout(() => controller.abort(), 8000); // max 8s

            const res = await fetch(`${base}/api/send-mail`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                to: row.email,
                subject: "💙 Contribution received — manual follow-up started",
                text: `Hello ${row.first_name || "there"}, we confirm we received your contribution of $${paidAmount}.`,
                html: `<p>Hello <b>${row.first_name || "there"}</b>,<br/>We confirm we received your contribution of <b>$${paidAmount}</b>.</p>`,
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
                await supabaseAdmin.from("lost_items").update({ payment_email_sent: true }).eq("id", reportId);
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
