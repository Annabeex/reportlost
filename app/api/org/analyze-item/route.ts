// app/api/org/analyze-item/route.ts — saisie par photo : l'IA regarde la
// photo uploadée et pré-remplit la fiche (titre, description, libellé public
// générique). Coût ≈ 1 centime par objet (Haiku vision). L'agent garde la
// main : tout reste éditable avant enregistrement.
import { NextRequest, NextResponse } from "next/server";
import { getOrgContext } from "@/lib/orgAuth";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 30;

const MODEL = process.env.ANTHROPIC_MODEL || "claude-haiku-4-5";

// Plafond mensuel par établissement. C'est le SEUL appel payant du portail :
// sans plafond, l'outil offert devient une facture ouverte. organizations.ai_quota
// le relève au cas par cas — c'est la marche payante, on vend un quota.
const MONTHLY_QUOTA = Math.max(0, Number(process.env.ORG_AI_MONTHLY_QUOTA || 100));

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

    // Le compteur est incrémenté AVANT l'appel, et dans la même transaction que
    // sa vérification : deux agents qui scannent en même temps ne peuvent pas
    // passer tous les deux. Un échec de l'appel est remboursé plus bas.
    const sb = getSupabaseAdmin();
    let used = 0;
    let quota = MONTHLY_QUOTA;
    if (sb) {
      const { data, error: qErr } = await sb.rpc("org_ai_consume", {
        p_org: ctx.org.id,
        p_limit: MONTHLY_QUOTA,
      });
      if (qErr) {
        // Compteur indisponible : on refuse plutôt que de laisser passer.
        // Un quota qui s'ouvre en cas de panne n'est pas un quota.
        return NextResponse.json({ error: "quota indisponible" }, { status: 503 });
      }
      const row = Array.isArray(data) ? data[0] : data;
      used = Number(row?.used || 0);
      quota = Number(row?.quota || MONTHLY_QUOTA);
      if (!row?.allowed) {
        return NextResponse.json(
          {
            error: "quota_exceeded",
            used,
            quota,
            message: `Automatic scan is limited to ${quota} items per month. Log items manually, or contact us to raise the limit.`,
          },
          { status: 402 }
        );
      }
    }

    const orgId = ctx.org.id;
    const refund = async () => {
      if (!sb) return;
      try {
        await sb.rpc("org_ai_refund", { p_org: orgId });
      } catch {
        /* le remboursement est une faveur, jamais une cause d'échec */
      }
    };

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
      await refund(); // un appel raté ne se décompte pas
      const t = await res.text().catch(() => "");
      return NextResponse.json({ error: `IA: ${res.status} ${t.slice(0, 120)}` }, { status: 502 });
    }
    const data = await res.json();
    const txt = (data?.content || []).filter((c: any) => c?.type === "text").map((c: any) => c.text).join("");
    const m = txt.match(/\{[\s\S]*?\}/);
    if (!m) {
      await refund();
      return NextResponse.json({ error: "réponse IA illisible" }, { status: 502 });
    }
    const j = JSON.parse(m[0]);

    return NextResponse.json({
      title: String(j.title || "").slice(0, 120),
      description: String(j.description || "").slice(0, 600),
      public_label: String(j.public_label || "").slice(0, 60),
      used,
      quota,
    });
  } catch (e: any) {
    return NextResponse.json({ error: String(e?.message || e) }, { status: 500 });
  }
}
