import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import type { PostgrestError } from "@supabase/supabase-js";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.warn("⚠️ Missing Supabase service configuration for report-public-id endpoint.");
}

export async function POST(request: Request) {
  try {
    if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
      return NextResponse.json({ error: "Supabase configuration missing" }, { status: 500 });
    }

    let payload: unknown;
    try {
      payload = await request.json();
    } catch {
      return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
    }

    const { reportId, publicId } =
      payload && typeof payload === "object" ? (payload as Record<string, unknown>) : {};

    if (typeof reportId !== "string" || !reportId.trim() ||
        typeof publicId !== "string" || !publicId.trim()) {
      return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    const candidateColumns = ["public_id", "report_public_id"] as const;
    let persisted = false;
    let lastError: PostgrestError | null = null;

    for (const column of candidateColumns) {
      const updatePayload = { [column]: publicId.trim() } as Record<string, string>;
      const { error } = await supabase
        .from("lost_items")
        .update(updatePayload)
        .eq("id", reportId.trim());

      if (!error) {
        persisted = true;
        break;
      }

      lastError = error;

      // 42703 = undefined_column → on essaye la colonne suivante
      if (error.code !== "42703") {
        break;
      }
    }

    if (!persisted) {
      console.warn("⚠️ Unable to persist public reference id", { reportId, publicId, lastError });
      const msg = lastError?.message || "Failed to persist public id";
      return NextResponse.json({ error: msg }, { status: 500 });
    }

    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("report-public-id fatal:", e);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
