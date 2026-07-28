// app/api/org/analyze-item/route.ts — saisie par photo : l'IA regarde la
// photo uploadée et pré-remplit la fiche (titre, description, libellé public
// générique). Coût ≈ 1 centime par objet (Haiku vision). L'agent garde la
// main : tout reste éditable avant enregistrement.
import { NextRequest, NextResponse } from "next/server";
import { getOrgContext } from "@/lib/orgAuth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 30;

const MODEL = process.env.ANTHROPIC_MODEL || "claude-haiku-4-5";

const SYSTEM = `You help a front desk agent log a found item from a photo. Reply ONLY with valid JSON:
{"title":"...","description":"...","public_label":"..."}

Rules:
- title: short and specific, like a person would say it, e.g. "Black leather wallet", "Blue JanSport backpack", "iPhone with red case". Max 8 words.
- description: 1-2 factual sentences for internal records: exact type, brand if visible, material, color, distinctive features (scratches, stickers, contents visible). This stays private and is used to verify ownership claims.
- public_label: GENERIC, 1-2 words only, e.g. "Wallet", "Phone", "Backpack", "Ring". Never include brand, color or details: the public must not be able to fake a claim from it.
- US English. If the photo shows no identifiable object, use {"title":"","description":"","public_label":""}.`;

export async function POST(req: NextRequest) {
  try {
    const ctx = await getOrgContext(req);
    if (!ctx?.org) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

    const b = await req.json().catch(() => null);
    const imageUrl = String(b?.image_url || "").trim();
    if (!/^https?:\/\//.test(imageUrl)) {
      return NextResponse.json({ error: "image_url requise" }, { status: 400 });
    }

    const key = process.env.ANTHROPIC_API_KEY;
    if (!key) return NextResponse.json({ error: "IA non configurée" }, { status: 500 });

    const res = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: { "x-api-key": key, "anthropic-version": "2023-06-01", "content-type": "application/json" },
      body: JSON.stringify({
        model: MODEL,
        max_tokens: 300,
        system: SYSTEM,
        messages: [
          {
            role: "user",
            content: [
              { type: "text", text: "Log this found item." },
              { type: "image", source: { type: "url", url: imageUrl } },
            ],
          },
        ],
      }),
    });
    if (!res.ok) {
      const t = await res.text().catch(() => "");
      return NextResponse.json({ error: `IA: ${res.status} ${t.slice(0, 120)}` }, { status: 502 });
    }
    const data = await res.json();
    const txt = (data?.content || []).filter((c: any) => c?.type === "text").map((c: any) => c.text).join("");
    const m = txt.match(/\{[\s\S]*?\}/);
    if (!m) return NextResponse.json({ error: "réponse IA illisible" }, { status: 502 });
    const j = JSON.parse(m[0]);

    return NextResponse.json({
      title: String(j.title || "").slice(0, 120),
      description: String(j.description || "").slice(0, 600),
      public_label: String(j.public_label || "").slice(0, 60),
    });
  } catch (e: any) {
    return NextResponse.json({ error: String(e?.message || e) }, { status: 500 });
  }
}
