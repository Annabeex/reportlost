// app/api/admin/list/route.ts
import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";

export const runtime = "nodejs";

export async function GET(req: Request) {
  try {
    const supabase = getSupabaseAdmin();
    if (!supabase) {
      return NextResponse.json({ error: "Supabase not configured" }, { status: 500 });
    }

    const { searchParams } = new URL(req.url);
    const limit = Math.min(Number(searchParams.get("limit") || 200), 500);

    // LOST ITEMS — on inclut les colonnes de suivi pour afficher le drapeau
    const { data: lost, error: lostErr } = await supabase
      .from("lost_items")
      .select(
        [
          "id",
          "created_at",
          "object_photo",
          "description",
          "city",
          "state_id",
          "date",
          "time_slot",
          "first_name",
          "last_name",
          "email",
          "contribution",
          "public_id",
          "report_public_id",
          "title",
          "slug",
          // ✅ champs nécessaires au drapeau "follow-up sent"
          "followup_email_sent",
          "followup_email_sent_at",
          "followup_email_to",
        ].join(",")
      )
      .order("created_at", { ascending: false })
      .limit(limit);

    if (lostErr) {
      return NextResponse.json({ error: `lost_items: ${lostErr.message}` }, { status: 500 });
    }

    // FOUND ITEMS — ne pas sélectionner de colonne inexistante
    const { data: found, error: foundErr } = await supabase
      .from("found_items")
      .select(
        [
          "id",
          "created_at",
          "city",
          "description",
          "image_url",
          "title",
          "date",
          "labels",
          "logos",
          "objects",
          "ocr_text",
          "email",
          "phone",
          "dropoff_location",
        ].join(",")
      )
      .order("created_at", { ascending: false })
      .limit(limit);

    if (foundErr) {
      return NextResponse.json({ error: `found_items: ${foundErr.message}` }, { status: 500 });
    }

    return NextResponse.json({ lost: lost ?? [], found: found ?? [] }, { status: 200 });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "unknown error" }, { status: 500 });
  }
}
