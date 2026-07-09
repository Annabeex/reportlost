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
    // recherche serveur (toute la base), on nettoie les caractères qui casseraient le filtre .or()
    const q = (searchParams.get("q") || "").replace(/[,()%]/g, " ").trim();
    const like = q ? `%${q}%` : "";

    // LOST ITEMS — on inclut les colonnes de suivi pour afficher le drapeau
    let lostQuery: any = supabase
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
          // ✅ coordonnées complètes + catégories
          "phone",
          "address",
          "paid",
          "primary_category",
          "categories",
          // ✅ état de la veille IA
          "search_status",
          "next_search_at",
          "last_searched_at",
          "force_search",
        ].join(",")
      );

    if (like) {
      lostQuery = lostQuery.or(
        `public_id.ilike.${like},title.ilike.${like},description.ilike.${like},city.ilike.${like},state_id.ilike.${like},email.ilike.${like},first_name.ilike.${like},last_name.ilike.${like},phone.ilike.${like}`
      );
    }

    const { data: lost, error: lostErr } = await lostQuery
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

    // ✅ Compteurs EXACTS (sans charger toutes les lignes) pour le taux de transfo
    const { count: lostTotal } = await supabase
      .from("lost_items")
      .select("id", { count: "exact", head: true });
    const { count: foundTotal } = await supabase
      .from("found_items")
      .select("id", { count: "exact", head: true });
    const { count: paidTotal } = await supabase
      .from("lost_items")
      .select("id", { count: "exact", head: true })
      .gt("contribution", 0);

    return NextResponse.json(
      {
        lost: lost ?? [],
        found: found ?? [],
        lostTotal: lostTotal ?? null,
        foundTotal: foundTotal ?? null,
        paidTotal: paidTotal ?? null,
      },
      { status: 200 }
    );
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "unknown error" }, { status: 500 });
  }
}
