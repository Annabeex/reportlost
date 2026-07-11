// app/api/admin/case-places/route.ts
// "Qui contacter ?" avec de VRAIES coordonnées : recherche Serper (Google) autour du
// lieu de perte, puis synthèse Haiku limitée aux résultats trouvés (pas d'invention).
// Contact par EMAIL (préférence) ou FORMULAIRE uniquement — jamais téléphone.
// Protégé par le middleware Basic Auth (/api/admin/*).
import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

const MODEL = process.env.CASE_CHAT_MODEL || process.env.ANTHROPIC_MODEL || "claude-haiku-4-5";

async function callClaude(system: string, user: string, maxTokens = 2000): Promise<string> {
  const key = process.env.ANTHROPIC_API_KEY;
  if (!key) throw new Error("ANTHROPIC_API_KEY manquant");
  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: { "x-api-key": key, "anthropic-version": "2023-06-01", "content-type": "application/json" },
    body: JSON.stringify({ model: MODEL, max_tokens: maxTokens, system, messages: [{ role: "user", content: user }] }),
  });
  if (!res.ok) throw new Error(`Anthropic ${res.status}: ${(await res.text().catch(() => "")).slice(0, 200)}`);
  const data = await res.json();
  return String(data?.content?.[0]?.text ?? "");
}

async function serper(query: string, num = 6): Promise<{ title: string; link: string; snippet: string }[]> {
  const key = process.env.SERPER_API_KEY;
  if (!key) throw new Error("SERPER_API_KEY manquant");
  const res = await fetch("https://google.serper.dev/search", {
    method: "POST",
    headers: { "X-API-KEY": key, "Content-Type": "application/json" },
    body: JSON.stringify({ q: query, gl: "us", hl: "en", num }),
  });
  if (!res.ok) return [];
  const data = await res.json();
  const organic: any[] = Array.isArray(data?.organic) ? data.organic : [];
  return organic
    .filter((o) => o?.link && o?.title)
    .map((o) => ({ title: String(o.title), link: String(o.link), snippet: String(o.snippet || "") }));
}

export async function POST(req: NextRequest) {
  try {
    const { lostItemId } = await req.json();
    if (!lostItemId) return NextResponse.json({ error: "lostItemId requis" }, { status: 400 });

    const sb = getSupabaseAdmin();
    if (!sb) return NextResponse.json({ error: "Supabase non configuré" }, { status: 500 });

    const { data: item } = await sb
      .from("lost_items")
      .select("id, public_id, title, description, primary_category, city, state_id, date, time_slot, address, paid")
      .eq("id", lostItemId)
      .maybeSingle();
    if (!item) return NextResponse.json({ error: "Dossier introuvable" }, { status: 404 });
    if (!item.paid) return NextResponse.json({ error: "Réservé aux dossiers payants" }, { status: 403 });

    const report = `Objet : ${item.title || item.description || "?"}
Description : ${item.description || "?"}
Perdu à : ${item.city || "?"}${item.state_id ? ", " + item.state_id : ""}${item.address ? " — " + item.address : ""}
Date : ${item.date || "?"} (${item.time_slot || "?"})`;

    // 1) Génération des requêtes Google adaptées au dossier
    const queriesRaw = await callClaude(
      `Tu génères des requêtes Google pour trouver les canaux de contact (email ou formulaire) des entités locales susceptibles de recevoir un objet trouvé aux États-Unis. Réponds UNIQUEMENT avec un tableau JSON de 3 à 5 chaînes, sans commentaire.`,
      `Signalement :\n${report}\n\nGénère les requêtes (police department, city hall, et selon le lieu de perte : parc, restaurant, hôtel, transit, aéroport, mall...). Chaque requête doit viser la page de contact / lost and found de l'entité, ex: "Blythe CA police department lost and found contact email".`,
      400
    );
    let queries: string[] = [];
    try {
      queries = JSON.parse(queriesRaw.replace(/```json|```/g, "").trim());
    } catch {
      queries = [
        `${item.city} ${item.state_id || ""} police department lost and found contact email`,
        `${item.city} ${item.state_id || ""} city hall contact email`,
      ];
    }
    queries = queries.slice(0, 5);

    // 2) Recherches Serper en parallèle
    const resultSets = await Promise.all(queries.map((q) => serper(q).catch(() => [])));
    const results = queries
      .map((q, i) => {
        const rows = resultSets[i]
          .map((r) => `- ${r.title}\n  ${r.link}\n  ${r.snippet}`)
          .join("\n");
        return `### Requête : ${q}\n${rows || "(aucun résultat)"}`;
      })
      .join("\n\n");

    // 3) Synthèse stricte (pas d'invention)
    const reply = await callClaude(
      `Tu aides Anna (ReportLost.org) à contacter les établissements susceptibles d'avoir reçu un objet perdu.
Règles STRICTES :
- Tu ne peux utiliser QUE les informations présentes dans les résultats de recherche fournis. N'invente JAMAIS d'email, d'URL, d'adresse ou de téléphone.
- Le canal à utiliser pour contacter est EMAIL (préférence) ou FORMULAIRE de contact. Le téléphone n'est jamais un canal de contact, mais si un numéro apparaît dans les résultats, mentionne-le à titre informatif (ligne "📞 info : ...") — Anna peut en avoir besoin pour le client.
- Idem pour l'adresse postale si elle apparaît dans les résultats ("📍 ...").
- Si tu trouves un email précis du service lost & found : propose-le.
- Si tu ne trouves qu'un email générique (info@, contact@, records@...) ou une page contact : propose-le en précisant que le mail demandera un transfert au bon service ("could you kindly forward this to the appropriate department").
- Si tu ne trouves ni email ni formulaire pour une entité : dis-le et donne le lien le plus utile trouvé.
- Réponds en français à Anna. Structure : liste priorisée (3-6 entités) avec pour chacune : nom, canal (email trouvé / formulaire URL / page contact URL), source (le lien d'où vient l'info).
- Termine par UN brouillon de mail type en anglais réutilisable pour ces établissements, sujet contenant #${item.public_id || ""}, avec la variante "please forward to the appropriate department" quand l'adresse est générique. Encadre-le avec SUBJECT: puis <<<EMAIL ... EMAIL>>>.`,
      `Signalement :\n${report}\n\nRésultats de recherche Google :\n\n${results}`,
      2500
    );

    return NextResponse.json({ reply, queries });
  } catch (e: any) {
    console.error("[case-places] fatal:", e);
    return NextResponse.json({ error: String(e?.message || e) }, { status: 500 });
  }
}
