// app/api/cwv/route.ts — réception des mesures Core Web Vitals du terrain.
// Publique par nécessité (elle reçoit les navigateurs des visiteurs), donc tout
// est borné et validé : aucune valeur libre n'atteint la base.
import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const METRIQUES = new Set(["CLS", "LCP", "INP"]);

export async function POST(req: NextRequest) {
  try {
    const b = await req.json().catch(() => null);
    if (!b || !METRIQUES.has(String(b.metric))) {
      return NextResponse.json({ ok: false }, { status: 400 });
    }
    const valeur = Number(b.value);
    if (!Number.isFinite(valeur) || valeur < 0 || valeur > 100) {
      return NextResponse.json({ ok: false }, { status: 400 });
    }
    const chemin = String(b.path || "");
    if (chemin && (!chemin.startsWith("/") || chemin.startsWith("//"))) {
      return NextResponse.json({ ok: false }, { status: 400 });
    }

    const sb = getSupabaseAdmin();
    if (!sb) return NextResponse.json({ ok: true }); // silencieux : ne jamais gêner le visiteur

    await sb.from("cwv_samples").insert({
      metric: String(b.metric),
      value: valeur,
      path: chemin.split("?")[0].slice(0, 160) || null,
      selector: String(b.selector || "").slice(0, 300) || null,
      viewport_w: Number.isFinite(Number(b.viewport_w)) ? Math.round(Number(b.viewport_w)) : null,
      nav_type: String(b.nav_type || "").slice(0, 24) || null,
    });
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ ok: true });
  }
}
