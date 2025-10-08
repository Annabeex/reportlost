// app/api/save-report/route.ts
import { NextRequest, NextResponse } from "next/server";
import { createClient, SupabaseClient } from "@supabase/supabase-js";
import crypto from "crypto";
import { publicIdFromUuid } from "@/lib/reportId";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/* compute fingerprint (server-side, same logic as client) */
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

async function getSupabaseClient(): Promise<SupabaseClient | null> {
  // préférer vars serveur : SUPABASE_SERVICE_ROLE_KEY (non public)
  const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
  const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
    // retourne null au lieu de throw pour ne pas casser le build
    console.error("Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY env vars for save-report endpoint");
    return null;
  }

  return createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
    auth: { persistSession: false },
    // optional: set global fetch if needed
  });
}

async function sendMailViaApi(payload: {
  to: string | string[];
  subject: string;
  text: string;
  html?: string;
  fromName?: string;
  replyTo?: string;
}) {
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
    if (!body) return NextResponse.json({ ok: false, error: "invalid json" }, { status: 400 });

    // get supabase client lazily
    const supabase = await getSupabaseClient();
    if (!supabase) {
      return NextResponse.json({ ok: false, error: "Missing Supabase env vars" }, { status: 500 });
    }

    // normalize minimal fields
    const title = (body.title ?? "").trim() || null;
    const description = (body.description ?? "").trim() || null;
    const city = (body.city ?? "").trim() || null;
    const state_id = (body.state_id ?? "").toUpperCase() || null;
    const date = body.date ?? null;
    const email = (body.email ?? "").toLowerCase() || null;
    const other = body; // keep other fields to pass to DB insert/update

    const fingerprint = computeFingerprint({ title, description, city, state_id, date, email });

    const clientProvidedId = body.report_id ? String(body.report_id) : null;

    // 1) If client provided an id -> try update that specific row
    if (clientProvidedId) {
      const { data: existing, error: e1 } = await supabase
        .from("lost_items")
        .select("id, public_id, mail_sent")
        .eq("id", clientProvidedId)
        .maybeSingle();

      if (e1) {
        console.error("Supabase error checking clientProvidedId:", e1);
      } else if (existing) {
        const updatePayload = {
          ...other,
          fingerprint,
          state_id,
        };
        const { error: upErr } = await supabase.from("lost_items").update(updatePayload).eq("id", clientProvidedId);
        if (upErr) {
          console.error("Supabase update (clientProvidedId) failed:", upErr);
          return NextResponse.json({ ok: false, error: upErr.message }, { status: 500 });
        }

        // ensure public_id exists
        let public_id = existing.public_id;
        if (!public_id) {
          public_id = publicIdFromUuid(clientProvidedId) || null;
          if (public_id) await supabase.from("lost_items").update({ public_id }).eq("id", clientProvidedId);
        }

        // send mail only if not already sent
        if (!existing.mail_sent && email) {
          const to = email;
          const subject = `✅ Your lost item report has been registered`;
          const text = `Hello ${other.first_name || ""}\n\nYour report is registered. Reference: ${public_id || "N/A"}`;
          await sendMailViaApi({ to, subject, text });
          await supabase.from("lost_items").update({ mail_sent: true }).eq("id", clientProvidedId);
        }

        return NextResponse.json({ ok: true, action: "updated", id: clientProvidedId, public_id }, { status: 200 });
      }
    }

    // 2) Try to find existing by fingerprint
    const { data: found, error: findErr } = await supabase
      .from("lost_items")
      .select("id, public_id, mail_sent, created_at")
      .eq("fingerprint", fingerprint)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (findErr) {
      console.error("Supabase lookup error:", findErr);
    }

    if (found) {
      const updatePayload = { ...other, fingerprint, state_id };
      const { error: updErr } = await supabase.from("lost_items").update(updatePayload).eq("id", (found as any).id);
      if (updErr) {
        console.error("Supabase update(found) failed:", updErr);
        return NextResponse.json({ ok: false, error: updErr.message }, { status: 500 });
      }

      if (!found.mail_sent && email) {
        const subject = `✅ Your lost item report has been registered`;
        const text = `Hello ${other.first_name || ""}\n\nWe found an existing report matching your submission. Reference: ${found.public_id || "N/A"}`;
        await sendMailViaApi({ to: email, subject, text });
        await supabase.from("lost_items").update({ mail_sent: true }).eq("id", (found as any).id);
      }

      return NextResponse.json({
        ok: true,
        action: "updated",
        id: (found as any).id,
        public_id: (found as any).public_id,
        mail_sent: !!(found as any).mail_sent,
      });
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
      return NextResponse.json({ ok: false, error: insErr?.message || "insert_failed" }, { status: 500 });
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

    return NextResponse.json({ ok: true, action: "inserted", id: insData.id, public_id }, { status: 200 });
  } catch (err: any) {
    console.error("save-report unexpected error:", err);
    return NextResponse.json({ ok: false, error: "unexpected" }, { status: 500 });
  }
}
