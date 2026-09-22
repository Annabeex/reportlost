// app/api/org/lost-reports/route.ts — déclarations de perte reçues directement
// par l'établissement (page publique /campus/<slug> ou /at/<slug>).
//   GET   : les déclarations ouvertes
//   PATCH : { id, action: "close" | "reopen" }
import { NextRequest, NextResponse } from "next/server";
import { getOrgContext } from "@/lib/orgAuth";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";
import { CAMPUS_PREFIX } from "@/lib/orgMatchRun";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const ctx = await getOrgContext(req);
  if (!ctx?.org) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const sb = getSupabaseAdmin()!;

  const { data, error } = await sb
    .from("org_lost_reports")
    .select("id, code, title, description, lost_location, lost_at, name, email, phone, created_at, seen_at")
    .eq("org_id", ctx.org.id)
    .eq("status", "open")
    .order("created_at", { ascending: false })
    .limit(500);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true, reports: data || [] });
}

export async function PATCH(req: NextRequest) {
  const ctx = await getOrgContext(req);
  if (!ctx?.org) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const sb = getSupabaseAdmin()!;

  const b = await req.json().catch(() => null);
  const id = String(b?.id || "");
  const action = String(b?.action || "");
  // "seen" : l'agent a ouvert la liste, les déclarations ne sont plus « nouvelles ».
  if (action === "seen") {
    await sb.from("org_lost_reports").update({ seen_at: new Date().toISOString() })
      .eq("org_id", ctx.org.id).eq("status", "open").is("seen_at", null);
    return NextResponse.json({ ok: true });
  }
  if (!id || (action !== "close" && action !== "reopen")) {
    return NextResponse.json({ error: "requête invalide" }, { status: 400 });
  }

  const closing = action === "close";
  const { data, error } = await sb
    .from("org_lost_reports")
    .update({ status: closing ? "closed" : "open", closed_at: closing ? new Date().toISOString() : null })
    .eq("id", id)
    .eq("org_id", ctx.org.id) // borné à l'établissement du membre
    .select("id");
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  if (!data?.length) return NextResponse.json({ error: "introuvable" }, { status: 404 });

  // Une déclaration close ne doit plus rien proposer au bureau.
  if (closing) {
    await sb
      .from("org_matches")
      .update({ status: "dismissed", handled_by: ctx.email, handled_at: new Date().toISOString() })
      .eq("org_id", ctx.org.id)
      .eq("lost_item_id", `${CAMPUS_PREFIX}${id}`)
      .eq("status", "new");
  }
  return NextResponse.json({ ok: true });
}
