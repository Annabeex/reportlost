import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";
import { buildReportSlug } from "@/lib/slugify";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const id = req.nextUrl.searchParams.get("id");
    if (!id)
      return NextResponse.json(
        { ok: false, error: "missing id" },
        { status: 400 }
      );

    const supabase = getSupabaseAdmin();
    if (!supabase) {
      return NextResponse.json(
        { ok: false, error: "Missing Supabase env vars" },
        { status: 500 }
      );
    }

    // 1) Récupérer les champs nécessaires pour générer le slug
    const { data: item, error } = await supabase
      .from("lost_items")
      .select(`
        id, public_id, slug, title, city, state_id,
        transport_type, transport_type_other, place_type, place_type_other
      `)
      .eq("id", id)
      .maybeSingle();

    if (error || !item) {
      return NextResponse.json(
        { ok: false, error: error?.message || "not_found" },
        { status: 404 }
      );
    }

    // Si on a déjà un slug, on le renvoie tel quel
    if (item.slug) {
      return NextResponse.json({ ok: true, slug: item.slug }, { status: 200 });
    }

    // 2) Construire le slug de base
    const base = buildReportSlug({
      title: item.title,
      city: item.city,
      state_id: item.state_id,
      transport_type: item.transport_type,
      transport_type_other: item.transport_type_other,
      place_type: item.place_type,
      place_type_other: item.place_type_other,
    });

    let finalSlug = base;

    // 3) Gérer collision : si le slug existe déjà, on suffixe
    const { data: exists } = await supabase
      .from("lost_items")
      .select("id")
      .eq("slug", finalSlug)
      .limit(1);

    if (exists && exists.length > 0) {
      const suffix =
        (item.public_id && String(item.public_id)) ||
        String(item.id).replace(/[^a-f0-9]/gi, "").slice(0, 8);
      finalSlug = `${base}-${suffix}`.toLowerCase();
    }

    // 4) Enregistrer le slug
    const { error: upErr } = await supabase
      .from("lost_items")
      .update({ slug: finalSlug })
      .eq("id", item.id);

    if (upErr) {
      return NextResponse.json(
        { ok: false, error: upErr.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ ok: true, slug: finalSlug }, { status: 200 });
  } catch (e: any) {
    console.error("generate-report-slug error:", e);
    return NextResponse.json(
      { ok: false, error: "unexpected" },
      { status: 500 }
    );
  }
}
