// lib/matchWatch/core.ts
// Cœur de la veille : recherche Serper + jugement Claude Haiku + cadence.
// Aucune dépendance Supabase ici (la route s'occupe de la base).

export type LostReport = {
  id: string;
  title: string | null;
  description: string | null;
  category: string | null;
  city: string | null;
  state_id: string | null;
  place: string | null; // lieu précis (place_type_other / place_type)
  lossDate: string | null; // ISO
  slug: string | null;
  public_id: string | null;
};

export type SerperResult = { title: string; link: string; snippet: string; date?: string; source: string };

export type Candidate = SerperResult & {
  verdict: "yes" | "maybe" | "no";
  confidence: number;
  reason: string;
};

const ANTHROPIC_MODEL = process.env.ANTHROPIC_MODEL || "claude-haiku-4-5";

// ---------------------------------------------------------------------------
// Claude Haiku (fetch direct, pas de SDK)
// ---------------------------------------------------------------------------
async function callHaiku(system: string, user: string, maxTokens = 400): Promise<string> {
  const key = process.env.ANTHROPIC_API_KEY;
  if (!key) throw new Error("ANTHROPIC_API_KEY manquant");

  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "x-api-key": key,
      "anthropic-version": "2023-06-01",
      "content-type": "application/json",
    },
    body: JSON.stringify({
      model: ANTHROPIC_MODEL,
      max_tokens: maxTokens,
      system,
      messages: [{ role: "user", content: user }],
    }),
  });

  if (!res.ok) {
    const t = await res.text().catch(() => "");
    throw new Error(`Anthropic ${res.status}: ${t.slice(0, 200)}`);
  }
  const data = await res.json();
  return String(data?.content?.[0]?.text ?? "");
}

function parseJson<T>(txt: string, fallback: T): T {
  try {
    const m = txt.match(/\{[\s\S]*\}/); // isole le premier objet JSON
    return m ? (JSON.parse(m[0]) as T) : fallback;
  } catch {
    return fallback;
  }
}

// ---------------------------------------------------------------------------
// 1) Termes de recherche (2-3 max) — vocabulaire d'un TROUVEUR
// ---------------------------------------------------------------------------
export async function generateItemTerms(report: LostReport): Promise<string[]> {
  const base = [report.title, report.description, report.category].filter(Boolean).join(" — ").slice(0, 500);
  try {
    const out = await callHaiku(
      "You produce concise web-search terms. Reply ONLY with JSON.",
      `A person lost this item: "${base}".
Give the 1 to 3 most common English words/phrases that SOMEONE WHO FOUND IT would likely use to describe it in a public "found item" post (e.g. a ring -> ["ring","wedding band"]; a plush toy -> ["plush","stuffed animal"]). Only include a synonym if it is genuinely common for this exact object. No brand unless clearly stated.
Reply as JSON: {"terms":["...","..."]}`,
      150
    );
    const parsed = parseJson<{ terms: string[] }>(out, { terms: [] });
    const terms = (parsed.terms || []).map((t) => String(t).trim()).filter(Boolean).slice(0, 3);
    if (terms.length) return terms;
  } catch {
    /* fallback ci-dessous */
  }
  // Fallback sans LLM : catégorie ou 1er mot du titre
  const fb = (report.category || report.title || "").toString().trim().split(/\s+/).slice(0, 2).join(" ");
  return fb ? [fb] : [];
}

// ---------------------------------------------------------------------------
// 2) Construction des requêtes (ville d'abord, lieu précis en escalade)
// ---------------------------------------------------------------------------
function termsExpr(terms: string[]): string {
  const clean = terms.filter(Boolean);
  if (clean.length <= 1) return clean[0] || "";
  return `(${clean.join(" OR ")})`;
}

export function buildQueries(report: LostReport, terms: string[], tier: "city" | "place"): string[] {
  const expr = termsExpr(terms);
  const loc =
    tier === "city"
      ? [report.city, report.state_id].filter(Boolean).join(" ")
      : [report.place, report.city].filter(Boolean).join(" ");
  if (!expr || !loc) return [];
  const base = `found ${expr} ${loc}`.replace(/\s+/g, " ").trim();
  return [
    base, // web général (attrape aussi Craigslist, forums, Nextdoor public…)
    `${base} site:facebook.com`, // Facebook public indexé + Marketplace
  ];
}

// ---------------------------------------------------------------------------
// 3) Serper
// ---------------------------------------------------------------------------
function freshnessFor(lossDate: string | null): string {
  // fenêtre de date : récent -> semaine, sinon mois (la veille répétée rattrape les posts tardifs)
  if (!lossDate) return "qdr:m";
  const days = (Date.now() - new Date(lossDate).getTime()) / 86400000;
  return days <= 10 ? "qdr:w" : "qdr:m";
}

export async function serperSearch(query: string, lossDate: string | null): Promise<SerperResult[]> {
  const key = process.env.SERPER_API_KEY;
  if (!key) throw new Error("SERPER_API_KEY manquant");

  const res = await fetch("https://google.serper.dev/search", {
    method: "POST",
    headers: { "X-API-KEY": key, "Content-Type": "application/json" },
    body: JSON.stringify({ q: query, gl: "us", hl: "en", num: 10, tbs: freshnessFor(lossDate) }),
  });
  if (!res.ok) {
    const t = await res.text().catch(() => "");
    throw new Error(`Serper ${res.status}: ${t.slice(0, 200)}`);
  }
  const data = await res.json();
  const organic: any[] = Array.isArray(data?.organic) ? data.organic : [];
  const source = query.includes("site:facebook.com") ? "facebook" : "web";
  return organic
    .filter((o) => o?.link && o?.title)
    .map((o) => ({
      title: String(o.title),
      link: String(o.link),
      snippet: String(o.snippet ?? ""),
      date: o.date ? String(o.date) : undefined,
      source,
    }));
}

// ---------------------------------------------------------------------------
// 4) Pré-filtre (avant de dépenser un appel LLM)
// ---------------------------------------------------------------------------
export function prefilter(results: SerperResult[], terms: string[], seenUrls: Set<string>): SerperResult[] {
  const t = terms.map((x) => x.toLowerCase()).filter(Boolean);
  const out: SerperResult[] = [];
  const localSeen = new Set<string>();
  for (const r of results) {
    if (seenUrls.has(r.link) || localSeen.has(r.link)) continue;
    const hay = `${r.title} ${r.snippet}`.toLowerCase();
    // garde si au moins un terme d'objet apparaît (évite le bruit pur)
    if (t.length && !t.some((term) => hay.includes(term.replace(/[()]/g, "")))) continue;
    localSeen.add(r.link);
    out.push(r);
  }
  return out;
}

// ---------------------------------------------------------------------------
// 5) Jugement Haiku : trouveur vs propriétaire, cohérence lieu/date/descriptif
// ---------------------------------------------------------------------------
export async function judgeCandidate(report: LostReport, r: SerperResult): Promise<Candidate> {
  const reportStr = [
    `Item: ${report.title ?? ""}`,
    `Description: ${report.description ?? ""}`,
    `Category: ${report.category ?? ""}`,
    `Lost in: ${[report.place, report.city, report.state_id].filter(Boolean).join(", ")}`,
    `Lost around: ${report.lossDate ?? "unknown"}`,
  ].join("\n");

  const candidateStr = [`Title: ${r.title}`, `Snippet: ${r.snippet}`, `Date: ${r.date ?? "unknown"}`, `URL: ${r.link}`].join("\n");

  const system =
    "You match lost-item reports to online posts. Be strict. Reply ONLY with JSON.";
  const user = `LOST REPORT:
${reportStr}

ONLINE RESULT:
${candidateStr}

Decide if this online result is a post by SOMEONE WHO FOUND this same item (a potential match), NOT a person who also lost it, and NOT an unrelated listing/shop.
Rules:
- "no" if it's someone looking for their own lost item, a store, an ad, or clearly a different object.
- The location must plausibly match (same city or nearby area).
- The date must be plausible (found on/after the loss date, not before).
Reply JSON: {"verdict":"yes|maybe|no","confidence":0-100,"reason":"one short sentence"}`;

  try {
    const out = await callHaiku(system, user, 200);
    const j = parseJson<{ verdict: string; confidence: number; reason: string }>(out, {
      verdict: "no",
      confidence: 0,
      reason: "unparsed",
    });
    const verdict = (["yes", "maybe", "no"].includes(j.verdict) ? j.verdict : "no") as Candidate["verdict"];
    return { ...r, verdict, confidence: Math.max(0, Math.min(100, Number(j.confidence) || 0)), reason: String(j.reason || "") };
  } catch (e) {
    return { ...r, verdict: "no", confidence: 0, reason: `judge error: ${(e as Error).message}` };
  }
}

// ---------------------------------------------------------------------------
// 6) Cadence dégressive : quotidien (7j) -> hebdo (30j) -> mensuel (6 mois) -> stop
// ---------------------------------------------------------------------------
export function computeNextSearch(createdAt: string | null): { next: Date | null; done: boolean } {
  const created = createdAt ? new Date(createdAt) : new Date();
  const ageDays = (Date.now() - created.getTime()) / 86400000;
  if (ageDays >= 180) return { next: null, done: true };
  const addDays = ageDays < 7 ? 1 : ageDays < 30 ? 7 : 30;
  return { next: new Date(Date.now() + addDays * 86400000), done: false };
}
