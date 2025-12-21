import { NextResponse } from "next/server";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

// ————————————————————————————————————————
// Supabase PUBLIC server client (anon key)
// ————————————————————————————————————————
function getPublicSB(): SupabaseClient {
  const url =
    process.env.NEXT_PUBLIC_SUPABASE_URL ||
    process.env.SUPABASE_URL;

  const anon =
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
    process.env.SUPABASE_ANON_KEY;

  if (!url || !anon) {
    throw new Error("Missing Supabase public env vars");
  }

  return createClient(url, anon);
}

const sb = getPublicSB();

// ————————————————————————————————————————
// GET /api/stations/get?slug=...
// ————————————————————————————————————————
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const slug = searchParams.get("slug");

  if (!slug) {
    return NextResponse.json(
      { error: "Missing slug" },
      { status: 400 }
    );
  }

  const { data, error } = await sb
    .from("stations")
    .select("*")
    .eq("slug", slug)
    .maybeSingle();

  if (error) {
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }

  return NextResponse.json({ data });
}
