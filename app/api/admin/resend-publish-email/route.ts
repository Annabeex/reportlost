// app/api/admin/resend-publish-email/route.ts
import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";

/* Helpers repris de save-report */
function refCode5FromId(input: string): string {
  const b = crypto.createHash("sha1").update(input).digest();
  const n = b.readUInt32BE(0);
  return String((n % 90000) + 10000).padStart(5, "0");
}
function getReferenceCode(public_id: string | null | undefined, id: string): string {
  if (public_id && /^\d{5}$/.test(public_id)) return public_id;
  return refCode5FromId(id);
}
function getBaseUrl(req: NextRequest): string {
  const env = (process.env.NEXT_PUBLIC_SITE_URL || "").trim();
  if (env) return env;
  const proto = req.headers.get("x-forwarded-proto") || "https";
  const host = req.headers.get("x-forwarded-host") || req.headers.get("host") || "reportlost.org";
  return `${proto}://${host}`;
}
async function sendMailViaApi(
  req: NextRequest,
  payload: {
    to: string | string[];
    subject: string;
    text: string;
    html?: string;
    fromName?: string;
    replyTo?: string;
  },
) {
  try {
    const base = getBaseUrl(req);
    const res = await fetch(`${base}/api/send-mail`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
      keepalive: true,
    });
    return res.ok;
  } catch {
    return false;
  }
}

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/**
 * Re-envoie l'email “Publish your report to start the search”
 * Query:
 *   - rid=UUID du report (obligatoire)
 * Effet:
 *   - lit la ligne, reconstruit l'email, envoie, puis set mail_sent=true si OK
 */
export async function POST(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const rid = searchParams.get("rid") || null;
    if (!rid) return NextResponse.json({ ok: false, error: "missing rid" }, { status: 400 });

    const sb = getSupabaseAdmin();
    if (!sb) return NextResponse.json({ ok: false, error: "no supabase" }, { status: 500 });

    // Récupère les infos nécessaires
    const { data: row, error } = await sb
      .from("lost_items")
      .select(
        "id, public_id, mail_sent, title, date, city, state_id, first_name, email, station_slug",
      )
      .eq("id", rid)
      .maybeSingle();

    if (error) return NextResponse.json({ ok: false, error: String(error.message || error) }, { status: 500 });
    if (!row) return NextResponse.json({ ok: false, error: "not_found" }, { status: 404 });
    if (!row.email) return NextResponse.json({ ok: false, error: "no_email" }, { status: 400 });

    const base = getBaseUrl(req);
    const contributeUrl = `${base}/report?go=contribute&rid=${encodeURIComponent(rid)}`;
    const ref5 = getReferenceCode(row.public_id, row.id);

    const text = `Hello ${row.first_name || ""},

We have saved your lost item report draft on reportlost.org.

To publish it and start the search, please complete the secure payment (you can choose your search level on the next page).

Your report details:
- Item: ${row.title || ""}
- Date: ${row.date || ""}
- City: ${row.city || ""}
- Reference code: ${ref5}

${contributeUrl}

Payments are processed securely by Stripe (PCI DSS v4.0). Once the payment is confirmed, your report will be published and alerts will be activated.`;

    const html = `
<div style="font-family:Arial,Helvetica,sans-serif;max-width:620px;margin:auto;border:1px solid #e5e7eb;border-radius:10px;overflow:hidden">
  <div style="background:linear-gradient(90deg,#2C7A4A,#3FAE68);color:#fff;padding:18px 16px;text-align:center;">
    <h2 style="margin:0;font-size:22px;letter-spacing:.3px">ReportLost</h2>
    <p style="margin:8px 0 0;font-size:14px;opacity:.95">✅ Publish your report to start the search</p>
  </div>
  <div style="padding:20px;color:#111827;line-height:1.55;background:#fff">
    <p style="margin:0 0 12px">Hello <b>${row.first_name || ""}</b>,</p>
    <p style="margin:0 0 14px">We have saved your lost item report <em>draft</em> on
      <a href="${base}" style="color:#2C7A4A;text-decoration:underline">reportlost.org</a>.
    </p>
    <p style="margin:0 0 14px">To publish it and start the search, please complete the secure payment.
      You will be able to choose your search level on the next page.
    </p>
    <ul style="margin:0 16px 18px;padding-left:18px">
      <li><b>Item:</b> ${row.title || ""}</li>
      <li><b>Date:</b> ${row.date || ""}</li>
      <li><b>City:</b> ${row.city || ""}</li>
      <li><b>Reference code:</b> ${ref5}</li>
    </ul>
    <div style="margin:16px 0 0">
      <a href="${contributeUrl}" style="display:inline-block;background:linear-gradient(90deg,#2C7A4A,#3FAE68);color:#fff;padding:12px 18px;border-radius:10px;text-decoration:none;font-weight:700">
        Proceed to secure payment
      </a>
    </div>
  </div>
</div>`;

    const ok = await sendMailViaApi(req, {
      to: row.email,
      subject: "Publish your report to start the search",
      text,
      html,
    });

    if (ok) {
      await sb.from("lost_items").update({ mail_sent: true }).eq("id", rid);
      return NextResponse.json({ ok: true, id: rid, resent: true });
    }
    return NextResponse.json({ ok: false, error: "send_failed" }, { status: 500 });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: String(e?.message || e) }, { status: 500 });
  }
}
