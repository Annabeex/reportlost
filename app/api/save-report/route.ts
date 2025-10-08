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

/**
 * Liste blanche des colonnes autorisées à écrire dans lost_items.
 * IMPORTANT : ne pas ajouter 'report_id' ici (la table n'a pas cette colonne).
 */
const ALLOWED_COLUMNS = new Set([
  "description",
  "city",
  "date",
  "email",
  "title",
  "departure_place",
  "arrival_place",
  "departure_time",
  "arrival_time",
  "travel_number",
  "time_slot",
  "first_name",
  "last_name",
  "phone",
  "address",
  "contribution",
  "consent",
  "phone_description",
  "loss_neighborhood",
  "loss_street",
  "object_photo",
  "paid",
  "paid_at",
  "payment_email_sent",
  "state_id",
  "public_id",
  "fingerprint",
  "mail_sent",
  "confirmation_sent",
]);

/** filtre un objet pour ne garder que les colonnes autorisées */
function filterAllowed(payload: Record<string, any>) {
  const out: Record<string, any> = {};
  for (const k of Object.keys(payload || {})) {
    if (ALLOWED_COLUMNS.has(k)) {
      out[k] = payload[k];
    }
  }
  return out;
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

    // normalize minimal fields (for fingerprint)
    const title = (body.title ?? "").trim() || null;
    const description = (body.description ?? "").trim() || null;
    const city = (body.city ?? "").trim() || null;
    const state_id = (body.state_id ?? "").toUpperCase() || null;
    const date = body.date ?? null;
    const email = (body.email ?? "").toLowerCase() || null;

    const fingerprint = computeFingerprint({ title, description, city, state_id, date, email });

    // build update/insert payload but FILTER unwanted keys (report_id, report_public_id, etc.)
    const inbound = { ...(body || {}) };
    // remove client-specific helpers that are not DB columns
    delete inbound.report_id;
    delete inbound.report_public_id;
    // now keep only allowed columns
    const safeFields = filterAllowed(inbound);
    // ensure fingerprint and normalized state_id are present
    safeFields.fingerprint = fingerprint;
    if (state_id) safeFields.state_id = state_id;

    // helper: handle an existing row (update + maybe send mail once)
    const handleExistingRow = async (existing: { id: string; public_id: string | null; mail_sent: boolean }) => {
      // update existing row with safeFields
      const { error: updErr } = await supabase.from("lost_items").update(safeFields).eq("id", existing.id);
      if (updErr) {
        console.error("Supabase update(existing) failed:", updErr);
        return NextResponse.json({ ok: false, error: updErr.message }, { status: 500 });
      }

      let public_id = existing.public_id;
      if (!public_id) {
        public_id = publicIdFromUuid(existing.id) || null;
        if (public_id) {
          // persist computed public_id (best-effort)
          try {
            await supabase.from("lost_items").update({ public_id }).eq("id", existing.id);
          } catch (e) {
            console.warn("Could not persist computed public_id for existing row:", e);
          }
        }
      }

      // send confirmation mail once if not already sent
      let mail_sent = !!existing.mail_sent;
      if (!mail_sent && email) {
        const subject = `✅ Your lost item report has been registered`;
        const text = `Hello ${body.first_name || ""}\n\nWe found an existing report matching your submission. Reference: ${public_id || "N/A"}`;
        try {
          await sendMailViaApi({ to: email, subject, text });
          // mark mail_sent true
          await supabase.from("lost_items").update({ mail_sent: true }).eq("id", existing.id);
          mail_sent = true;
        } catch (e) {
          console.warn("Failed to send/mark mail_sent for existing row:", e);
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
        // Delegate to handler which updates and maybe send mail
        return handleExistingRow(existing as any);
      }
      // if not found, continue as normal (will attempt fingerprint match/insert)
    }

    // 2) Try to find existing by fingerprint (most recent)
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
      return handleExistingRow(found);
    }

    // 3) Insert new row
    // Ensure we do NOT include client-only fields (report_id), we already filtered above
    const insertPayload = { ...safeFields, mail_sent: false };

    const { data: insData, error: insErr } = await supabase
      .from("lost_items")
      .insert([insertPayload])
      .select("id, public_id, created_at")
      .single();

    if (insErr || !insData?.id) {
      // handle possible unique-constraint race (someone inserted same fingerprint concurrently)
      const msg = String(insErr?.message || insErr?.code || "");
      if (/unique|23505|duplicate key value/i.test(msg)) {
        try {
          const { data: existingRows, error: fetchErr } = await supabase
            .from("lost_items")
            .select("id, public_id, mail_sent, created_at")
            .eq("fingerprint", fingerprint)
            .order("created_at", { ascending: false })
            .limit(1);

          if (fetchErr) {
            console.error("Supabase fetch after unique violation failed:", fetchErr);
          }

          const existing = Array.isArray(existingRows) ? (existingRows[0] as any) : null;
          if (existing) {
            return handleExistingRow(existing);
          }
        } catch (e) {
          console.error("Exception while recovering from unique violation:", e);
        }
      }

      console.error("Supabase insert error:", insErr);
      return NextResponse.json({ ok: false, error: insErr?.message || "insert_failed" }, { status: 500 });
    }

    // Persist a computed public_id if missing
    let public_id = insData.public_id;
    if (!public_id) {
      try {
        public_id = publicIdFromUuid(String(insData.id)) || null;
        if (public_id) {
          await supabase.from("lost_items").update({ public_id }).eq("id", insData.id);
        }
      } catch (e) {
        console.warn("Could not compute/persist public_id:", e);
      }
    }

    // send confirmation email once (server-side)
    if (email) {
      const subject = `✅ Your lost item report has been registered`;
      const text = `Hello ${body.first_name || ""}\n\nWe received your report. Reference: ${public_id || "N/A"}`;
      try {
        const ok = await sendMailViaApi({ to: email, subject, text });
        if (ok) {
          try {
            await supabase.from("lost_items").update({ mail_sent: true }).eq("id", insData.id);
          } catch (e) {
            console.warn("Could not set mail_sent after sending mail:", e);
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
