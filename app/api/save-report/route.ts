// app/api/save-report/route.ts
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_ROLE = process.env.SUPABASE_SERVICE_ROLE;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE) {
  console.error("Missing SUPABASE URL or SERVICE_ROLE env vars");
}

const supabaseAdmin = createClient(SUPABASE_URL || "", SUPABASE_SERVICE_ROLE || "");

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => null);
    if (!body || !body.cleaned) {
      return NextResponse.json({ error: "Missing payload" }, { status: 400 });
    }

    const cleaned = body.cleaned;
    const fingerprint = body.fingerprint || null;

    if (!fingerprint) {
      return NextResponse.json({ error: "Missing fingerprint" }, { status: 400 });
    }

    // 1) search existing by fingerprint
    const { data: existingRows, error: selErr } = await supabaseAdmin
      .from("lost_items")
      .select("id, public_id, created_at")
      .eq("fingerprint", fingerprint)
      .order("created_at", { ascending: false })
      .limit(1);

    if (selErr) {
      console.error("Admin select error:", selErr);
      return NextResponse.json({ error: selErr.message }, { status: 500 });
    }

    if (Array.isArray(existingRows) && existingRows.length > 0) {
      const row = existingRows[0];
      return NextResponse.json({
        ok: true,
        existed: true,
        id: row.id,
        public_id: row.public_id,
        created_at: row.created_at,
      });
    }

    // 2) insert new
    const { data: insertDataRaw, error: insertErr } = await supabaseAdmin
      .from("lost_items")
      .insert([{ ...cleaned, fingerprint }])
      .select("id, public_id, created_at");

    if (insertErr) {
      // race / unique constraint handling
      const msg = String(insertErr?.message || insertErr?.code || "");
      if (/unique|23505/i.test(msg)) {
        // re-read
        const { data: racedRows, error: racedErr } = await supabaseAdmin
          .from("lost_items")
          .select("id, public_id, created_at")
          .eq("fingerprint", fingerprint)
          .order("created_at", { ascending: false })
          .limit(1);
        if (racedErr) {
          console.error("Race re-read error:", racedErr);
          return NextResponse.json({ error: racedErr.message }, { status: 500 });
        }
        if (Array.isArray(racedRows) && racedRows.length > 0) {
          const r = racedRows[0];
          return NextResponse.json({ ok: true, existed: true, id: r.id, public_id: r.public_id, created_at: r.created_at });
        }
      }
      console.error("Admin insert error:", insertErr);
      return NextResponse.json({ error: insertErr.message }, { status: 500 });
    }

    const insertData = Array.isArray(insertDataRaw) ? insertDataRaw[0] : insertDataRaw;
    if (!insertData || !insertData.id) {
      console.error("Insert returned no row (admin)");
      return NextResponse.json({ error: "Insert returned no row" }, { status: 500 });
    }

    return NextResponse.json({
      ok: true,
      existed: false,
      id: insertData.id,
      public_id: insertData.public_id,
      created_at: insertData.created_at,
    });
  } catch (err: any) {
    console.error("Unexpected server error save-report:", err);
    return NextResponse.json({ error: String(err?.message || err) }, { status: 500 });
  }
}
