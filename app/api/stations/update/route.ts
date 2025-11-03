import { NextResponse } from "next/server";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";

// ————————————————————————————————————————
// Supabase server client (fallback local)
// ————————————————————————————————————————
function getSB(): SupabaseClient {
  const admin = getSupabaseAdmin();
  if (admin) return admin as unknown as SupabaseClient;

  const url =
    process.env.SUPABASE_URL ||
    process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key =
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.SUPABASE_ANON_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !key) throw new Error("Missing Supabase env vars");
  return createClient(url, key);
}

const sb = getSB();

export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  if (!body?.slug || !body?.display_name) {
    return NextResponse.json({ ok: false, error: "slug and display_name required" }, { status: 400 });
  }

  const payload = {
    slug: body.slug,
    display_name: body.display_name,
    url_path: body.url_path ?? null,
    qr_target_url: body.qr_target_url ?? null,
    brand_blue: body.brand_blue ?? null,
    brand_green: body.brand_green ?? null,
  };

  const { error } = await sb.from("stations").upsert(payload, { onConflict: "slug" });
  if (error) return NextResponse.json({ ok: false, error: error.message }, { status: 500 });

  return NextResponse.json({ ok: true });
}
