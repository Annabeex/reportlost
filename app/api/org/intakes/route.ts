// app/api/org/intakes/route.ts — dépôts par QR code en attente de confirmation
import { NextRequest, NextResponse } from "next/server";
import { getOrgContext } from "@/lib/orgAuth";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const ctx = await getOrgContext(req);
  if (!ctx?.org) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const sb = getSupabaseAdmin()!;

  const { data, error } = await sb
    .from("org_intakes")
    .select("id, code, title, description, found_location, found_at, photo_url, finder_name, finder_email, held_by, public_visible, public_label, created_at")
    .eq("org_id", ctx.org.id)
    .eq("status", "pending")
    .order("created_at", { ascending: false })
    .limit(300);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true, intakes: data || [] });
}
