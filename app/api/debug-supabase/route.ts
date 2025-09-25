// app/api/debug-supabase/route.ts
import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export async function GET() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? null;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? null;

  console.info("debug-supabase: START - env present?", { hasUrl: !!url, hasKey: !!key });

  if (!url || !key) {
    console.error("debug-supabase: MISSING SUPABASE ENV", { url, key });
    return NextResponse.json({ ok: false, reason: "missing-env", url: !!url, key: !!key }, { status: 500 });
  }

  const supabase = createClient(url, key);

  try {
    // requête légère, limit 1
    const { data, error } = await supabase
      .from("us_cities")
      .select("city_ascii, state_id")
      .limit(1)
      .maybeSingle();

    if (error) {
      console.error("debug-supabase: query error", error);
      return NextResponse.json({ ok: false, reason: "query-error", error: error.message }, { status: 500 });
    }

    console.info("debug-supabase: query success", { sample: data });
    return NextResponse.json({ ok: true, sample: data });
  } catch (err) {
    console.error("debug-supabase: unexpected", err);
    return NextResponse.json({ ok: false, reason: "exception", error: String(err) }, { status: 500 });
  }
}
