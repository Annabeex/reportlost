// app/api/org/create/route.ts — création d'une organisation (statut: à vérifier)
import { NextRequest, NextResponse } from "next/server";
import { getOrgContext } from "@/lib/orgAuth";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const TYPES = new Set(["police", "city", "university", "hotel", "transit", "other"]);

function slugify(s: string) {
  return String(s).toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9\s-]/g, "").trim().replace(/\s+/g, "-").replace(/-+/g, "-").slice(0, 60);
}

export async function POST(req: NextRequest) {
  const ctx = await getOrgContext(req);
  if (!ctx) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  if (ctx.org) return NextResponse.json({ error: "Vous avez déjà une organisation." }, { status: 400 });

  const body = await req.json().catch(() => null);
  const name = String(body?.name || "").trim();
  const type = TYPES.has(body?.type) ? body.type : "other";
  const state_id = String(body?.state_id || "").trim().toUpperCase().slice(0, 2) || null;
  const city = String(body?.city || "").trim() || null;
  const public_email = String(body?.public_email || "").trim() || null;
  if (!name || name.length < 3) return NextResponse.json({ error: "Nom requis" }, { status: 400 });

  const sb = getSupabaseAdmin();
  if (!sb) return NextResponse.json({ error: "Supabase non configuré" }, { status: 500 });

  // slug unique
  let slug = slugify(`${name} ${city || ""}`);
  const { data: taken } = await sb.from("organizations").select("id").eq("slug", slug).maybeSingle();
  if (taken) slug = `${slug}-${Math.random().toString(36).slice(2, 6)}`;

  const { data: org, error } = await sb
    .from("organizations")
    .insert({ slug, name, type, state_id, city, public_email })
    .select("id, slug, name, type, state_id, city, public_email, verified, plan")
    .single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const { error: mErr } = await sb.from("org_members").insert({ org_id: org.id, user_id: ctx.userId, role: "admin" });
  if (mErr) return NextResponse.json({ error: mErr.message }, { status: 500 });

  return NextResponse.json({ ok: true, org });
}
