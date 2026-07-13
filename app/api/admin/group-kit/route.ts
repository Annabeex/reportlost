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

  // Vrais objets/animaux trouvés publics récents (best effort, non bloquant).
  // Fenêtre "dernière semaine" (freshness qdr:w) + sources variées pour viser 3 posts.
  let foundLeads: { title: string; snippet: string; link: string }[] = [];
  if (process.env.SERPER_API_KEY) {
    try {
      const thisWeek = new Date().toISOString(); // -> freshness "qdr:w"
      const queries = [
        `found ${city} ${state}`,
        `"found" ${city} site:facebook.com`,
        `found dog OR found cat ${city} ${state}`,
        `found wallet OR found keys OR found phone ${city} ${state}`,
        `found ${city} ${state} site:craigslist.org OR site:nextdoor.com OR site:reddit.com`,
      ];
      const sets = await Promise.all(queries.map((q) => serperSearch(q, thisWeek).catch(() => [])));
      const seen = new Set<string>();
      foundLeads = sets
        .flat()
        .filter((r) => {
          if (seen.has(r.link)) return false;
          seen.add(r.link);
          return /found|lost and found/i.test(`${r.title} ${r.snippet}`);
        })
        .slice(0, 15)
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
    "You write fresh, natural, NON-templated Facebook group content for ReportLost.org (a lost & found service). Every output must feel human and unique. Avoid AI clichés and repetitive phrasing. STYLE RULES: never use dashes as punctuation (no em dash, no ' - '), use commas or separate sentences instead; no bullet lists inside the texts. GLOBALLY BANNED PHRASING (applies to every field, including any close variant): 'reunite ... with ...' in any form ('reunite people with their lost items', 'reunite it with its owner', 'reunite pets with their families'), 'connect people with their belongings', 'connect neighbors with their lost items', 'belongings back home', 'back where it belongs'. Express the idea differently every time (e.g. 'so the owner gets it back fast', 'so it finds its way home', 'to get it back into the right hands', or simply describe the action). SAFETY RULES: only everyday lost/found items and pets; NEVER mention found bodies, human remains, people, children, weapons, drugs or anything morbid, medical or disturbing, silently skip any lead of that kind. Reply ONLY with valid JSON.";
  const user = `City: ${city}, ${state}
ReportLost city page URL (promote this exact link): ${cityUrl}

Recent PUBLIC "found item" posts seen online in this area (real leads to reference, may be imperfect):
${foundBlock}

Produce JSON in US English:
{
  "groupName": "a catchy, searchable Facebook group name people would search when they lose/find something in this city. MUST include the city name AND the 2-letter state code (${state}). NEVER use the word 'Exchange'. Good patterns: '<City>, ${state} - Lost & Found', 'Lost & Found <City> ${state}', '<City> ${state} Lost & Found Community'",
  "description": "a ${tone}, natural 110-180 word group description in US English, SPECIFIC to ${city}. FORMAT: 2-3 short paragraphs separated by BLANK LINES (write them as \\n\\n inside the JSON string, never one big block) and 2-4 well-placed emojis (🔑 📱 🐕 📍 etc.). BANNED phrases (never use, nor close variants): 'reunite people with their lost items', 'connect people/neighbors with their lost items', 'come to the right place', 'neighbors helping neighbors', 'neighbors support neighbors', 'we're here to help', 'trusted community', 'belongings back home', 'together we make ... a community', 'beloved pets'. Write fresh human copy; if you know ${city}, name a real local spot or two; invite members to post things they find, lost pets included (the group is for lost items AND lost pets, give both kinds of examples); include this exact link ONCE for reporting a lost item: ${cityUrl}. Vary structure and wording so it never reads like a template.",
  "posts": ["EXACTLY ONE outstanding PINNED post (the group's welcome + rules + resources, written by a conversion expert). CRITICAL: Facebook truncates posts after ~2 lines with 'See more', so the ReportLost link block MUST be the VERY FIRST block of the post, visible without clicking. Structure, with \\n\\n between each block and 3-5 well-placed emojis total: (1) FIRST, a short help block (1-2 sentences, freshly worded each time, never a recycled template) that contains the link ${cityUrl} and gets across that ReportLost can take the search off their hands: report filed, local services contacted, alerts posted, months of monitoring; (2) a warm 1-2 sentence welcome specific to ${city} with a local touch; (3) how the group works: post what you LOST or FOUND, item or pet, with a photo, the area and the date, the more specific the better; (4) the golden rule for finders: keep one detail secret (an engraving, the color of a tag) so whoever claims it can prove it's really theirs; (5) a final line for pet owners: print a free lost pet poster in 2 minutes at https://reportlost.org/lost-pet-poster 🐕. Mix object and pet examples naturally, no dashes as punctuation, respect the globally banned phrasing, only cheerful ordinary examples, nothing dark."],
  "foundPosts": ["aim for EXACTLY 3 short shareable posts built ONLY from usable real 'found' leads above (everyday items or pets exclusively; silently drop any lead about people, remains or anything disturbing; pick the 3 most local and most recent). Each MUST start with 'FOUND ✅', summarize the item or pet and where it was found, add 'seen in a public group, verify before claiming', and include the source URL. Only return fewer than 3 if the usable leads truly run out; if none, return []."]
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
