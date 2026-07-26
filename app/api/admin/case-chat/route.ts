// app/api/admin/case-chat/route.ts
// Chat Claude avec tout le contexte d'un dossier (signalement + échanges + veille).
// Protégé par le middleware Basic Auth (/api/admin/*).
import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

const MODEL = process.env.CASE_CHAT_MODEL || process.env.ANTHROPIC_MODEL || "claude-haiku-4-5";

type ChatMsg = { role: "user" | "assistant"; content: string };

function fmtDate(d?: string | null) {
  return d ? new Date(d).toISOString().slice(0, 16).replace("T", " ") : "?";
}

async function buildContext(lostItemId: string): Promise<string> {
  const sb = getSupabaseAdmin();
  if (!sb) throw new Error("Supabase non configuré");

  const [{ data: item }, { data: messages }, { data: candidates }, { data: establishments }] = await Promise.all([
    sb
      .from("lost_items")
      .select(
        "id, public_id, created_at, title, description, circumstances, primary_category, categories, city, state_id, date, time_slot, first_name, last_name, email, phone, address, birth_date, private_detail, contribution, paid, search_status, last_searched_at"
      )
      .eq("id", lostItemId)
      .maybeSingle(),
    sb
      .from("case_messages")
      .select("direction, from_email, to_email, subject, body_text, created_at")
      .eq("lost_item_id", lostItemId)
      .order("created_at", { ascending: true })
      .limit(60),
    sb
      .from("match_candidates")
      .select("url, title, snippet, verdict, confidence, reason")
      .eq("lost_item_id", lostItemId)
      .in("verdict", ["yes", "maybe"])
      .order("created_at", { ascending: false })
      .limit(10),
    sb
      .from("case_establishments")
      .select("name, email, url, contacted_email, contacted_form, notes")
      .eq("lost_item_id", lostItemId)
      .order("created_at", { ascending: true }),
  ]);

  if (!item) throw new Error("Dossier introuvable");
  if (!item.paid) throw new Error("Assistant IA réservé aux dossiers payants");

  const parts: string[] = [];
  parts.push(`## Signalement #${item.public_id || item.id}
- Objet : ${item.title || item.description || "?"}
- Catégorie : ${item.primary_category || (item.categories || []).join(", ") || "?"}
- Description : ${item.description || "?"}
- Circonstances de la perte : ${(item as any).circumstances || "non renseignées"}
- Perdu à : ${item.city || "?"}${item.state_id ? ", " + item.state_id : ""} le ${item.date || "?"} (${item.time_slot || "heure inconnue"})
- Client : ${[item.first_name, item.last_name].filter(Boolean).join(" ") || "?"} <${item.email || "?"}>${item.phone ? " tel " + item.phone : ""}
- Contribution : ${item.contribution ?? 0} $ — payé : ${item.paid ? "oui" : "non"}
- Signalé le : ${fmtDate(item.created_at)} — veille : ${item.search_status || "?"} (dernier passage ${fmtDate(item.last_searched_at)})
- Adresse relais anonyme du dossier (à donner aux établissements) : item${item.public_id || ""}@reportlost.org
- Détail privé vérificateur (⚠️ JAMAIS dans un mail public ni à un établissement, sert uniquement à vérifier une réclamation) : ${(item as any).private_detail || "(non renseigné)"}
- Date de naissance (pour dépôts police uniquement) : ${(item as any).birth_date || "(non renseignée)"}
- Adresse postale du client : ${(item as any).address || "(non renseignée)"}`);

  if (messages?.length) {
    parts.push(
      "## Historique des échanges (du plus ancien au plus récent)\n" +
        messages
          .map((m) => {
            const head =
              m.direction === "in"
                ? "REÇU de " + (m.from_email || "?")
                : m.direction === "note"
                ? "NOTE INTERNE d'Anna (consigne à prendre en compte)"
                : "ENVOYÉ à " + (m.to_email || "?");
            return `[${fmtDate(m.created_at)}] ${head} — ${m.subject || "(sans sujet)"}\n${(m.body_text || "").slice(0, 1500)}`;
          })
          .join("\n---\n")
    );
  } else {
    parts.push("## Historique des échanges\n(aucun message archivé pour ce dossier)");
  }

  if (candidates?.length) {
    parts.push(
      "## Pistes trouvées par la veille automatique\n" +
        candidates
          .map(
            (c) =>
              `- [${c.verdict} ${c.confidence ?? "?"}%] ${c.title || c.url}\n  ${c.url}\n  ${c.snippet || ""}\n  Raison : ${c.reason || ""}`
          )
          .join("\n")
    );
  }

  if (establishments?.length) {
    parts.push(
      "## Établissements lost & found suivis pour ce dossier\n" +
        establishments
          .map(
            (e) =>
              `- ${e.name}${e.email ? " <" + e.email + ">" : ""}${e.url ? " " + e.url : ""} — contacté par mail : ${e.contacted_email ? "OUI" : "non"} · par formulaire : ${e.contacted_form ? "OUI" : "non"}${e.notes ? " — notes : " + e.notes : ""}`
          )
          .join("\n")
    );
  }

  return parts.join("\n\n");
}

const SYSTEM = `Tu es l'assistant d'Anna, fondatrice de ReportLost.org (service de signalement d'objets perdus aux États-Unis).
Tu as le contexte complet d'un dossier ci-dessous. Tu aides Anna à :
- comprendre où en est le dossier et suggérer les prochaines actions ;
- rédiger des réponses aux clients et des messages aux établissements lost & found (aéroports, hôtels, transports, police...).

Règles :
- Tu discutes avec Anna en français.
- Les brouillons d'emails destinés aux clients ou établissements sont en ANGLAIS (sauf si Anna demande autre chose), signés "The ReportLost Team".
- Quand tu proposes un email, encadre-le EXACTEMENT ainsi pour qu'Anna puisse l'utiliser en un clic :
SUBJECT: <sujet>
<<<EMAIL
<corps du mail>
EMAIL>>>
- RÈGLES DE TOUT BROUILLON D'EMAIL : texte brut sans AUCUN symbole markdown (pas de **, pas de #), pas de tirets de ponctuation, jamais de placeholder ([Client Name], [Phone]...). Coordonnées du client : l'email personnel du client peut être transmis UNIQUEMENT aux organismes publics (police, mairie/city hall, animal control) quand c'est utile au dossier ; pour tout établissement privé (hôtel, commerce, restaurant, transport privé...), UNIQUEMENT l'adresse relais anonyme du dossier (item<public_id>@reportlost.org, indiquée dans le contexte). Signature établissements : exactement "Anna\nReportLost.org". Pour les clients : signature "Warm regards,\nAnna\nLost Item Investigation Team\nReportLost.org".
- Adapte-toi aux consignes d'Anna dans le chat (ton, contenu, geste commercial...). Sois concis.
- Rien n'est envoyé automatiquement : Anna valide toujours manuellement.

## Le "mail initial d'enquête" (quand Anna demande le mail initial)
Adapte ce modèle au dossier (objet, ville, lieu, créneau, prénom). Garde ce ton chaleureux et professionnel.
⚠️ Ce mail reste au niveau VILLE : les circonstances servent au ciblage des contacts, pas à réécrire ce mail. Ne pas y détailler les établissements cités par le client.

SUBJECT: Your lost item case Update (<public_id>)
<<<EMAIL
Hello <prénom>,

My name is Anna, and I'm assisting you with the manual investigation regarding your lost <objet précis> in <ville, état> (ID <public_id>).

I'm really sorry this happened. I'll do everything I can to help increase the chances of getting it back.

An initial scan across major online sources, community groups, and public lost-and-found platforms for the <ville> area has been completed. No matching report has surfaced yet, but this is completely normal at this early stage — new posts can appear at any moment.

Based on the information you provided (<résumé des circonstances : lieu, créneau, date>), we have reached out to the main local entities most likely to receive found items:

<liste de 2-3 entités locales pertinentes : nom, rôle en une ligne. Adapte au contexte : police locale et city hall par défaut ; ajoute le parc, le restaurant, l'hôtel, le réseau de transport ou l'aéroport si le lieu de perte s'y prête>

Next steps on our side:

- Continue outreach to nearby businesses and high-traffic spots along the area where you may have walked.
- Our automated monitoring keeps scanning the entire web and social networks (community groups, marketplaces, neighborhood pages) and re-checks regularly to catch any new "found <type d'objet>" post in or around <ville>.
- I will keep following your case and notify you immediately if anything new is reported.

Warm regards,
Anna
Lost Item Investigation Team
ReportLost.org
EMAIL>>>

## Suggestions d'établissements à contacter
Quand Anna demande qui contacter : propose une liste courte et priorisée (3 à 6) adaptée au lieu de perte — police locale, city hall, puis selon le contexte : parc (administration), restaurant/hôtel (directement), transports, aéroport, centre commercial... Pour chacun : nom, moyen de contact probable (email ou formulaire web), et sur demande un brouillon de mail en anglais (sujet contenant #<public_id>). IMPORTANT : tu n'as pas accès au web — signale les adresses, téléphones et emails précis comme "(à vérifier)" plutôt que de les affirmer. Anna les vérifie puis les ajoute à sa liste d'établissements.

## DEUX modèles de mail établissement (choisis selon le destinataire)

### A. Organisme PUBLIC (police, city hall, animal control, transit public)
Ton factuel et administratif. L'email personnel du client peut y figurer si utile. Structure : signalement de l'objet perdu, description précise, lieu, date et créneau, demande de vérification des registres lost & found ou de transfert au bon service, référence #<public_id>, contact de réponse.

### B. Lieu FRÉQUENTÉ par le client (restaurant, bar, hôtel, commerce, taxi...)
Ton chaleureux et humain, on s'adresse à une équipe qui peut avoir envie d'aider. Règles : mentionner que l'objet a une grande valeur SENTIMENTALE pour son propriétaire (souvenir de famille, cadeau, compagnon de voyage... adapte à l'objet) SANS JAMAIS évoquer de valeur monétaire ni de récompense ; jouer sur l'émotion avec sobriété, une phrase suffit, pas de pathos ; demander gentiment de vérifier auprès de l'équipe (salle, ménage, comptoir) si l'objet a été retrouvé ou mis de côté ; UNIQUEMENT l'adresse relais item<public_id>@reportlost.org comme contact, jamais l'email du client. Exemple d'esprit (à reformuler à chaque fois, jamais copié tel quel) :

SUBJECT: Lost <objet> at <établissement>, could your team check? (#<public_id>)
<<<EMAIL
Hello,

I'm reaching out on behalf of one of our clients who lost a <objet précis> at <établissement> on <date>, likely <moment/contexte : during dinner, at the bar...>.

Beyond the object itself, this <objet court> carries real sentimental value for its owner, <une phrase sobre adaptée : it was her grandmother's, a gift from his late father, it holds years of family photos...>. Getting it back would mean a lot.

Would you mind checking with your team (floor staff, cleaning, front desk) whether it was found or set aside? If it turns up, simply reply to this email: item<public_id>@reportlost.org

Thank you so much for taking a minute for this.

Anna
ReportLost.org
EMAIL>>>`;

export async function POST(req: NextRequest) {
  try {
    const { lostItemId, messages } = (await req.json()) as {
      lostItemId: string;
      messages: ChatMsg[];
    };
    if (!lostItemId || !Array.isArray(messages) || messages.length === 0) {
      return NextResponse.json({ error: "lostItemId et messages requis" }, { status: 400 });
    }

    const key = process.env.ANTHROPIC_API_KEY;
    if (!key) return NextResponse.json({ error: "ANTHROPIC_API_KEY manquant" }, { status: 500 });

    const context = await buildContext(lostItemId);

    const res = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "x-api-key": key,
        "anthropic-version": "2023-06-01",
        "content-type": "application/json",
      },
      body: JSON.stringify({
        model: MODEL,
        max_tokens: 1500,
        system: `${SYSTEM}\n\n=== CONTEXTE DU DOSSIER ===\n${context}`,
        messages: messages.slice(-20).map((m) => ({ role: m.role, content: m.content })),
      }),
    });

    if (!res.ok) {
      const t = await res.text().catch(() => "");
      return NextResponse.json({ error: `Anthropic ${res.status}: ${t.slice(0, 200)}` }, { status: 502 });
    }
    const data = await res.json();
    const reply = String(data?.content?.[0]?.text ?? "");
    return NextResponse.json({ reply });
  } catch (e: any) {
    console.error("[case-chat] fatal:", e);
    return NextResponse.json({ error: String(e?.message || e) }, { status: 500 });
  }
}
