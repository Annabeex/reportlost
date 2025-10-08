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
  });
}

/**
 * Proxy to internal /api/send-mail endpoint (keeps mail sending centralized).
 * Returns true if request succeeded (HTTP 2xx).
 */
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
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 8000);

    const res = await fetch(`${site}/api/send-mail`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
      signal: controller.signal,
    });

    clearTimeout(timeout);
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
    // safe to call toUpperCase on empty string
    const state_id = (body.state_id ?? "").toUpperCase() || null;
    const date = body.date ?? null;
    const email = (body.email ?? "").toLowerCase() || null;
    const other = body; // keep other fields to pass to DB insert/update

    const fingerprint = computeFingerprint({ title, description, city, state_id, date, email });

    // unified payload we'll use for updates/inserts
    const updatePayload = { ...other, fingerprint, state_id };

    // helper: update an existing row and optionally send a mail if not already sent
    const handleExistingRow = async (
      existing: { id: string; public_id: string | null; mail_sent: boolean },
    ) => {
      // Apply update (non-transactional here)
      const { error: updErr } = await supabase.from("lost_items").update(updatePayload).eq("id", existing.id);
      if (updErr) {
        console.error("Supabase update(existing) failed:", updErr);
        return NextResponse.json({ ok: false, error: updErr.message }, { status: 500 });
      }

      // Ensure public_id present
      let public_id = existing.public_id;
      if (!public_id) {
        public_id = publicIdFromUuid(existing.id) || null;
        if (public_id) {
          await supabase.from("lost_items").update({ public_id }).eq("id", existing.id);
        }
      }

      // Send confirmation email only if not already sent
      let mail_sent = !!existing.mail_sent;
      if (!mail_sent && email) {
        const subject = `✅ Your lost item report has been registered`;
        const text = `Hello ${other.first_name || ""}\n\nWe found an existing report matching your submission. Reference: ${public_id || "N/A"}`;
        try {
          const ok = await sendMailViaApi({ to: email, subject, text });
          if (ok) {
            // persist that we've sent the mail
            try {
              await supabase.from("lost_items").update({ mail_sent: true }).eq("id", existing.id);
              mail_sent = true;
            } catch (e) {
              console.warn("Could not persist mail_sent flag after sending:", e);
            }
          }
        } catch (e) {
          console.warn("sendMailViaApi failed for existing row:", e);
        }
      }

      return NextResponse.json({
        ok: true,
        action: "updated",
        id: existing.id,
        public_id,
        mail_sent,
      });
    };

    // If client sent a report_id (localStorage), try to update that row first (explicit update flow)
    const clientProvidedId = body.report_id ? String(body.report_id) : null;
    if (clientProvidedId) {
      const { data: existing, error: e1 } = await supabase
        .from("lost_items")
        .select("id, public_id, mail_sent")
        .eq("id", clientProvidedId)
        .maybeSingle();

      if (e1) {
        console.error("Supabase error checking clientProvidedId:", e1);
      } else if (existing) {
        // Update payload already computed
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
          const subject = `✅ Your lost item report has been registered`;
          const text = `Hello ${other.first_name || ""}\n\nYour report is registered. Reference: ${public_id || "N/A"}`;
          try {
            const ok = await sendMailViaApi({ to: email, subject, text });
            if (ok) {
              await supabase.from("lost_items").update({ mail_sent: true }).eq("id", clientProvidedId);
            }
          } catch (e) {
            console.warn("sendMailViaApi failed for clientProvidedId:", e);
          }
        }

        return NextResponse.json({ ok: true, action: "updated", id: clientProvidedId, public_id }, { status: 200 });
      }
    }

    // 2) Try to find existing by fingerprint (may return array)
    const { data: foundRows, error: findErr } = await supabase
      .from("lost_items")
      .select("id, public_id, mail_sent, created_at")
      .eq("fingerprint", fingerprint)
      .order("created_at", { ascending: false })
      .limit(1);

    if (findErr) {
      console.error("Supabase lookup error:", findErr);
    }

    const found = Array.isArray(foundRows) ? (foundRows[0] as any) : null;
    if (found) {
      // We found an existing row that matches fingerprint -> update it (and possibly send email once)
      return handleExistingRow(found as any);
    }

    // 3) Insert new row (use updatePayload but ensure mail_sent=false initially)
    const insertPayload = { ...updatePayload, mail_sent: false };
    const { data: insData, error: insErr } = await supabase
      .from("lost_items")
      .insert([insertPayload])
      .select("id, public_id, created_at")
      .single();

    // handle unique/race conditions: if insert failed due to duplicate, try to fetch existing row
    if (insErr || !insData?.id) {
      // postgres unique violation codes vary; check common patterns
      const msg = String(insErr?.message || insErr?.code || "");
      if (insErr && (/unique|duplicate|23505/i.test(msg))) {
        // someone inserted concurrently — fetch the latest matching fingerprint
        try {
          const { data: existingRows, error: fetchErr } = await supabase
            .from("lost_items")
            .select("id, public_id, mail_sent, created_at")
            .eq("fingerprint", fingerprint)
            .order("created_at", { ascending: false })
            .limit(1);

          if (fetchErr) {
            console.error("Supabase fetch after unique violation failed:", fetchErr);
          } else {
            const existing = Array.isArray(existingRows) ? (existingRows[0] as any) : null;
            if (existing) {
              return handleExistingRow(existing);
            }
          }
        } catch (e) {
          console.error("Exception while recovering from unique violation:", e);
        }
      }

      console.error("Supabase insert error:", insErr);
      return NextResponse.json({ ok: false, error: insErr?.message || "insert_failed" }, { status: 500 });
    }

    // compute & persist public_id if missing
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

    // send confirmation email once for NEW INSERT
    if (email) {
      const subject = `✅ Your lost item report has been registered`;
      const text = `Hello ${other.first_name || ""}\n\nWe received your report. Reference: ${public_id || "N/A"}`;
      try {
        const ok = await sendMailViaApi({ to: email, subject, text });
        if (ok) {
          // mark mail_sent true in DB
          try {
            await supabase.from("lost_items").update({ mail_sent: true }).eq("id", insData.id);
          } catch (e) {
            console.warn("Could not persist mail_sent after sending:", e);
          }
        }
      } catch (e) {
        console.warn("sendMailViaApi failed for new insert:", e);
      }
    }

    return NextResponse.json({ ok: true, action: "inserted", id: insData.id, public_id }, { status: 200 });
  } catch (err: any) {
    console.error("save-report unexpected error:", err);
    return NextResponse.json({ ok: false, error: "unexpected" }, { status: 500 });
  }
}
