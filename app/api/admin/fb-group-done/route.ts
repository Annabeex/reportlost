// app/api/admin/fb-group-done/route.ts
// Suivi "groupe Facebook créé" par ville (colonne us_cities.fb_group_done).
// Protégé par le middleware Basic Auth (/api/admin/*).
import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const city = (req.nextUrl.searchParams.get("city") || "").trim();
  const state = (req.nextUrl.searchParams.get("state") || "").trim().toUpperCase();
  if (!city || state.length !== 2) return NextResponse.json({ error: "city et state requis" }, { status: 400 });

  const sb = getSupabaseAdmin();
  if (!sb) return NextResponse.json({ error: "Supabase non configuré" }, { status: 500 });

  const { data, error } = await sb
    .from("us_cities")
    .select("fb_group_done")
    .eq("state_id", state)
    .ilike("city_ascii", city)
    .maybeSingle();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true, done: !!data?.fb_group_done, found: !!data });
}

export async function PUT(req: NextRequest) {
  try {
    const { city, state, done } = await req.json();
    if (!city || !state) return NextResponse.json({ error: "city et state requis" }, { status: 400 });

    const sb = getSupabaseAdmin();
    if (!sb) return NextResponse.json({ error: "Supabase non configuré" }, { status: 500 });

    const { error } = await sb
      .from("us_cities")
      .update({ fb_group_done: !!done, fb_group_done_at: done ? new Date().toISOString() : null })
      .eq("state_id", String(state).toUpperCase())
      .ilike("city_ascii", String(city).trim());
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ ok: true });
  } catch (e: any) {
    return NextResponse.json({ error: String(e?.message || e) }, { status: 500 });
  }
}
