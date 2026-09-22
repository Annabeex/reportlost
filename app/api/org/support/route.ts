// app/api/org/support/route.ts — message d'un agent au support ReportLost
// (bug, question, demande de fonctionnalité). Part à support@reportlost.org
// avec tout le contexte utile ; « répondre » écrit directement à l'agent.
import { NextRequest, NextResponse } from "next/server";
import { getOrgContext } from "@/lib/orgAuth";
import { sendMailDirect } from "@/lib/mailer";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const KINDS: Record<string, string> = { bug: "Bug", feature: "Feature request", question: "Question" };

export async function POST(req: NextRequest) {
  const ctx = await getOrgContext(req);
  if (!ctx?.org) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const b = await req.json().catch(() => null);
  const kind = KINDS[String(b?.kind)] ? String(b.kind) : "question";
  const message = String(b?.message || "").trim().slice(0, 4000);
  const page = String(b?.page || "").trim().slice(0, 200);
  if (message.length < 10) return NextResponse.json({ error: "Please describe your request in a few words." }, { status: 400 });

  const ok = await sendMailDirect({
    to: "support@reportlost.org",
    subject: `[Portail] ${KINDS[kind]} · ${ctx.org.name}`,
    text: `${KINDS[kind]} envoyé depuis le portail établissements.

Établissement : ${ctx.org.name} (${ctx.org.type}${ctx.org.city ? `, ${ctx.org.city}` : ""}) · ${ctx.org.verified ? "validé" : "en attente"}
Agent : ${ctx.email} (${ctx.role || "?"})
Page : ${page || "—"}
Navigateur : ${(req.headers.get("user-agent") || "").slice(0, 200)}

MESSAGE
${message}`,
    fromName: "ReportLost portail",
    replyTo: ctx.email,
    noBcc: true,
  }).catch(() => false);

  if (!ok) return NextResponse.json({ error: "The message could not be sent. Please email support@reportlost.org directly." }, { status: 502 });
  return NextResponse.json({ ok: true });
}
