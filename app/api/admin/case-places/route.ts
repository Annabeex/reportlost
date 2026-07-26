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
      .select(
        "id, public_id, title, description, circumstances, primary_category, city, state_id, date, time_slot, address, loss_street, loss_neighborhood, place_type, place_type_other, paid"
      )
      .eq("id", lostItemId)
      .maybeSingle();
    if (!item) return NextResponse.json({ error: "Dossier introuvable" }, { status: 404 });
    if (!item.paid) return NextResponse.json({ error: "Réservé aux dossiers payants" }, { status: 403 });

    const lossPlace = [item.loss_street, item.loss_neighborhood, (item as any).place_type_other || item.place_type]
      .filter(Boolean)
      .join(", ");
    const report = `Objet : ${item.title || item.description || "?"}
Description : ${item.description || "?"}
Perdu à : ${item.city || "?"}${item.state_id ? ", " + item.state_id : ""}${item.address ? " — " + item.address : ""}
Lieu précis : ${lossPlace || "?"}
Circonstances racontées par le client (SOURCE LA PLUS IMPORTANTE, souvent des noms d'établissements ou de villes voisines) : ${(item as any).circumstances || "non renseignées"}
Date : ${item.date || "?"} (${item.time_slot || "?"})
Adresse relais anonyme du dossier : item${item.public_id || ""}@reportlost.org`;

    // 1) Génération des requêtes Google adaptées au dossier
    const queriesRaw = await callClaude(
      `Tu génères des requêtes Google pour trouver les canaux de contact (email ou formulaire) des entités locales susceptibles de recevoir un objet trouvé aux États-Unis. Réponds UNIQUEMENT avec un tableau JSON de 3 à 5 chaînes, sans commentaire.`,
      `Signalement :\n${report}\n\nGénère les requêtes DANS CET ORDRE : d'abord les organismes publics qui gèrent les objets trouvés du coin (police department, city hall / lost and found municipal), ENSUITE 1 ou 2 établissements ou lieux que le client dit avoir fréquentés dans les circonstances (restaurant, bar, hôtel nommé..., ex: "Woodys restaurant Tupelo MS contact phone"), et si les circonstances citent une autre ville voisine, ajoute la police ou mairie de cette ville. Chaque requête doit viser la page de contact / lost and found de l'entité, ex: "Blythe CA police department lost and found contact email".`,
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
    // Toujours : un bâtiment public proche du lieu de perte (adresse de référence
    // pour les formulaires de police qui exigent une adresse)
    queries.push(
      `${lossPlace ? lossPlace + " " : ""}${item.city} ${item.state_id || ""} public library OR city hall OR post office address`
    );

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
- L'EMAIL est TOUJOURS le canal préféré. Priorité : 1) email du service lost & found ; 2) sinon N'IMPORTE QUEL email de l'établissement trouvé dans les résultats (info@, contact@, records@, front desk...), en demandant gentiment le transfert au bon service ; 3) le formulaire de contact seulement en COMPLÉMENT, quand on n'est pas sûr que l'email aboutisse.
- Le téléphone n'est jamais un canal de contact, mais s'il apparaît dans les résultats, mentionne-le à titre informatif ("📞 info : ..."). Idem adresse postale ("📍 ...").
- Section obligatoire à la fin de la liste : "📍 Adresse de référence près du lieu de perte" : un bâtiment public (bibliothèque, mairie, poste...) trouvé dans les résultats, avec son adresse complète — Anna l'utilise pour les formulaires de police qui exigent une adresse de client ou de lieu quand elle ne l'a pas. Uniquement une adresse présente dans les résultats.
- Réponds en français à Anna. Structure : liste priorisée (3-6 entités) avec pour chacune : nom, canal (email trouvé / formulaire URL), source (le lien d'où vient l'info).
- Termine par DEUX brouillons de mail en anglais : (A) pour les organismes PUBLICS (police, mairie...) : ton factuel et administratif, l'email personnel du client peut y figurer si utile ; (B) pour les LIEUX FRÉQUENTÉS par le client (restaurant, bar, hôtel, commerce) : ton chaleureux et humain, mentionner la grande valeur SENTIMENTALE de l'objet pour son propriétaire (adapter : souvenir de famille, cadeau...) SANS JAMAIS parler de valeur monétaire ni de récompense, une touche d'émotion sobre (une phrase), demander gentiment de vérifier auprès de l'équipe si l'objet a été retrouvé ou mis de côté, et UNIQUEMENT l'adresse relais item${item.public_id || ""}@reportlost.org comme contact. RÈGLES COMMUNES : sujet contenant #${item.public_id || ""} ; texte brut SANS aucun symbole markdown (pas de **, pas de #, pas de tirets de ponctuation) ; JAMAIS de placeholder [Client Name] ou [Client Phone/Email] ; inclure la variante "could you kindly forward this to the appropriate department" quand l'adresse email est générique ; signature exacte :
Anna
ReportLost.org
Encadre chacun avec SUBJECT: puis <<<EMAIL ... EMAIL>>>.`,
      `Signalement :\n${report}\n\nRésultats de recherche Google :\n\n${results}`,
      2500
    );

    // 4) Sauvegarde automatique dans le dossier (note interne, visible timeline + contexte IA)
    try {
      await sb.from("case_messages").insert({
        lost_item_id: item.id,
        public_id: item.public_id,
        direction: "note",
        subject: "Recherche établissements (qui contacter)",
        body_text: reply,
      });
    } catch (e) {
      console.error("[case-places] sauvegarde note:", e);
    }

    return NextResponse.json({ reply, queries });
  } catch (e: any) {
    console.error("[case-places] fatal:", e);
    return NextResponse.json({ error: String(e?.message || e) }, { status: 500 });
  }
}
