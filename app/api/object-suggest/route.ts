import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const q = (searchParams.get("q") || "").trim();

  if (!q) return NextResponse.json({ items: [] }, { status: 200 });

  // Recherche ILIKE + tri par popularité puis pertinence simple
  const { data, error } = await supabase
    .from("object_catalog")
    .select("id,label,alt,popularity")
    .ilike("label", `%${q}%`)
    .order("popularity", { ascending: false })
    .limit(8);

  if (error) {
    console.error("object-suggest error:", error);
    return NextResponse.json({ items: [] }, { status: 200 });
  }

  return NextResponse.json({
    items: (data || []).map((r) => ({ id: r.id, label: r.label })),
  });
}
