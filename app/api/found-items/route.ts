// app/api/found-items/route.ts
import { NextRequest, NextResponse } from "next/server";
import type { SupabaseClient } from "@supabase/supabase-js";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function json(data: any, init?: ResponseInit) {
  const res = NextResponse.json(data, init);
  res.headers.set("Cache-Control", "no-store");
  return res;
}

function sanitizeString(value: unknown): string {
  if (typeof value !== "string") return "";
  return value.trim();
}
function nullable(value: unknown): string | null {
  const t = sanitizeString(value);
  return t.length > 0 ? t : null;
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));

    // getSupabaseAdmin returns SupabaseClient | null (server-only)
    const supabase: SupabaseClient | null = getSupabaseAdmin();
    if (!supabase) {
      console.error("found-items: missing supabase admin client (env may be missing)");
      return json({ ok: false, error: "Missing Supabase credentials" }, { status: 500 });
    }

    // sanitize incoming fields
    const image_url = nullable(body.image_url);
    const description = sanitizeString(body.description ?? "");
    const city = nullable(body.city);
    const state_id = sanitizeString(body.state_id ?? "").toUpperCase() || null;
    const date = nullable(body.date);
    const labels = sanitizeString(body.labels ?? "");
    const logos = sanitizeString(body.logos ?? "");
    const objects = sanitizeString(body.objects ?? "");
    const ocr_text = sanitizeString(body.ocr_text ?? "");
    const title = nullable(body.title);
    const email = nullable(body.email);
    const phone = nullable(body.phone);
    const dropoff_location = nullable(body.dropoff_location);

    const baseRow: Record<string, any> = {
      image_url,
      city,
      state_id,
      date,
      labels,
      logos,
      objects,
      ocr_text,
      title,
      email,
      phone,
      dropoff_location,
    };

    // Helpers to attempt insert using either `description` (preferred) or `text` (legacy)
    async function tryInsertWithDesc(row: Record<string, any>) {
      // .maybeSingle() returns { data, error }
      return supabase.from("found_items").insert([row]).select("id, created_at").maybeSingle();
    }

    async function tryInsertWithText(row: Record<string, any>) {
      const r = { ...row };
      delete r.description;
      r.text = description || null;
      return supabase.from("found_items").insert([r]).select("id, created_at").maybeSingle();
    }

    // 1) Try insert with description column
    let insertPayload = { ...baseRow, description: description || null };
    let insResponse = await tryInsertWithDesc(insertPayload);
    let insData = (insResponse as any).data;
    let insErr = (insResponse as any).error;

    // 2) If failed due to missing column 'description', fallback to 'text'
    if (insErr) {
      const msg = String(insErr.message || "").toLowerCase();
      if (msg.includes("column") && msg.includes("description")) {
        insResponse = await tryInsertWithText(insertPayload);
        insData = (insResponse as any).data;
        insErr = (insResponse as any).error;
      }
    }

    // 3) If insertion failed for other reason (duplicate / constraint / trigger), attempt recovery:
    if (insErr || !insData?.id) {
      // Try to find existing row by image_url (best heuristic)
      let existing: any = null;
      if (image_url) {
        const { data: e1, error: e1err } = await supabase
          .from("found_items")
          .select("id, created_at")
          .eq("image_url", image_url)
          .limit(1)
          .maybeSingle();
        if (!e1err && e1) existing = e1;
        else if (e1err) console.warn("found-items: lookup by image_url failed:", e1err);
      }

      // If not found and we have title+date+city, try that combination
      if (!existing && title && date && city) {
        const { data: e2, error: e2err } = await supabase
          .from("found_items")
          .select("id, created_at")
          .eq("title", title)
          .eq("date", date)
          .eq("city", city)
          .limit(1)
          .maybeSingle();
        if (!e2err && e2) existing = e2;
        else if (e2err) console.warn("found-items: lookup by title/date/city failed:", e2err);
      }

      // If found, perform an UPDATE to refresh fields and return that id
      if (existing && existing.id) {
        try {
          const updPayload: Record<string, any> = {
            ...baseRow,
            description: description || null,
          };
          const { error: upErr } = await supabase.from("found_items").update(updPayload).eq("id", existing.id);
          if (upErr) {
            console.error("Failed to update existing found_items row:", upErr);
            return json({ ok: false, error: "update_failed", details: upErr }, { status: 500 });
          }
          return json({ ok: true, id: existing.id, created_at: existing.created_at || null }, { status: 200 });
        } catch (u) {
          console.error("Exception while updating existing row:", u);
          return json({ ok: false, error: "update_exception", details: String(u) }, { status: 500 });
        }
      }

      // If we get here, insertion failed and no existing row found: return error details (useful for debug)
      console.error("Insert failed and no existing row found:", insErr);
      return json({ ok: false, error: "insert_failed", details: insErr }, { status: 500 });
    }

    // Success insert path
    return json({ ok: true, id: insData.id, created_at: insData.created_at }, { status: 200 });
  } catch (err: any) {
    console.error("Unexpected error on found-items endpoint:", err);
    return json({ ok: false, error: "invalid_request", details: String(err) }, { status: 500 });
  }
}
