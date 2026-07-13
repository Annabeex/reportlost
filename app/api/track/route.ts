// app/api/track/route.ts
// Compteur d'usage anonyme (liste blanche d'événements, aucune donnée personnelle).
import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const ALLOWED = new Set(["poster_png", "poster_pdf"]);

export async function POST(req: NextRequest) {
  try {
    const { event } = await req.json();
    if (!ALLOWED.has(String(event))) return NextResponse.json({ ok: false }, { status: 400 });

    const sb = getSupabaseAdmin();
    if (sb) await sb.from("events").insert({ event: String(event) });
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ ok: false }, { status: 200 }); // jamais bloquant côté client
  }
}
