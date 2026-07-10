// app/api/admin/poster-caption/[id]/route.ts
// Génère la légende réseaux sociaux (EN) + traduction française (FR) pour un signalement.

import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const ANTHROPIC_MODEL = process.env.ANTHROPIC_MODEL || "claude-haiku-4-5";

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  if (!process.env.ANTHROPIC_API_KEY) {
    return NextResponse.json({ ok: false, error: "ANTHROPIC_API_KEY manquant" }, { status: 400 });
  }
  const sb = getSupabaseAdmin();
  if (!sb) return NextResponse.json({ ok: false, error: "supabase admin indisponible" }, { status: 500 });

  const { data: row } = await sb
    .from("lost_items")
    .select("title, description, primary_category, city, state_id, place_type, place_type_other, date, public_id")
    .eq("public_id", params.id)
    .maybeSingle();

  if (!row) return NextResponse.json({ ok: false, error: "dossier introuvable" }, { status: 404 });

  const email = `item${row.public_id || params.id}@reportlost.org`;
  const info = [
    `Item: ${row.title || row.primary_category || "lost item"}`,
    `Description: ${row.description || ""}`,
    `City: ${row.city || ""} ${row.state_id || ""}`,
    `Place: ${row.place_type_other || row.place_type || ""}`,
    `Date: ${row.date || ""}`,
    `Contact email: ${email}`,
  ].join("\n");

  try {
    const res = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: { "x-api-key": process.env.ANTHROPIC_API_KEY!, "anthropic-version": "2023-06-01", "content-type": "application/json" },
      body: JSON.stringify({
        model: ANTHROPIC_MODEL,
        max_tokens: 500,
        system: "You write warm, tasteful lost & found captions for Instagram/Facebook. Reply ONLY with JSON.",
        messages: [
          {
            role: "user",
            content: `${info}

Return JSON:
{"en":"an English caption: 2-4 short lines, warm and hopeful, urging anyone who found it to help, ending with 'If found, please email ${email}', then a new line with 6-10 relevant hashtags (city, item type, #lostandfound, #reportlost, etc.)",
 "fr":"a natural French translation of the same caption (keep the email address and the hashtags identical)"}`,
          },
        ],
      }),
    });
    if (!res.ok) return NextResponse.json({ ok: false, error: `Anthropic ${res.status}` }, { status: 500 });
    const data = await res.json();
    const m = String(data?.content?.[0]?.text ?? "").match(/\{[\s\S]*\}/);
    const j = m ? JSON.parse(m[0]) : {};
    return NextResponse.json({ ok: true, en: j.en || "", fr: j.fr || "" });
  } catch (e) {
    return NextResponse.json({ ok: false, error: (e as Error).message }, { status: 500 });
  }
}
