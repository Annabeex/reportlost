// app/api/case_followup/[public_id]/notes/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function json(data: any, init?: ResponseInit) {
  const res = NextResponse.json(data, init);
  res.headers.set("Cache-Control", "no-store");
  return res;
}

async function fetchByPublicId(supabase: any, pidRaw: string) {
  const pid = (pidRaw || "").trim();

  // Recherche en TEXTE uniquement (public_id est une colonne TEXT)
  const r = await supabase
    .from("lost_items")
    .select("id, public_id, case_notes")
    .eq("public_id", pid)
    .limit(1)
    .maybeSingle();

  if (!r.error && r.data) return r.data;
  return null;
}

export async function GET(
  _req: NextRequest,
  { params }: { params: { public_id: string } }
) {
  const supabase = getSupabaseAdmin();
  if (!supabase) return json({ error: "supabase" }, { status: 500 });

  const row = await fetchByPublicId(supabase, params.public_id);
  if (!row) return json({ notes: "" }); // retourne vide plutôt que 404 pour simplicité

  return json({ notes: typeof row.case_notes === "string" ? row.case_notes : "" });
}

export async function PUT(
  req: NextRequest,
  { params }: { params: { public_id: string } }
) {
  const supabase = getSupabaseAdmin();
  if (!supabase) return json({ error: "supabase" }, { status: 500 });

  const body = (await req.json().catch(() => null)) as { notes?: unknown } | null;
  if (!body || typeof body.notes !== "string") {
    return json({ error: "invalid payload" }, { status: 400 });
  }

  const row = await fetchByPublicId(supabase, params.public_id);
  if (!row) return json({ error: "not_found" }, { status: 404 });

  const { error } = await supabase
    .from("lost_items")
    .update({ case_notes: body.notes })
    .eq("id", row.id);

  if (error) return json({ error: error.message }, { status: 500 });
  return json({ ok: true });
}
