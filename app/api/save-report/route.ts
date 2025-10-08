// app/api/save-report/route.ts
import { NextRequest } from "next/server";
import { createClient } from "@supabase/supabase-js";
import crypto from "crypto";
import { publicIdFromUuid } from "@/lib/reportId"; // réutilise ta fonction existante si possible

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!; // must be set in Vercel

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error("Missing SUPABASE env for save-report endpoint");
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false },
});

// helper
function computeFingerprint(obj: {
  title?: string | null;
  description?: string | null;
  city?: string | null;
  state_id?: string | null;
  date?: string | null;
  email?: string | null;
}) {
  const parts = [
    obj.title ?? "",
    obj.description ?? "",
    obj.city ?? "",
    (obj.state_id ?? "").toUpperCase(),
    obj.date ?? "",
    (obj.email ?? "").toLowerCase(),
  ];
  const raw = parts.join("|");
  return crypto.createHash("sha1").update(raw).digest("hex");
}

async function sendMailViaApi(payload: { to: string | string[]; subject: string; text: string; html?: string; fromName?: string; replyTo?: string }) {
  try {
    const site = process.env.NEXT_PUBLIC_SITE_URL || "https://reportlost.org";
    const res = await fetch(`${site}/api/send-mail`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    return res.ok;
  } catch (e) {
    console.error("sendMailViaApi error", e);
    return false;
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => null);
    if (!body) return new Response(JSON.stringify({ ok: false, error: "invalid json" }), { status: 400 });

    // normalise minimal fields
    const title = (body.title ?? "").trim() || null;
    const description = (body.description ?? "").trim() || null;
    const city = (body.city ?? "").trim() || null;
    const state_id = (body.state_id ?? "").toUpperCase() || null;
    const date = (body.date ?? null);
    const email = (body.email ?? "").toLowerCase() || null;
    const other = body; // keep other fields to pass to DB insert/update

    // compute fingerprint
    const fingerprint = computeFingerprint({ title, description, city, state_id, date, email });

    // If client provided a report_id (from localStorage), prefer updating that specific row first
    const clientProvidedId = body.report_id ? String(body.report_id) : null;

    // 1) If clientProvidedId present -> try update that row
    if (clientProvidedId) {
      const { data: existing, error: e1 } = await supabase
        .from("lost_items")
        .select("id, public_id, mail_sent")
        .eq("id", clientProvidedId)
        .maybeSingle();

      if (e1) {
        console.error("Supabase error checking clientProvidedId:", e1);
      } else if (existing) {
        // update the row, preserve public_id if present
        const updatePayload = {
          ...other,
          fingerprint,
          state_id,
        };
        const { error: upErr } = await supabase.from("lost_items").update(updatePayload).eq("id", clientProvidedId);
        if (upErr) {
          console.error("Supabase update (clientProvidedId) failed:", upErr);
          return new Response(JSON.stringify({ ok: false, error: upErr.message }), { status: 500 });
        }

        // ensure public_id exists
        let public_id = existing.public_id;
        if (!public_id) {
          public_id = publicIdFromUuid(clientProvidedId) || null;
          if (public_id) await supabase.from("lost_items").update({ public_id }).eq("id", clientProvidedId);
        }

        // send mail only if not already sent
        if (!existing.mail_sent) {
          const to = email ? email : null;
          if (to) {
            const subject = `✅ Your lost item report has been registered`;
            const text = `Hello ${other.first_name || ""}\n\nYour report is registered. Reference: ${public_id || "N/A"}`;
            await sendMailViaApi({ to, subject, text });
            await supabase.from("lost_items").update({ mail_sent: true }).eq("id", clientProvidedId);
          }
        }

        return new Response(JSON.stringify({ ok: true, action: "updated", id: clientProvidedId, public_id }), { status: 200 });
      }
    }

    // 2) Try to find an existing row by fingerprint
    const { data: found, error: findErr } = await supabase
      .from("lost_items")
      .select("id, public_id, mail_sent, created_at")
      .eq("fingerprint", fingerprint)
      .limit(1)
      .maybeSingle();

    if (findErr) {
      console.error("Supabase lookup error:", findErr);
    }

    if (found) {
      // update existing row with new data but preserve public_id and mail_sent
      const updatePayload = { ...other, fingerprint, state_id };
      const { error: updErr } = await supabase.from("lost_items").update(updatePayload).eq("id", found.id);
      if (updErr) {
        console.error("Supabase update(found) failed:", updErr);
        return new Response(JSON.stringify({ ok: false, error: updErr.message }), { status: 500 });
      }

      // if no mail_sent yet, send confirmation once
      if (!found.mail_sent && email) {
        const subject = `✅ Your lost item report has been registered`;
        const text = `Hello ${other.first_name || ""}\n\nWe found an existing report matching your submission. Reference: ${found.public_id || "N/A"}`;
        await sendMailViaApi({ to: email, subject, text });
        await supabase.from("lost_items").update({ mail_sent: true }).eq("id", found.id);
      }

      return new Response(JSON.stringify({ ok: true, action: "updated", id: found.id, public_id: found.public_id, mail_sent: !!found.mail_sent }), { status: 200 });
    }

    // 3) Insert new row
    const insertPayload = { ...other, fingerprint, state_id, mail_sent: false };
    const { data: insData, error: insErr } = await supabase
      .from("lost_items")
      .insert([insertPayload])
      .select("id, public_id, created_at")
      .single();

    if (insErr || !insData?.id) {
      console.error("Supabase insert error:", insErr);
      return new Response(JSON.stringify({ ok: false, error: insErr?.message || "insert_failed" }), { status: 500 });
    }

    let public_id = insData.public_id;
    if (!public_id) {
      try {
        public_id = publicIdFromUuid(String(insData.id)) || null;
        if (public_id) {
          await supabase.from("lost_items").update({ public_id }).eq("id", insData.id);
        }
      } catch (e) {
        console.warn("Could not compute public_id:", e);
      }
    }

    // send confirmation email once
    if (email) {
      const subject = `✅ Your lost item report has been registered`;
      const text = `Hello ${other.first_name || ""}\n\nWe received your report. Reference: ${public_id || "N/A"}`;
      const ok = await sendMailViaApi({ to: email, subject, text });
      if (ok) {
        await supabase.from("lost_items").update({ mail_sent: true }).eq("id", insData.id);
      }
    }

    return new Response(JSON.stringify({ ok: true, action: "inserted", id: insData.id, public_id }), { status: 200 });
  } catch (err: any) {
    console.error("save-report unexpected error:", err);
    return new Response(JSON.stringify({ ok: false, error: "unexpected" }), { status: 500 });
  }
}
