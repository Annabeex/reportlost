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
    console.error("❌ Stripe signature verification failed:", err.message);
    return json({ error: `Webhook Error: ${err.message}` }, { status: 400 });
  }

  try {
    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    switch (event.type) {
      case "payment_intent.succeeded": {
        const pi = event.data.object as Stripe.PaymentIntent;
        const reportId = pi.metadata?.report_id || "";

        if (!reportId) {
          console.warn("⚠️ payment_intent.succeeded sans report_id en metadata");
          break;
        }

        const paidAmount = (pi.amount_received ?? pi.amount ?? 0) / 100;

        // 🔎 Lecture sécurisée
        const { data: row, error: readErr } = await supabaseAdmin
          .from("lost_items")
          .select("id, paid, payment_email_sent, contribution, email, first_name")
          .eq("id", reportId)
          .single();

        if (readErr) {
          console.error("❌ Supabase read error:", readErr.message);
          break;
        }
        if (!row) {
          console.warn("⚠️ Aucun report trouvé pour id =", reportId);
          break;
        }

        // ✅ Mise à jour paiement si nécessaire
        if (!row.paid || (row.contribution ?? 0) !== paidAmount) {
          const { error: upErr } = await supabaseAdmin
            .from("lost_items")
            .update({
              paid: true,
              paid_at: new Date().toISOString(),
              contribution: paidAmount,
            })
            .eq("id", reportId);

          if (upErr) {
            console.error("❌ Supabase update error:", upErr.message);
          }
        }

        // 📩 Email de confirmation (1 seule fois)
        if (!row.payment_email_sent) {
          try {
            const base =
              process.env.NEXT_PUBLIC_BASE_URL || new URL(req.url).origin;

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
              console.error("❌ /api/send-mail returned:", res.status, t);
            }

            await supabaseAdmin
              .from("lost_items")
              .update({ payment_email_sent: true })
              .eq("id", reportId);
          } catch (mailErr: any) {
            console.error("❌ Email sending failed:", mailErr.message);
          }
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
    console.error("❌ Webhook handler failed:", err.message);
    return json({ error: "Webhook handler failed" }, { status: 500 });
  }
}
