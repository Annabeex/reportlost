// app/api/public/send-publication-email/route.ts
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

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

    const reportId = (body?.reportId || "").trim();
    if (!reportId) return json({ ok: false, error: "Missing reportId" }, { status: 400 });

    const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;
    if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
      return json({ ok: false, error: "Server not configured" }, { status: 500 });
    }

    const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // On lit la ligne (PII minimale)
    const { data: row, error } = await supabaseAdmin
      .from("lost_items")
      .select("id, mail_sent, email, first_name, title, date, city, public_id")
      .eq("id", reportId)
      .maybeSingle();

    if (error) return json({ ok: false, error: error.message }, { status: 500 });
    if (!row) return json({ ok: false, error: "Report not found" }, { status: 404 });

    // Optionnel : vérif email (évite qu’un tiers spam un reportId)
    if (body?.email && row.email && body.email.trim().toLowerCase() !== String(row.email).trim().toLowerCase()) {
      return json({ ok: false, error: "Email mismatch" }, { status: 403 });
    }

    // Déjà envoyé → on ne renvoie pas
    if (row.mail_sent) return json({ ok: true, skipped: true }, { status: 200 });

    // Construire l’email (reprend ton ton actuel)
    const base = getBaseUrl(req);
    const contributeUrl = `${base}/report?go=contribute&rid=${encodeURIComponent(reportId)}`;
    const ref5 = String(row.public_id || "").trim();

    const subject = "✅ Publish your report to start the search";
    const text = `Hello ${row.first_name || ""},

We have published your lost item report on reportlost.org.

You can upgrade your assistance level anytime here:
${contributeUrl}

Your report details:
- Item: ${row.title || ""}
- Date: ${row.date || ""}
- City: ${row.city || ""}
${ref5 ? `- Reference code: ${ref5}\n` : ""}

Thank you for using ReportLost.`;

    const html = `
<div style="font-family:Arial,Helvetica,sans-serif;max-width:620px;margin:auto;border:1px solid #e5e7eb;border-radius:10px;overflow:hidden;background:#fff">
  <div style="background:linear-gradient(90deg,#2C7A4A,#3FAE68);color:#fff;padding:18px 16px;text-align:center;">
    <h2 style="margin:0;font-size:22px;letter-spacing:.3px">ReportLost</h2>
    <p style="margin:8px 0 0;font-size:14px;opacity:.95">✅ Your report is published</p>
  </div>
  <div style="padding:20px;color:#111827;line-height:1.6">
    <p style="margin:0 0 12px">Hello <b>${row.first_name || ""}</b>,</p>
    <p style="margin:0 0 14px">
      Your report is published on <a href="${base}" style="color:#2C7A4A;text-decoration:underline">reportlost.org</a>.
    </p>

    <p style="margin:0 0 8px"><b>Your report details</b></p>
    <ul style="margin:0 16px 18px;padding-left:18px">
      <li><b>Item:</b> ${row.title || ""}</li>
      <li><b>Date:</b> ${row.date || ""}</li>
      <li><b>City:</b> ${row.city || ""}</li>
      ${ref5 ? `<li><b>Reference code:</b> ${ref5}</li>` : ""}
    </ul>

    <p style="margin:0 0 18px">
      <a href="${contributeUrl}"
         style="display:inline-block;background:linear-gradient(90deg,#2C7A4A,#3FAE68);color:#fff;padding:12px 18px;border-radius:10px;text-decoration:none;font-weight:700">
        Upgrade my assistance level
      </a>
    </p>

    <p style="margin:0;font-size:13px;color:#6b7280">Thank you for using ReportLost.</p>
  </div>
</div>`;

    // Appel interne à /api/send-mail avec la clé serveur
    const mailApiKey = (process.env.MAIL_API_KEY || "").trim();
    const sendRes = await fetch(`${base}/api/send-mail`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(mailApiKey ? { Authorization: `Bearer ${mailApiKey}` } : {}),
      },
      body: JSON.stringify({
        to: row.email,
        subject,
        text,
        html,
        fromName: "ReportLost",
        publicId: ref5 || undefined,
        kind: "publication",
      }),
    });

    if (!sendRes.ok) {
      const t = await sendRes.text().catch(() => "");
      return json({ ok: false, error: "send-mail failed", status: sendRes.status, body: t }, { status: 502 });
    }

    // Marque DB
    const { error: upErr } = await supabaseAdmin
      .from("lost_items")
      .update({ mail_sent: true })
      .eq("id", reportId);

    if (upErr) {
      // email envoyé mais flag non persisté : on renvoie ok quand même
      return json({ ok: true, warning: "mail sent but mail_sent not persisted" }, { status: 200 });
    }

    return json({ ok: true }, { status: 200 });
  } catch (e: any) {
    return json({ ok: false, error: e?.message || String(e) }, { status: 500 });
  }
}
