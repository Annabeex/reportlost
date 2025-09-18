// app/api/stripe-webhook/route.ts
import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';

// ⚠️ Client admin (Service Role) pour écrire côté serveur (ne jamais exposer au front)
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-06-20' as any,
});

export const dynamic = 'force-dynamic'; // pas de cache
export const runtime = 'nodejs';        // signature Stripe => Node runtime obligatoire

export async function POST(req: NextRequest) {
  const sig = req.headers.get('stripe-signature');
  if (!sig) {
    return NextResponse.json({ error: 'Missing Stripe signature' }, { status: 400 });
  }

  let event: Stripe.Event;

  // Stripe exige le raw body → utiliser req.text()
  try {
    const body = await req.text();
    event = stripe.webhooks.constructEvent(body, sig, process.env.STRIPE_WEBHOOK_SECRET!);
  } catch (err: any) {
    console.error('❌ Webhook signature verification failed:', err.message);
    return NextResponse.json({ error: `Webhook Error: ${err.message}` }, { status: 400 });
  }

  try {
    switch (event.type) {
      case 'payment_intent.succeeded': {
        const pi = event.data.object as Stripe.PaymentIntent;

        // On récupère l'id du report passé en metadata quand tu crées le PaymentIntent côté front
        const reportId = pi.metadata?.report_id || '';
        if (!reportId) {
          console.warn('⚠️ payment_intent.succeeded sans report_id en metadata');
          break;
        }

        // Montant reçu en dollars (Stripe renvoie en cents)
        const paidAmount = (pi.amount_received ?? pi.amount ?? 0) / 100;

        // 1) Lire la ligne pour connaître l’état (déduplication)
        const { data: row, error: readErr } = await supabaseAdmin
          .from('lost_items')
          .select('id, paid, payment_email_sent, contribution, email, first_name')
          .eq('id', reportId)
          .single();

        if (readErr) {
          console.error('❌ Supabase read error:', readErr);
          break;
        }
        if (!row) {
          console.warn('⚠️ Aucun report trouvé pour id =', reportId);
          break;
        }

        // 2) Marquer payé + contribution (idempotent)
        if (!row.paid || (row.contribution ?? 0) !== paidAmount) {
          const { error: upErr } = await supabaseAdmin
            .from('lost_items')
            .update({
              paid: true,
              paid_at: new Date().toISOString(),
              contribution: paidAmount,
            })
            .eq('id', reportId);

          if (upErr) {
            console.error('❌ Supabase update paid error:', upErr);
            // on continue quand même à tenter l’email si pas envoyé, mais log utile
          }
        }

        // 3) Envoyer l’email de confirmation paiement une seule fois
        if (!row.payment_email_sent) {
          try {
            const base =
              process.env.NEXT_PUBLIC_BASE_URL ||
              // fallback local
              `http://localhost:${process.env.PORT || 3000}`;

            const to = row.email;
            const firstName = row.first_name || 'there';

            const res = await fetch(`${base}/api/send-mail`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                to,
                subject: '💙 Contribution received — manual follow-up started',
                text: `Hello ${firstName},

We confirm we have received your contribution of $${paidAmount}.
Your report will now receive a 30-day manual follow-up.

What happens next:
• We review your report and check key details.
• We distribute your case to relevant partners (transport, venues, platforms).
• We optimize search visibility and set up targeted alerts.
• You’ll receive updates if we find a match or need extra info.

If you have updates (new clues, corrected details, extra photo), just reply to this email.

Thank you for supporting ReportLost.`,
                html: `
                  <div style="font-family:Arial,Helvetica,sans-serif;max-width:620px;margin:auto;border:1px solid #e5e7eb;border-radius:10px;overflow:hidden">
                    <div style="background:linear-gradient(90deg,#0f766e,#065f46);color:#fff;padding:20px 16px;text-align:center;">
                      <h2 style="margin:0;font-size:22px;letter-spacing:.3px">ReportLost</h2>
                    </div>
                    <div style="padding:22px;color:#111827;line-height:1.55">
                      <p style="margin:0 0 12px">Hello <b>${firstName}</b>,</p>
                      <p style="margin:0 0 14px">
                        We confirm we have received your contribution of
                        <b>$${paidAmount}</b>. Your report will now receive a
                        <b>30-day manual follow-up</b>.
                      </p>
                      <p style="margin:10px 0 6px;"><b>What happens next</b></p>
                      <ul style="margin:0 0 14px;padding-left:18px">
                        <li>We review your report and check key details.</li>
                        <li>We distribute your case to relevant partners (transport, venues, platforms).</li>
                        <li>We optimize search visibility and set up targeted alerts.</li>
                        <li>You’ll receive updates if we find a match or need extra info.</li>
                      </ul>
                      <p style="margin:0 0 16px;">
                        If you have updates (new clues, corrected details, extra photo),
                        just reply to this email.
                      </p>
                      <p style="margin:18px 0 0;font-size:13px;color:#6b7280">
                        Thank you for supporting ReportLost.
                      </p>
                    </div>
                  </div>`,
              }),
            });

            if (!res.ok) {
              const t = await res.text().catch(() => '');
              console.error('❌ /api/send-mail returned non-OK:', res.status, t);
            }

            // 4) Marquer le flag pour éviter tout second envoi
            const { error: flagErr } = await supabaseAdmin
              .from('lost_items')
              .update({ payment_email_sent: true })
              .eq('id', reportId);

            if (flagErr) {
              console.error('❌ Supabase update payment_email_sent error:', flagErr);
            }
          } catch (mailErr) {
            console.error('❌ Failed to send payment confirmation email (webhook):', mailErr);
          }
        }

        break;
      }

      case 'payment_intent.payment_failed': {
        const pi = event.data.object as Stripe.PaymentIntent;
        console.warn('⚠️ Payment failed:', pi.id);
        break;
      }

      default:
        console.log(`ℹ️ Unhandled event type: ${event.type}`);
    }

    return NextResponse.json({ received: true });
  } catch (err: any) {
    console.error('❌ Webhook handler failed:', err.message);
    return NextResponse.json({ error: 'Webhook handler failed' }, { status: 500 });
  }
}
