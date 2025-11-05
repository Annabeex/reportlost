// app/api/admin/set-category/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const { id, categories, primary } = await req.json();
    if (!id) return NextResponse.json({ ok: false, error: "missing id" }, { status: 400 });

    const sb = getSupabaseAdmin();
    if (!sb) return NextResponse.json({ ok: false, error: "no supabase" }, { status: 500 });

    const { data, error } = await (sb as any)
      .from("lost_items")
      .update({
        categories: categories ?? null,      // text[]
        primary_category: primary ?? null,  // text
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

// (optionnel, évite 405 en préflight/fetch depuis des outils)
export function OPTIONS() {
  return NextResponse.json({}, { status: 200 });
}
