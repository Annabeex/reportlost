// lib/matchWatch/core.ts
// Cœur de la veille : recherche Serper + jugement Claude Haiku + cadence.
// Aucune dépendance Supabase ici (la route s'occupe de la base).

import { extractJsonOr } from "@/lib/extractJson";
import { texteAnthropic } from "@/lib/anthropicText";

export type LostReport = {
  id: string;
  title: string | null;
  description: string | null;
  category: string | null;
  circumstances: string | null; // contexte de la perte (aide au jugement)
  city: string | null;
  state_id: string | null;
  place: string | null; // lieu précis (place_type_other / loss_street / loss_neighborhood / place_type)
  lossDate: string | null; // ISO
  slug: string | null;
  public_id: string | null;
  email: string | null; // email du client sur reportlost
  photo?: string | null; // object_photo (URL) si fournie
  visual?: string | null; // description visuelle générée depuis la photo
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
  return texteAnthropic(data);
}

// Décrit la photo du signalement (une seule lecture d'image par dossier)
export async function describePhoto(url: string): Promise<string> {
  const key = process.env.ANTHROPIC_API_KEY;
  if (!key || !url) return "";
  try {
    const res = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "x-api-key": key,
        "anthropic-version": "2023-06-01",
        "content-type": "application/json",
      },
      body: JSON.stringify({
        model: ANTHROPIC_MODEL,
        max_tokens: 200,
        system: "You describe lost items factually so they can be matched against 'found item' posts.",
        messages: [
          {
            role: "user",
            content: [
              {
                type: "text",
                text: "Describe this lost item for matching: exact type/style, material, color, and any distinctive features. One or two factual sentences.",
              },
              { type: "image", source: { type: "url", url } },
            ],
          },
        ],
      }),
    });
    if (!res.ok) return "";
    const data = await res.json();
    return texteAnthropic(data);
  } catch {
    return "";
  }
}

// Normalise une URL pour le dédoublonnage : même annonce sous des liens variés
// (fbclid, m.facebook, www, / final…) -> une seule clé.
export function normalizeUrl(u: string): string {
  try {
    const url = new URL(String(u).trim());
    url.hostname = url.hostname.toLowerCase().replace(/^(m|www|web|l|mobile)\./, "");
    const drop = /^(fbclid|utm_|gclid|ref$|ref_src|__tn__|__cft__|mibextid|rdid|share_url|igshid|si)$/i;
    const params = new URLSearchParams();
    url.searchParams.forEach((v, k) => {
      if (!drop.test(k)) params.append(k, v);
    });
    const q = params.toString();
    const path = url.pathname.replace(/\/+$/, "");
    return `https://${url.hostname}${path}${q ? "?" + q : ""}`;
  } catch {
    return String(u || "").trim().replace(/[?#].*$/, "").replace(/\/+$/, "");
  }
}

function parseJson<T>(txt: string, fallback: T): T {
  // La capture gloutonne d'origine allait du premier « { » au DERNIER « } ».
  // extractJsonOr équilibre les accolades et s'arrête au premier objet complet.
  return extractJsonOr<T>(txt, fallback);
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

// ---------------------------------------------------------------------------
// 3 bis) Filtres durs, AVANT le juge
// ---------------------------------------------------------------------------
// Le prompt demandait déjà au modèle d'écarter les annonces antérieures à la
// perte et celles d'une autre région. Il ne le fait pas de façon fiable : le
// dossier #96208 (portefeuille perdu le 14/09 à Shelbyville, Indiana) a reçu un
// MAYBE 62 % sur un post écossais publié le 6/09 — huit jours AVANT la perte,
// et sur un autre continent. Une règle qu'un code peut appliquer ne se confie
// pas à un modèle. Ces filtres s'exécutent avant l'appel à Haiku : ils coûtent
// zéro token et ne se trompent pas.

/** Interprète la date renvoyée par Serper : "Sep 6, 2026" ou "2 weeks ago". */
export function parsePostDate(raw: string | null | undefined, now = Date.now()): Date | null {
  const s = String(raw || "").trim();
  if (!s) return null;

  const rel = s.match(/(\d+)\s*(minute|hour|day|week|month|year)s?\s+ago/i);
  if (rel) {
    const n = Number(rel[1]);
    const ms: Record<string, number> = {
      minute: 60000, hour: 3600000, day: 86400000,
      week: 604800000, month: 2629800000, year: 31557600000,
    };
    return new Date(now - n * (ms[rel[2].toLowerCase()] || 0));
  }
  if (/^(yesterday)$/i.test(s)) return new Date(now - 86400000);
  if (/^(today|just now)$/i.test(s)) return new Date(now);

  const d = new Date(s);
  return Number.isNaN(d.getTime()) ? null : d;
}

/** Domaines nationaux incompatibles avec une perte aux États-Unis. */
const TLD_HORS_US = /\.(uk|ie|au|nz|za|in|ph|sg|my|pk|ng|ke)(\/|$|\?)/i;

/**
 * Marqueurs d'anglais non américain. Deux catégories : les « forts », qui
 * suffisent seuls, et les orthographes, qui doivent se cumuler (« centre »
 * existe dans des noms de rue américains).
 */
const MARQUEURS_FORTS = /(£|\bpostcode\b|\bcar park\b|\blorry\b|\bpetrol\b|\bchemist\b|\bhigh street\b|\bcouncil estate\b|\bpram\b|\bmobile number\b|\bthe barbers\b|\bwhilst\b|\bqueue\b)/i;
const MARQUEURS_FAIBLES = /(\bcolour\b|\bfavourite\b|\bneighbourhood\b|\bcentre\b|\bmetre\b|\blicence\b|\bjewellery\b|\btyre\b|\bkerb\b|\baluminium\b|\bmum\b|\brealise\b|\borganised\b)/i;

export type Rejet = { rejete: true; raison: string } | { rejete: false };

/**
 * Vérifie ce qui est vérifiable sans modèle : la chronologie et le continent.
 * Tolérance d'un jour sur la date, les fuseaux et les dates relatives de Serper
 * n'étant pas à l'heure près.
 */
export function filtreDur(report: LostReport, r: SerperResult, now = Date.now()): Rejet {
  // 1) une annonce publiée avant la perte ne peut pas concerner cet objet
  const perte = report.lossDate ? new Date(report.lossDate) : null;
  const publie = parsePostDate((r as any).date, now);
  if (perte && publie && !Number.isNaN(perte.getTime())) {
    const joursAvant = (perte.getTime() - publie.getTime()) / 86400000;
    if (joursAvant > 1) {
      return { rejete: true, raison: `publié ${Math.round(joursAvant)} j avant la perte` };
    }
  }

  // 2) un domaine national étranger, pour une perte aux États-Unis
  if (TLD_HORS_US.test(r.link || "")) {
    return { rejete: true, raison: `domaine hors US (${(r.link || "").slice(0, 60)})` };
  }

  // 3) l'anglais du texte n'est pas américain
  const texte = `${r.title || ""} ${(r as any).snippet || ""}`;
  if (MARQUEURS_FORTS.test(texte)) {
    return { rejete: true, raison: `vocabulaire non américain (${texte.match(MARQUEURS_FORTS)?.[0]})` };
  }
  const faibles = texte.match(new RegExp(MARQUEURS_FAIBLES.source, "gi")) || [];
  if (new Set(faibles.map((x) => x.toLowerCase())).size >= 2) {
    return { rejete: true, raison: `orthographes non américaines (${[...new Set(faibles)].join(", ")})` };
  }

  return { rejete: false };
}

export async function judgeCandidate(report: LostReport, r: SerperResult): Promise<Candidate> {
  // Ce que le code peut trancher, le code le tranche : pas d'appel au modèle.
  const dur = filtreDur(report, r);
  if (dur.rejete) return { ...r, verdict: "no", confidence: 0, reason: `écarté : ${dur.raison}` };

  const reportStr = [
    `Item: ${report.title ?? ""}`,
    `Description: ${report.description ?? ""}`,
    `Category: ${report.category ?? ""}`,
    `Context: ${report.circumstances ?? ""}`,
    `Visual (from owner's photo): ${report.visual ?? ""}`,
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
- If a "Visual" description of the owner's item is given, the found item must match that specific style, material and color. A different-looking item of the same category (e.g. a beaded bracelet vs a silver chain bracelet) is NOT a match.
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
// 6) Cadence dégressive : quotidien (7j) -> hebdo (30j) -> mensuel -> stop
//    Durée totale : 12 mois pour team-assisted search (>= 25 $).
//    Le palier 180 j reste en place pour les anciens dossiers payés 12 $, qui
//    doivent continuer d'être veillés jusqu'au terme promis à l'époque.
// ---------------------------------------------------------------------------
export const PREMIUM_CONTRIBUTION = Number(process.env.MATCH_PREMIUM_CONTRIB || 25);

export function computeNextSearch(
  createdAt: string | null,
  contribution?: number | null
): { next: Date | null; done: boolean } {
  const created = createdAt ? new Date(createdAt) : new Date();
  const ageDays = (Date.now() - created.getTime()) / 86400000;
  const maxDays = (contribution ?? 0) >= PREMIUM_CONTRIBUTION ? 365 : 180;
  if (ageDays >= maxDays) return { next: null, done: true };
  const addDays = ageDays < 7 ? 1 : ageDays < 30 ? 7 : 30;
  return { next: new Date(Date.now() + addDays * 86400000), done: false };
}
