// app/api/admin/match-toggle/route.ts
// Exclure / réintégrer un dossier de la veille IA, ou forcer un dossier <12 $.
// action: 'exclude' | 'include' | 'force_on' | 'force_off'

import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const sb = getSupabaseAdmin();
  if (!sb) return NextResponse.json({ ok: false, error: "supabase admin indisponible" }, { status: 500 });

  const body = await req.json().catch(() => null);
  const id = body?.id ? String(body.id) : "";
  const action = String(body?.action || "");
  if (!id) return NextResponse.json({ ok: false, error: "id manquant" }, { status: 400 });

  const nowIso = new Date().toISOString();
  let patch: Record<string, any> = {};

  switch (action) {
    case "exclude":
      patch = { search_status: "excluded" };
      break;
    case "include":
      patch = { search_status: "active", next_search_at: nowIso };
      break;
    case "force_on":
      patch = { force_search: true, search_status: "active", next_search_at: nowIso };
      break;
    case "force_off":
      patch = { force_search: false };
      break;
    default:
      return NextResponse.json({ ok: false, error: "action invalide" }, { status: 400 });
  }

  const { data, error } = await sb
    .from("lost_items")
    .update(patch)
    .eq("id", id)
    .select("id, search_status, force_search")
    .maybeSingle();

  if (error) return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true, ...(data || {}) });
}
