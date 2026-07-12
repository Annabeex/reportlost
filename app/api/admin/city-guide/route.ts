// app/api/admin/city-guide/route.ts
// Lecture / sauvegarde / publication des guides ville.
// GET                  → liste des guides (state, city, status, updated_at)
// GET ?state=&city=    → un guide complet
// PUT {state, city, guide?, status?} → sauvegarde et/ou changement de statut
import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const sb = getSupabaseAdmin();
  if (!sb) return NextResponse.json({ error: "Supabase non configuré" }, { status: 500 });

  const state = req.nextUrl.searchParams.get("state");
  const city = req.nextUrl.searchParams.get("city");
  const citiesMode = req.nextUrl.searchParams.get("cities");

  // Mode "liste de travail" : villes triées par population + statut de guide
  if (citiesMode) {
    const q = (req.nextUrl.searchParams.get("q") || "").trim();
    const limit = Math.min(1000, Math.max(1, Number(req.nextUrl.searchParams.get("limit")) || 100));
    let query = sb
      .from("us_cities")
      .select("city_ascii, state_id, population")
      .order("population", { ascending: false })
      .limit(limit);
    if (q) query = query.ilike("city_ascii", `%${q}%`);
    const [{ data: cities, error: cErr }, { data: guides }] = await Promise.all([
      query,
      sb.from("city_guides").select("state_id, city_slug, status"),
    ]);
    if (cErr) return NextResponse.json({ error: cErr.message }, { status: 500 });
    const statusMap = new Map(
      (guides || []).map((g) => [`${g.state_id}/${g.city_slug}`, g.status as string])
    );
    const rows = (cities || []).map((c: any) => ({
      city: c.city_ascii,
      state: c.state_id,
      population: c.population ?? null,
      guide_status: statusMap.get(`${String(c.state_id).toUpperCase()}/${String(c.city_ascii).toLowerCase()}`) || null,
    }));
    return NextResponse.json({ ok: true, cities: rows });
  }

  if (state && city) {
    const { data, error } = await sb
      .from("city_guides")
      .select("state_id, city_slug, guide, status, verified, updated_at")
      .eq("state_id", state.toUpperCase())
      .eq("city_slug", city.toLowerCase())
      .maybeSingle();
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ ok: true, row: data });
  }

  const { data, error } = await sb
    .from("city_guides")
    .select("state_id, city_slug, status, verified, updated_at")
    .order("verified", { ascending: true })
    .order("updated_at", { ascending: false })
    .limit(300);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true, rows: data || [] });
}

export async function PUT(req: NextRequest) {
  try {
    const { state, city, guide, status, verified } = await req.json();
    if (!state || !city) return NextResponse.json({ error: "state et city requis" }, { status: 400 });
    if (status && !["draft", "published"].includes(status)) {
      return NextResponse.json({ error: "status invalide" }, { status: 400 });
    }

    const sb = getSupabaseAdmin();
    if (!sb) return NextResponse.json({ error: "Supabase non configuré" }, { status: 500 });

    const patch: Record<string, any> = { updated_at: new Date().toISOString() };
    if (guide) patch.guide = guide;
    if (status) patch.status = status;
    // Toute sauvegarde/publication manuelle vaut relecture ; le flag peut aussi être posé seul.
    if (typeof verified === "boolean") patch.verified = verified;
    else if (guide || status === "published") patch.verified = true;

    const stateUp = String(state).toUpperCase();
    const cityLow = String(city).toLowerCase();

    const { error } = await sb
      .from("city_guides")
      .update(patch)
      .eq("state_id", stateUp)
      .eq("city_slug", cityLow);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    // À la publication : renseigne title/meta SEO de la ville (us_cities) s'ils sont vides.
    if (status === "published") {
      try {
        let g = guide;
        if (!g) {
          const { data } = await sb
            .from("city_guides")
            .select("guide")
            .eq("state_id", stateUp)
            .eq("city_slug", cityLow)
            .maybeSingle();
          g = data?.guide;
        }
        const { data: cityRow } = await sb
          .from("us_cities")
          .select("id, city_ascii, static_title, static_content")
          .eq("state_id", stateUp)
          .ilike("city_ascii", cityLow)
          .maybeSingle();
        if (g && cityRow) {
          const stripHtml = (s: string) => String(s || "").replace(/<[^>]+>/g, "").replace(/\s+/g, " ").trim();
          const seoPatch: Record<string, string> = {};
          if (!cityRow.static_title) {
            seoPatch.static_title = `Lost & Found in ${cityRow.city_ascii}, ${stateUp}: Report a Lost Item`;
          }
          if (!cityRow.static_content) {
            const desc = stripHtml(g.heroSubtitle || (Array.isArray(g.intro) ? g.intro[0] : "") || "");
            if (desc) seoPatch.static_content = desc.slice(0, 300);
          }
          if (Object.keys(seoPatch).length) {
            await sb.from("us_cities").update(seoPatch).eq("id", cityRow.id);
          }
        }
      } catch (e) {
        console.error("[city-guide] maj SEO us_cities non bloquante:", e);
      }
    }

    return NextResponse.json({ ok: true });
  } catch (e: any) {
    return NextResponse.json({ error: String(e?.message || e) }, { status: 500 });
  }
}
