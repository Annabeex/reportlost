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
        max_tokens: 1000,
        system:
          "You write THIRD-PERSON social media captions for ReportLost.org, a platform that broadcasts lost-item reports on behalf of the owner. Never use the first person. Reply ONLY with JSON.",
        messages: [
          {
            role: "user",
            content: `${info}

Write a caption to help recover this lost item, from ReportLost.org's point of view (a platform posting on behalf of the owner).

Strict rules:
- THIRD PERSON ONLY. Never "I", "me", "my". Refer to "the owner" and "the item".
- Warm and human, but factual and respectful.
- Do NOT include any dangerous or private detail: no home address, no exact GPS / Find My location, no travel route home. Only the general area (city / neighborhood).
- Include the item description in the caption (the poster image only shows the object type, so the caption must carry the details) and highlight the distinctive features that help identification.

REQUIRED LAYOUT — 5 blocks separated by BLANK LINES (write them as \\n\\n inside the JSON strings):
1. Hook: "🚨 LOST in <City> (<State>) — <short item name>"
2. Short paragraph: where and when it was lost, then the description and distinctive features.
3. "🙏 Please share this post, especially with people in the <city/area> area — it really helps."
4. "📩 Found it or have any information? Please contact: ${email}"
5. One line of 12-16 hashtags, plain "#Tag" separated by spaces (item type, brand if known, city, state, neighborhood, #LostAndFound, #ReportLost, community/help tags).

Return JSON (all line breaks escaped as \\n, no raw newlines inside the strings):
{"en":"the English caption as described",
 "fr":"a natural French translation of the same caption; keep the email address and the hashtags identical to the English"}`,
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
