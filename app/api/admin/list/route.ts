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
          "birth_date",
          "private_detail",
          "circumstances",
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

    // Compteurs d'usage du générateur d'affiche (table events, non bloquant)
    let posterPngTotal: number | null = null;
    let posterPdfTotal: number | null = null;
    try {
      const [{ count: png }, { count: pdf }] = await Promise.all([
        supabase.from("events").select("id", { count: "exact", head: true }).eq("event", "poster_png"),
        supabase.from("events").select("id", { count: "exact", head: true }).eq("event", "poster_pdf"),
      ]);
      posterPngTotal = png ?? null;
      posterPdfTotal = pdf ?? null;
    } catch {
      /* table absente = pas grave */
    }

    // 📊 Production : guides publiés (total / 7 jours / 24h) + groupes FB (total / 7 jours)
    // 📈 Visites 7 jours par provenance (organique / social / IA / direct)
    const weekAgo = new Date(Date.now() - 7 * 86400000).toISOString();
    const dayAgo = new Date(Date.now() - 86400000).toISOString();
    const production: Record<string, number | null> = {};
    const visits: Record<string, number | null> = {};
    try {
      const cnt = (q: any) => q.then((r: any) => r.count ?? 0, () => 0);
      const [gTotal, gWeek, gDay, fbTotal, fbWeek, vOrg, vSoc, vAi, vDir] = await Promise.all([
        cnt(supabase.from("city_guides").select("id", { count: "exact", head: true }).eq("status", "published")),
        cnt(supabase.from("city_guides").select("id", { count: "exact", head: true }).eq("status", "published").gte("updated_at", weekAgo)),
        cnt(supabase.from("city_guides").select("id", { count: "exact", head: true }).eq("status", "published").gte("updated_at", dayAgo)),
        cnt(supabase.from("us_cities").select("id", { count: "exact", head: true }).eq("fb_group_done", true)),
        cnt(supabase.from("us_cities").select("id", { count: "exact", head: true }).eq("fb_group_done", true).gte("fb_group_done_at", weekAgo)),
        cnt(supabase.from("events").select("id", { count: "exact", head: true }).eq("event", "visit_organic").gte("created_at", weekAgo)),
        cnt(supabase.from("events").select("id", { count: "exact", head: true }).eq("event", "visit_social").gte("created_at", weekAgo)),
        cnt(supabase.from("events").select("id", { count: "exact", head: true }).eq("event", "visit_ai").gte("created_at", weekAgo)),
        cnt(supabase.from("events").select("id", { count: "exact", head: true }).eq("event", "visit_direct").gte("created_at", weekAgo)),
      ]);
      production.guidesTotal = gTotal;
      production.guidesWeek = gWeek;
      production.guidesDay = gDay;
      production.fbTotal = fbTotal;
      production.fbWeek = fbWeek;
      visits.organic = vOrg;
      visits.social = vSoc;
      visits.ai = vAi;
      visits.direct = vDir;
    } catch {
      /* non bloquant */
    }

    // Villes qui apparaissent pour la 1ère fois : le 1er signalement de chaque ville
    // (payé ou non) -> c'est là qu'on propose de créer un groupe Facebook.
    let firstIds = new Set<string>();
    try {
      const { data: cityRows } = await supabase
        .from("lost_items")
        .select("id, city, state_id, created_at");
      const earliest = new Map<string, { id: string; ts: number }>();
      for (const p of cityRows || []) {
        const kk = `${String(p.state_id || "").toUpperCase()}/${String(p.city || "").trim().toLowerCase()}`;
        const ts = p.created_at ? new Date(p.created_at).getTime() : Infinity;
        const cur = earliest.get(kk);
        if (!cur || ts < cur.ts) earliest.set(kk, { id: String(p.id), ts });
      }
      firstIds = new Set(Array.from(earliest.values()).map((v) => v.id));
    } catch {
      /* non bloquant */
    }

    // Villes dont le groupe Facebook est déjà créé (case cochée sur la page kit)
    let fbDoneKeys = new Set<string>();
    try {
      const { data: fbRows } = await supabase
        .from("us_cities")
        .select("city_ascii, state_id")
        .eq("fb_group_done", true);
      fbDoneKeys = new Set(
        (fbRows || []).map(
          (r: any) =>
            `${String(r.state_id || "").toUpperCase()}/${String(r.city_ascii || "").trim().toLowerCase()}`
        )
      );
    } catch {
      /* non bloquant */
    }

    const lostWithFlag = (lost ?? []).map((it: any) => {
      const cityKey = `${String(it.state_id || "").toUpperCase()}/${String(it.city || "")
        .replace(/\s*\([^)]*\)\s*$/, "")
        .trim()
        .toLowerCase()}`;
      return {
        ...it,
        first_in_city: firstIds.has(String(it.id)),
        fb_group_done: fbDoneKeys.has(cityKey),
      };
    });

    return NextResponse.json(
      {
        lost: lostWithFlag,
        found: found ?? [],
        lostTotal: lostTotal ?? null,
        foundTotal: foundTotal ?? null,
        paidTotal: paidTotal ?? null,
        posterPngTotal,
        posterPdfTotal,
        production,
        visits,
      },
      { status: 200 }
    );
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "unknown error" }, { status: 500 });
  }
}
