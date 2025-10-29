// app/api/recent-lost/route.ts
import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET() {
  try {
    const supabase = getSupabaseAdmin();
    if (!supabase) {
      return NextResponse.json(
        { items: [], error: "Supabase admin client not available" },
        { status: 500, headers: nocache() }
      );
    }

    const { data, error } = await supabase
      .from("lost_items")
      .select("id, slug, title, city, state_id, created_at")
      .order("created_at", { ascending: false })
      .limit(10);

    if (error) {
      return NextResponse.json(
        { items: [], error: error.message },
        { status: 500, headers: nocache() }
      );
    }

    return NextResponse.json(
      { items: Array.isArray(data) ? data : [] },
      { status: 200, headers: nocache() }
    );
  } catch (e: any) {
    return NextResponse.json(
      { items: [], error: e?.message ?? "unexpected error" },
      { status: 500, headers: nocache() }
    );
  }
}

function nocache() {
  return {
    "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate",
    Pragma: "no-cache",
    Expires: "0",
    "Surrogate-Control": "no-store",
  };
}
