// app/api/diag/route.ts
import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const runtime = "nodejs";          // éviter Edge
export const dynamic = "force-dynamic";   // pas de cache ISR

function json(data: any, init?: ResponseInit) {
  const res = NextResponse.json(data, init);
  res.headers.set("Cache-Control", "no-store");
  return res;
}

export async function GET() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? process.env.SUPABASE_URL ?? null;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? process.env.SUPABASE_ANON_KEY ?? null;

  let lostOk = false;
  let foundOk = false;
  let err: string | null = null;

  if (!url || !key) {
    return json({
      env: { SUPABASE_URL: !!url, SUPABASE_ANON_KEY: !!key },
      tables: { lost_items: false, found_items: false },
      note: "Booleans only. No secrets are returned.",
      err: "Missing Supabase env vars",
    }, { status: 500 });
  }

  try {
    const sb = createClient(url, key);

    const { error: e1 } = await sb
      .from("lost_items")
      .select("id", { count: "exact", head: true });
    lostOk = !e1;

    const { error: e2 } = await sb
      .from("found_items")
      .select("id", { count: "exact", head: true });
    foundOk = !e2;

  } catch (e: any) {
    err = String(e?.message || e);
  }

  return json({
    env: { SUPABASE_URL: !!url, SUPABASE_ANON_KEY: !!key },
    tables: { lost_items: lostOk, found_items: foundOk },
    note: "Booleans only. No secrets are returned.",
    err,
  });
}
