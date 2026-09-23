// app/api/public/send-publication-email/route.ts
//
// Appelée par le navigateur quand le visiteur atteint l'écran final gratuit.
// Le contenu du mail vit dans lib/publicationMail.ts, pour que le rattrapage
// côté serveur (/api/publication-mail-catchup) envoie exactement le même.
import { NextRequest, NextResponse } from "next/server";
import { sendPublicationMail } from "@/lib/publicationMail";

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

    const r = await sendPublicationMail(
      String(body?.reportId || "").trim(),
      getBaseUrl(req),
      body?.email ? String(body.email) : undefined,
    );

    if (!r.ok) return json({ ok: false, error: r.error }, { status: r.status });
    return json(r, { status: 200 });
  } catch (e: any) {
    return json({ ok: false, error: e?.message || String(e) }, { status: 500 });
  }
}
