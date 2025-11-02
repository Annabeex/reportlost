import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";

export async function POST(req: NextRequest) {
  try {
    const { id, categories, primary } = await req.json();
    if (!id) return NextResponse.json({ ok: false, error: "missing id" }, { status: 400 });

    const sb = getSupabaseAdmin();
    const { data, error } = await (sb as any)
      .from("lost_items")
      .update({
        categories: categories ?? null,
        primary_category: primary ?? null,
      })
      .eq("id", id)
      .select("id")
      .single();

    if (error) throw error;
    return NextResponse.json({ ok: true, id: data?.id || id });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: String(e?.message || e) }, { status: 500 });
  }
}
