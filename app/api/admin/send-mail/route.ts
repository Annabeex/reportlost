// app/api/admin/send-mail/route.ts
import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function getBaseUrl(req: NextRequest): string {
  const env = (process.env.NEXT_PUBLIC_SITE_URL || "").trim();
  if (env) return env;

  const proto = req.headers.get("x-forwarded-proto") || "https";
  const host =
    req.headers.get("x-forwarded-host") ||
    req.headers.get("host") ||
    "reportlost.org";

  return `${proto}://${host}`;
}

function json(data: any, init?: ResponseInit) {
  const res = NextResponse.json(data, init);
  res.headers.set("Cache-Control", "no-store");
  return res;
}

export async function POST(req: NextRequest) {
  try {
    const ct = req.headers.get("content-type") || "";
    if (!ct.includes("application/json")) {
      return json({ ok: false, error: "Content-Type must be application/json" }, { status: 415 });
    }

    const body = await req.json().catch(() => null);
    if (!body) {
      return json({ ok: false, error: "Invalid JSON body" }, { status: 400 });
    }

    const base = getBaseUrl(req);
    const mailApiKey = (process.env.MAIL_API_KEY || "").trim();

    if (!mailApiKey) {
      return json({ ok: false, error: "MAIL_API_KEY not configured" }, { status: 500 });
    }

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 15000);

    const res = await fetch(`${base}/api/send-mail`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${mailApiKey}`,
      },
      body: JSON.stringify(body),
      signal: controller.signal,
    }).finally(() => clearTimeout(timeout));

    // on renvoie tel quel
    const text = await res.text().catch(() => "");
    return new NextResponse(text, {
      status: res.status,
      headers: {
        "Content-Type": res.headers.get("content-type") || "application/json",
        "Cache-Control": "no-store",
      },
    });
  } catch (e: any) {
    const msg =
      e?.name === "AbortError"
        ? "Upstream timeout"
        : String(e?.message || e);
    return json({ ok: false, error: msg }, { status: 500 });
  }
}

export async function OPTIONS() {
  // pas de CORS nécessaire ici (même origin), mais évite un 405 si navigateur envoie un preflight
  return new NextResponse(null, {
    status: 204,
    headers: {
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
      "Cache-Control": "no-store",
    },
  });
}
