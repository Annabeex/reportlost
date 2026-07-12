// app/api/test-mail-direct/route.ts
// Diagnostic : envoie un mail via lib/mailer (sendMailDirect), c'est-à-dire
// EXACTEMENT le chemin utilisé par save-report et stripe-webhook.
// Usage : /api/test-mail-direct?to=adresse@example.com
import { NextRequest, NextResponse } from "next/server";
import { sendMailDirect } from "@/lib/mailer";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

export async function GET(req: NextRequest) {
  const to = req.nextUrl.searchParams.get("to");
  if (!to) return NextResponse.json({ error: "Missing ?to=" }, { status: 400 });

  const startedAt = Date.now();
  const ok = await sendMailDirect({
    to,
    subject: "🔧 Test sendMailDirect (chemin save-report)",
    text: `Test du chemin d'envoi direct (lib/mailer) — ${new Date().toISOString()}`,
  });

  return NextResponse.json({
    ok,
    ms: Date.now() - startedAt,
    transport: process.env.SMTP_HOST ? `SMTP_HOST=${process.env.SMTP_HOST}` : "zoho (fallback)",
    note: ok
      ? "Envoi réussi par le même chemin que save-report. Si les mails du formulaire manquent encore, le blocage est AVANT l'envoi (dedup/branche) ou APRÈS (réception)."
      : "Échec : regarde la ligne 'sendMailDirect error:' dans les logs Vercel pour la cause SMTP exacte.",
  });
}
