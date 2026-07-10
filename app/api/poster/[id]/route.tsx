// app/api/poster/[id]/route.tsx
// Poster social "WANTED" en PNG 1080x1080 pour un signalement.
// Un léger passage IA nettoie le titre + choisit la couleur de catégorie,
// puis un template (next/og) met en forme joliment. Photo intégrée si dispo.
// URL : /api/poster/{public_id}

import { ImageResponse } from "next/og";

export const runtime = "edge";

// Correspondance couleur (palette coolors), selon la demande
const COLORS: Record<string, string> = {
  jewelry: "#ffd6a5", // bijou -> orange clair
  watch: "#ffd6a5", // montre -> orange clair
  electronics: "#a0c4ff", // électronique -> bleu
  bag: "#ffadad", // sac / porte-monnaie
  wallet: "#caffbf", // portefeuille -> vert
  documents: "#fdffb6", // documents / livres / papiers -> jaune
  keys: "#bdb2ff", // clés -> violet
  other: "#a0c4ff", // non catégorisé -> bleu
};

function fallbackColorKey(text: string): string {
  const c = (text || "").toLowerCase();
  if (/watch/.test(c)) return "watch";
  if (/ring|bracelet|necklace|jewel|earring|gold|silver|pendant/.test(c)) return "jewelry";
  if (/wallet|billfold/.test(c)) return "wallet";
  if (/bag|purse|handbag|backpack|coin|pouch/.test(c)) return "bag";
  if (/key|fob/.test(c)) return "keys";
  if (/passport|document|book|paper|card|id|folder|notebook/.test(c)) return "documents";
  if (/phone|iphone|laptop|tablet|airpod|electronic|camera|headphone|charger|watch/.test(c)) return "electronics";
  return "other";
}

function clean(v: unknown, max = 60): string {
  const s = String(v ?? "").replace(/\s+/g, " ").trim();
  return s.length > max ? s.slice(0, max - 1) + "…" : s;
}

function hexToRgba(hex: string, a: number): string {
  const h = hex.replace("#", "");
  return `rgba(${parseInt(h.slice(0, 2), 16)},${parseInt(h.slice(2, 4), 16)},${parseInt(h.slice(4, 6), 16)},${a})`;
}

// Passage IA : titre propre + clé couleur (avec repli sans IA)
async function aiClean(row: any): Promise<{ title: string; colorKey: string }> {
  const raw = [row.title, row.description, row.primary_category, row.categories].filter(Boolean).join(" — ").slice(0, 400);
  const fallback = {
    title: clean(row.primary_category || row.title || "Item", 20),
    colorKey: fallbackColorKey(`${row.primary_category} ${row.categories} ${row.title} ${row.description}`),
  };
  const key = process.env.ANTHROPIC_API_KEY;
  if (!key) return fallback;
  try {
    const res = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: { "x-api-key": key, "anthropic-version": "2023-06-01", "content-type": "application/json" },
      body: JSON.stringify({
        model: process.env.ANTHROPIC_MODEL || "claude-haiku-4-5",
        max_tokens: 120,
        system: "You label lost items for a poster. Reply ONLY with JSON.",
        messages: [
          {
            role: "user",
            content: `Lost item: "${raw}".
Return JSON:
{"title":"a clean 1-3 word poster name for the item, Title Case (e.g. 'Baby Book','Gold Bracelet','iPhone','Car Keys')",
 "colorKey":"one of: jewelry, watch, electronics, bag, wallet, documents, keys, other"}`,
          },
        ],
      }),
    });
    if (!res.ok) return fallback;
    const data = await res.json();
    const txt = String(data?.content?.[0]?.text ?? "");
    const m = txt.match(/\{[\s\S]*\}/);
    if (!m) return fallback;
    const j = JSON.parse(m[0]);
    const title = clean(j.title || fallback.title, 22);
    const colorKey = COLORS[j.colorKey] ? j.colorKey : fallback.colorKey;
    return { title, colorKey };
  } catch {
    return fallback;
  }
}

export async function GET(_req: Request, { params }: { params: { id: string } }) {
  const ink = "#26323f";
  const muted = "#64748b";

  try {
    const url = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
    const id = params.id;

    let row: any = null;
    if (url && key) {
      const qs =
        "select=title,description,primary_category,categories,city,state_id,place_type,place_type_other,date,public_id,object_photo&public_id=eq." +
        encodeURIComponent(id) +
        "&limit=1";
      const r = await fetch(`${url}/rest/v1/lost_items?${qs}`, {
        headers: { apikey: key, Authorization: `Bearer ${key}`, Accept: "application/json" },
        cache: "no-store",
      });
      if (r.ok) row = (await r.json())?.[0] || null;
    }
    if (!row) row = { title: "Item", public_id: id };

    const { title, colorKey } = await aiClean(row);
    const accent = COLORS[colorKey] || COLORS.other;

    const city = clean(row.city || "", 26);
    const state = clean(row.state_id || "", 4);
    const place = clean(row.place_type_other || row.place_type || "", 40);
    const where = `IN ${city.toUpperCase()}${state ? ` (${state})` : ""}${place ? ` AT ${place.toUpperCase()}` : ""}`;
    const date = clean(row.date || "", 20);
    const email = `item${clean(row.public_id || id, 10)}@reportlost.org`;
    const photo = typeof row.object_photo === "string" && /^https?:\/\//.test(row.object_photo) ? row.object_photo : "";

    const titleSize = title.length > 14 ? 92 : title.length > 9 ? 118 : 148;

    return new ImageResponse(
      (
        <div
          style={{
            width: "1080px",
            height: "1080px",
            display: "flex",
            padding: "40px",
            fontFamily: "sans-serif",
            background: `linear-gradient(135deg, ${hexToRgba(accent, 0.45)} 0%, #ffffff 65%)`,
          }}
        >
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              flex: 1,
              background: "#ffffff",
              borderRadius: "52px",
              padding: "70px 60px",
              alignItems: "center",
              justifyContent: "space-between",
              boxShadow: "0 24px 70px rgba(30,41,59,0.08)",
            }}
          >
            {/* Header */}
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
              <div style={{ fontSize: "48px", letterSpacing: "8px", color: ink, fontWeight: 700 }}>WANTED</div>
              <div
                style={{
                  fontSize: `${titleSize}px`,
                  fontWeight: 800,
                  color: ink,
                  lineHeight: 1.02,
                  textAlign: "center",
                  marginTop: "6px",
                }}
              >
                {title.toUpperCase()}
              </div>
              <div
                style={{
                  display: "flex",
                  marginTop: "26px",
                  maxWidth: "820px",
                  background: hexToRgba(accent, 0.55),
                  color: ink,
                  borderRadius: "44px",
                  padding: "18px 40px",
                  fontSize: "34px",
                  fontWeight: 700,
                  textAlign: "center",
                  lineHeight: 1.15,
                }}
              >
                {where}
              </div>
            </div>

            {/* Visuel (photo si dispo) */}
            {photo ? (
              <div style={{ display: "flex", alignItems: "center", justifyContent: "center" }}>
                <img
                  src={photo}
                  width={520}
                  height={380}
                  style={{ width: "520px", height: "380px", objectFit: "cover", borderRadius: "28px" }}
                />
              </div>
            ) : (
              <div style={{ display: "flex" }} />
            )}

            {/* Footer */}
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
              {date ? <div style={{ fontSize: "36px", color: muted, marginBottom: "18px" }}>{date}</div> : null}
              <div style={{ fontSize: "27px", color: muted }}>If found, please send an email:</div>
              <div style={{ fontSize: "44px", color: ink, fontWeight: 700, marginTop: "8px" }}>{email}</div>
              <div style={{ display: "flex", fontSize: "52px", color: ink, marginTop: "26px", fontWeight: 700 }}>®</div>
              <div style={{ fontSize: "30px", color: muted, marginTop: "4px", fontWeight: 600 }}>reportlost.org</div>
            </div>
          </div>
        </div>
      ),
      { width: 1080, height: 1080 }
    );
  } catch {
    return new ImageResponse(
      (
        <div
          style={{
            width: "1080px",
            height: "1080px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            background: "#ffffff",
            color: "#26323f",
            fontSize: "56px",
            fontWeight: 800,
            fontFamily: "sans-serif",
          }}
        >
          reportlost.org
        </div>
      ),
      { width: 1080, height: 1080 }
    );
  }
}
