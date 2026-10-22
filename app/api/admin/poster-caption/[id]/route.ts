// app/api/admin/poster-caption/[id]/route.ts
// Génère la légende réseaux sociaux (EN) + traduction française (FR) pour un signalement.

import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";
import { extractJson } from "@/lib/extractJson";
import { texteAnthropic } from "@/lib/anthropicText";

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
          "You write THIRD-PERSON social media captions for ReportLost.org, a platform that broadcasts lost-item reports on behalf of the owner. Your tone is factual, calm and sober, like a well-run public notice. Never use the first person. Reply ONLY with JSON.",
        messages: [
          {
            role: "user",
            content: `${info}

Write a short caption to help recover this lost item, from ReportLost.org's point of view (a platform posting on behalf of the owner).

Strict rules:
- THIRD PERSON ONLY. Never "I", "me", "my". Refer to "the owner" and "the item".
- Tone: factual and sober. No exclamation marks, no superlatives, no urgency, no emotional embellishment ("treasured", "delicate", "each charm tells a story", "would be so grateful", "means the world"). If the description itself states a sentimental fact (for example a gift from a parent), you may mention it once, in a plain factual clause.
- Use only the facts given. Do not guess how or exactly where the item was lost ("likely between...", "may have fallen..."). If the date is more than a year ago, do not write as if the loss were recent.
- NO DASHES as punctuation: never use the characters "—" or "–", never use " - " to join two parts of a sentence, and never write a range with a dash (write "1970 to 1973"). Use a colon, a comma or a full stop instead.
- WITHHOLD THE IDENTIFYING DETAILS. The owner uses them to check that a person who claims to have found the item really has it. Describe the item only by its type, color, material and brand if known, plus at most ONE general feature. Never list engravings, initials, names, inscriptions, specific charms or pendants, stickers, scratches, missing stones, serial numbers, the contents of a bag or wallet, a phone case design or a lock screen. Write instead that the owner can describe further details to confirm ownership.
- Do NOT include any dangerous or private detail: no home address, no exact GPS / Find My location, no travel route home. Only the general area (city / neighborhood).
- Keep the first two blocks under 80 words in total.

REQUIRED LAYOUT: 5 blocks separated by BLANK LINES (write them as \\n\\n inside the JSON strings):
1. Hook: "🔎 LOST in <City>, <State>: <short item name>"
2. Short paragraph: when and where it was lost, the general description, then a sentence saying the owner can describe further details to confirm ownership.
3. "Sharing this post with people in the <city/area> area helps."
4. "📩 Found it or have any information? Please write to ${email}. No personal contact details are published."
5. One line of 5 to 8 hashtags, plain "#Tag" separated by spaces: item type, brand if known, city, state, #LostAndFound, #ReportLost. No generic engagement tags such as #ShareThis, #HelpNeeded, #FindIt or #CommunityHelp.

Return JSON (all line breaks escaped as \\n, no raw newlines inside the strings):
{"en":"the English caption as described",
 "fr":"a natural French translation of the same caption, following the same rules (no dashes, same withheld details); keep the email address and the hashtags identical to the English"}`,
          },
        ],
      }),
    });
    if (!res.ok) return NextResponse.json({ ok: false, error: `Anthropic ${res.status}` }, { status: 500 });
    const data = await res.json();
    const parsed = extractJson<any>(texteAnthropic(data));
    const j = parsed.ok ? parsed.value : {};
    // Filet de sécurité : le modèle glisse parfois un tiret malgré la consigne.
    const sansTirets = (t: string) => t.replace(/\s*[—–]\s*/g, ", ").replace(/ - /g, ", ");
    return NextResponse.json({ ok: true, en: sansTirets(j.en || ""), fr: sansTirets(j.fr || "") });
  } catch (e) {
    return NextResponse.json({ ok: false, error: (e as Error).message }, { status: 500 });
  }
}
