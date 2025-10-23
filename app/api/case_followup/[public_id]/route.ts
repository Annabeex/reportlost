import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function json(data: any, init?: ResponseInit) {
  const res = NextResponse.json(data, init);
  res.headers.set("Cache-Control", "no-store");
  return res;
}

export async function GET(
  _req: NextRequest,
  { params }: { params: { public_id: string } }
) {
  const supabase = getSupabaseAdmin();
  if (!supabase) return json({ error: "supabase" }, { status: 500 });

  const { data, error } = await supabase
    .from("lost_items")
    .select("case_followup")
    .eq("public_id", params.public_id)
    .maybeSingle();

  if (error) return json({ error: error.message }, { status: 500 });
  return json({ ok: true, blocks: data?.case_followup ?? [] });
}

export async function PUT(
  req: NextRequest,
  { params }: { params: { public_id: string } }
) {
  const supabase = getSupabaseAdmin();
  if (!supabase) return json({ error: "supabase" }, { status: 500 });

  const body = await req.json().catch(() => null) as { blocks?: any } | null;
  if (!body || !Array.isArray(body.blocks)) {
    return json({ error: "invalid payload" }, { status: 400 });
  }

  const { error } = await supabase
    .from("lost_items")
    .update({ case_followup: body.blocks })
    .eq("public_id", params.public_id);

  if (error) return json({ error: error.message }, { status: 500 });
  return json({ ok: true });
}
