// app/api/org/settings/route.ts — réglages de l'organisation (page publique on/off)
import { NextRequest, NextResponse } from "next/server";
import { getOrgContext } from "@/lib/orgAuth";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function PATCH(req: NextRequest) {
  const ctx = await getOrgContext(req);
  if (!ctx?.org) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const b = await req.json().catch(() => null);
  const patch: Record<string, any> = {};
  if (typeof b?.public_listing === "boolean") patch.public_listing = b.public_listing;
  if (!Object.keys(patch).length) return NextResponse.json({ error: "rien à modifier" }, { status: 400 });

  const sb = getSupabaseAdmin()!;
  const { error } = await sb.from("organizations").update(patch).eq("id", ctx.org.id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
