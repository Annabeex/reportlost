import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

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
  const trimmed = sanitizeString(value);
  return trimmed.length > 0 ? trimmed : null;
}

async function getSupabaseAdmin() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceKey) {
    console.error("Missing Supabase configuration for found-items endpoint");
    return null;
  }

  return createClient(url, serviceKey, { auth: { persistSession: false } });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const supabase = await getSupabaseAdmin();

    if (!supabase) {
      return json({ ok: false, error: "Missing Supabase credentials" }, { status: 500 });
    }

    const imageUrl = nullable(body.image_url);
    const description = sanitizeString(body.description ?? "");
    const city = nullable(body.city);
    const stateId = sanitizeString(body.state_id ?? "").toUpperCase();
    const date = nullable(body.date);
    const labels = sanitizeString(body.labels ?? "");
    const logos = sanitizeString(body.logos ?? "");
    const objects = sanitizeString(body.objects ?? "");
    const ocrText = sanitizeString(body.ocr_text ?? "");
    const title = nullable(body.title);
    const email = nullable(body.email);
    const phone = nullable(body.phone);
    const dropoffLocation = nullable(body.dropoff_location);

    const baseRow = {
      image_url: imageUrl,
      city,
      state_id: stateId || null,
      date,
      labels,
      logos,
      objects,
      ocr_text: ocrText,
      title,
      email,
      phone,
      dropoff_location: dropoffLocation,
    } as Record<string, any>;

    const tryInsert = async (row: Record<string, any>) =>
      supabase.from("found_items").insert([row]);

    let { error } = await tryInsert({ ...baseRow, description: description || null });

    if (error) {
      const message = String(error.message || "").toLowerCase();
      if (message.includes("column") && message.includes("description")) {
        ({ error } = await tryInsert({ ...baseRow, text: description || null }));
      }
    }

    if (error) {
      console.error("Failed to insert found item:", error);
      return json({ ok: false, error: "Failed to save found item" }, { status: 500 });
    }

    return json({ ok: true });
  } catch (error) {
    console.error("Unexpected error on found-items endpoint:", error);
    return json({ ok: false, error: "Invalid request" }, { status: 500 });
  }
}