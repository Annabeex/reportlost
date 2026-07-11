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

  const [{ data: item }, { data: messages }, { data: candidates }] = await Promise.all([
    sb
      .from("lost_items")
      .select(
        "id, public_id, created_at, title, description, primary_category, categories, city, state_id, date, time_slot, first_name, last_name, email, phone, contribution, paid, search_status, last_searched_at"
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
  ]);

  if (!item) throw new Error("Dossier introuvable");

  const parts: string[] = [];
  parts.push(`## Signalement #${item.public_id || item.id}
- Objet : ${item.title || item.description || "?"}
- Catégorie : ${item.primary_category || (item.categories || []).join(", ") || "?"}
- Description : ${item.description || "?"}
- Perdu à : ${item.city || "?"}${item.state_id ? ", " + item.state_id : ""} le ${item.date || "?"} (${item.time_slot || "heure inconnue"})
- Client : ${[item.first_name, item.last_name].filter(Boolean).join(" ") || "?"} <${item.email || "?"}>${item.phone ? " tel " + item.phone : ""}
- Contribution : ${item.contribution ?? 0} $ — payé : ${item.paid ? "oui" : "non"}
- Signalé le : ${fmtDate(item.created_at)} — veille : ${item.search_status || "?"} (dernier passage ${fmtDate(item.last_searched_at)})`);

  if (messages?.length) {
    parts.push(
      "## Historique des échanges (du plus ancien au plus récent)\n" +
        messages
          .map(
            (m) =>
              `[${fmtDate(m.created_at)}] ${m.direction === "in" ? "REÇU de " + (m.from_email || "?") : "ENVOYÉ à " + (m.to_email || "?")} — ${m.subject || "(sans sujet)"}\n${(m.body_text || "").slice(0, 1500)}`
          )
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
- Adapte-toi aux consignes d'Anna dans le chat (ton, contenu, geste commercial...). Sois concis.
- Rien n'est envoyé automatiquement : Anna valide toujours manuellement.`;

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
