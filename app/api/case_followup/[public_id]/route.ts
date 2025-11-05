import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function json(data: any, init?: ResponseInit) {
  const res = NextResponse.json(data, init);
  res.headers.set("Cache-Control", "no-store");
  return res;
}

// Helper: récupère une ligne par public_id (string OU number)
async function fetchByPublicId(supabase: any, pidRaw: string) {
  const pid = (pidRaw || "").trim();

  // essai comme string
  let r = await supabase
    .from("lost_items")
    .select("id, public_id, case_followup, case_notes, followup_email_sent, followup_email_sent_at, followup_email_to")
    .eq("public_id", pid)
    .limit(1)
    .maybeSingle();
  if (!r.error && r.data) return r.data;

  // essai comme number (si digits)
  if (/^[0-9]+$/.test(pid)) {
    const num = Number(pid);
    const rNum = await supabase
      .from("lost_items")
      .select("id, public_id, case_followup, case_notes, followup_email_sent, followup_email_sent_at, followup_email_to")
      .eq("public_id", num)
      .limit(1)
      .maybeSingle();
    if (!rNum.error && rNum.data) return rNum.data;
  }

  return null;
}

export async function GET(
  _req: NextRequest,
  { params }: { params: { public_id: string } }
) {
  const supabase = getSupabaseAdmin();
  if (!supabase) return json({ error: "supabase" }, { status: 500 });

  const row = await fetchByPublicId(supabase, params.public_id);
  if (!row) return json({ error: "not_found" }, { status: 404 });

  return json({
    ok: true,
    blocks: Array.isArray(row.case_followup) ? row.case_followup : [],
    followup: {
      sent: !!row.followup_email_sent,
      sentAt: row.followup_email_sent_at,
      to: row.followup_email_to || null,
    },
    notes: typeof row.case_notes === "string" ? row.case_notes : "", // ✅ renvoie les notes
  });
}

export async function PUT(
  req: NextRequest,
  { params }: { params: { public_id: string } }
) {
  const supabase = getSupabaseAdmin();
  if (!supabase) return json({ error: "supabase" }, { status: 500 });

  const body = (await req.json().catch(() => null)) as {
    blocks?: unknown;
    notes?: string;
  } | null;

  if (!body) return json({ error: "invalid payload" }, { status: 400 });

  const row = await fetchByPublicId(supabase, params.public_id);
  if (!row) return json({ error: "not_found" }, { status: 404 });

  // construit l’objet de mise à jour selon le contenu
  const update: Record<string, any> = {};
  if (Array.isArray(body.blocks)) update.case_followup = body.blocks;
  if (typeof body.notes === "string") update.case_notes = body.notes;

  if (!Object.keys(update).length)
    return json({ error: "empty payload" }, { status: 400 });

  const { error } = await supabase
    .from("lost_items")
    .update(update)
    .eq("id", row.id);

  if (error) return json({ error: error.message }, { status: 500 });
  return json({ ok: true });
}
