// app/api/admin/group-kit/route.ts
// Génère un "kit de lancement" de groupe Facebook pour une ville :
// nom de groupe, description (promo page reportlost), 3 posts de démarrage,
// et 3 posts "FOUND ✅" basés sur de vrais objets trouvés publics (Serper).

import { NextRequest, NextResponse } from "next/server";
import { serperSearch } from "@/lib/matchWatch/core";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

const ANTHROPIC_MODEL = process.env.ANTHROPIC_MODEL || "claude-haiku-4-5";

function slugify(s: string): string {
  return String(s || "").trim().toLowerCase().replace(/\s+/g, "-").replace(/-+/g, "-").replace(/(^-|-$)/g, "");
}

async function claudeJSON(system: string, user: string, maxTokens = 1400): Promise<any> {
  const key = process.env.ANTHROPIC_API_KEY;
  if (!key) throw new Error("ANTHROPIC_API_KEY manquant");
  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: { "x-api-key": key, "anthropic-version": "2023-06-01", "content-type": "application/json" },
    body: JSON.stringify({ model: ANTHROPIC_MODEL, max_tokens: maxTokens, system, messages: [{ role: "user", content: user }] }),
  });
  if (!res.ok) throw new Error(`Anthropic ${res.status}: ${(await res.text().catch(() => "")).slice(0, 200)}`);
  const data = await res.json();
  const txt = String(data?.content?.[0]?.text ?? "");
  const m = txt.match(/\{[\s\S]*\}/);
  return m ? JSON.parse(m[0]) : {};
}

export async function POST(req: NextRequest) {
  if (!process.env.ANTHROPIC_API_KEY) {
    return NextResponse.json({ ok: false, error: "ANTHROPIC_API_KEY manquant" }, { status: 400 });
  }
  const body = await req.json().catch(() => null);
  const city = String(body?.city || "").trim();
  const state = String(body?.state || "").trim().toUpperCase();
  if (!city || !state) return NextResponse.json({ ok: false, error: "ville et État requis" }, { status: 400 });

  const cityUrl = `https://reportlost.org/lost-and-found/${state.toLowerCase()}/${slugify(city)}`;

  // Vrais objets trouvés publics récents (best effort, non bloquant)
  let foundLeads: { title: string; snippet: string; link: string }[] = [];
  if (process.env.SERPER_API_KEY) {
    try {
      const r1 = await serperSearch(`found ${city} ${state}`, null as any).catch(() => []);
      const r2 = await serperSearch(`found ${city} site:facebook.com`, null as any).catch(() => []);
      const seen = new Set<string>();
      foundLeads = [...r1, ...r2]
        .filter((r) => {
          if (seen.has(r.link)) return false;
          seen.add(r.link);
          return /found|lost and found/i.test(`${r.title} ${r.snippet}`);
        })
        .slice(0, 8)
        .map((r) => ({ title: r.title, snippet: r.snippet, link: r.link }));
    } catch {
      foundLeads = [];
    }
  }

  const foundBlock = foundLeads.length
    ? foundLeads.map((l) => `- ${l.title} — ${l.snippet} (${l.link})`).join("\n")
    : "(no public 'found' leads available)";

  const tones = [
    "warm and welcoming",
    "upbeat and energetic",
    "calm and reassuring",
    "practical and down-to-earth",
    "friendly and neighborly",
    "hopeful and encouraging",
  ];
  const tone = tones[Math.floor(Math.random() * tones.length)];

  const system =
    "You write fresh, natural, NON-templated Facebook group content for ReportLost.org (a lost & found service). Every output must feel human and unique — avoid AI clichés and repetitive phrasing. Reply ONLY with valid JSON.";
  const user = `City: ${city}, ${state}
ReportLost city page URL (promote this exact link): ${cityUrl}

Recent PUBLIC "found item" posts seen online in this area (real leads to reference, may be imperfect):
${foundBlock}

Produce JSON in US English:
{
  "groupName": "a catchy, searchable Facebook group name people would search when they lose/find something in this city (include the city name)",
  "description": "a ${tone}, natural 110-180 word group description in US English, SPECIFIC to ${city}. BANNED phrases (never use, nor close variants): 'reunite people with their lost items', 'connect people/neighbors with their lost items', 'come to the right place', 'neighbors helping neighbors', 'neighbors support neighbors', 'we're here to help', 'trusted community', 'belongings back home', 'together we make ... a community', 'beloved pets'. Write fresh human copy; if you know ${city}, name a real local spot or two; invite members to post things they find; include this exact link ONCE for reporting a lost item: ${cityUrl}. Vary structure and wording so it never reads like a template.",
  "posts": ["exactly 3 short engaging starter posts (welcome + how the group works + a call to post found items). 2-4 sentences each, friendly, 1-2 emojis, and avoid the banned clichés above."],
  "foundPosts": ["up to 3 short shareable posts built from the real 'found' leads above. Each MUST start with 'FOUND ✅', summarize the item and where it was found, add 'seen in a public group — verify before claiming', and include the source URL. If there are no usable leads, return []."]
}`;

  let kit: any;
  try {
    kit = await claudeJSON(system, user);
  } catch (e) {
    return NextResponse.json({ ok: false, error: (e as Error).message }, { status: 500 });
  }

  return NextResponse.json({
    ok: true,
    cityUrl,
    groupName: kit.groupName || "",
    description: kit.description || "",
    posts: Array.isArray(kit.posts) ? kit.posts : [],
    foundPosts: Array.isArray(kit.foundPosts) ? kit.foundPosts : [],
  });
}
