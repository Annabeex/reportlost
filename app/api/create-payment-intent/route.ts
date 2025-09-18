// app/api/create-payment-intent/route.ts
import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-06-20' as any,
});

export async function POST(req: NextRequest) {
  try {
    const { amount, reportId } = await req.json();

    // ✅ validation basique
    const numericAmount = Number(amount);
    if (!Number.isFinite(numericAmount) || numericAmount <= 0) {
      return NextResponse.json({ error: 'Invalid amount' }, { status: 400 });
    }

    const cents = Math.round(numericAmount * 100);

    const paymentIntent = await stripe.paymentIntents.create({
      amount: cents,
      currency: 'usd',
      automatic_payment_methods: { enabled: true },
      // description affichée dans le dashboard Stripe (facilite le support)
      description: reportId ? `ReportLost contribution for report #${reportId}` : 'ReportLost contribution',
      metadata: {
        ...(reportId ? { report_id: String(reportId) } : {}),
      },
    });

    return NextResponse.json({ clientSecret: paymentIntent.client_secret });
  } catch (error: any) {
    console.error('❌ Stripe error:', error);
    return NextResponse.json({ error: error.message ?? 'Stripe error' }, { status: 500 });
  }
}
