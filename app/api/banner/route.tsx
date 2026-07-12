// app/api/banner/route.tsx
// Bannière de groupe Facebook générée entièrement par le code (plus d'image
// de fond avec "Exchange"). Titre "LOST & FOUND · Community Group", puis
// VILLE, ÉTAT toujours sur UNE seule ligne (taille auto selon la longueur).
// URL : /api/banner?city=Philadelphia&state=PA   (option ?size= pour forcer)

import { ImageResponse } from "next/og";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const W = 1200;
const H = 800;
const GREEN = "#2e7d32";
const INK = "#1e293b";

async function loadArimo(weight: 400 | 700): Promise<ArrayBuffer | null> {
  try {
    const res = await fetch(
      `https://cdn.jsdelivr.net/npm/@fontsource/arimo@5.0.18/files/arimo-latin-${weight}-normal.woff`,
      { cache: "force-cache" }
    );
    if (!res.ok) return null;
    return await res.arrayBuffer();
  } catch {
    return null;
  }
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const city = (searchParams.get("city") || "").trim();
  const state = (searchParams.get("state") || "").trim().toUpperCase();
  const label = [city.toUpperCase(), state].filter(Boolean).join(", ");

  // Une seule ligne garantie : taille dérivée de la longueur (~0.62 × size par caractère)
  const sizeOverride = Number(searchParams.get("size") || 0);
  const autoSize = Math.max(30, Math.min(84, Math.floor((W * 0.86) / (Math.max(label.length, 6) * 0.62))));
  const citySize = sizeOverride > 0 ? sizeOverride : autoSize;

  const [f700, f400] = await Promise.all([loadArimo(700), loadArimo(400)]);
  const fonts: any[] = [];
  if (f700) fonts.push({ name: "Arimo", data: f700, weight: 700, style: "normal" });
  if (f400) fonts.push({ name: "Arimo", data: f400, weight: 400, style: "normal" });
  const fam = fonts.length ? "Arimo" : "sans-serif";

  return new ImageResponse(
    (
      <div
        style={{
          width: `${W}px`,
          height: `${H}px`,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          background: "linear-gradient(160deg, #f2f8fd 0%, #dcebf7 55%, #cfe3f2 100%)",
          fontFamily: fam,
          position: "relative",
        }}
      >
        {/* Décor discret */}
        <div style={{ position: "absolute", top: "36px", left: "48px", fontSize: "64px", opacity: 0.16, display: "flex" }}>
          🔍
        </div>
        <div style={{ position: "absolute", bottom: "36px", right: "48px", fontSize: "64px", opacity: 0.16, display: "flex" }}>
          🐾
        </div>

        {/* Titre */}
        <div
          style={{
            display: "flex",
            fontSize: "108px",
            fontWeight: 700,
            color: INK,
            letterSpacing: "4px",
            lineHeight: 1,
          }}
        >
          LOST &amp; FOUND
        </div>
        <div
          style={{
            display: "flex",
            marginTop: "18px",
            fontSize: "38px",
            fontWeight: 400,
            color: "#475569",
            letterSpacing: "10px",
          }}
        >
          COMMUNITY GROUP
        </div>

        {/* Ville, État : UNE seule ligne */}
        <div
          style={{
            display: "flex",
            marginTop: "56px",
            fontSize: `${citySize}px`,
            fontWeight: 700,
            color: GREEN,
            letterSpacing: "2px",
            whiteSpace: "nowrap",
            maxWidth: `${Math.floor(W * 0.92)}px`,
          }}
        >
          {label || "YOUR CITY, ST"}
        </div>

        {/* Pied discret */}
        <div
          style={{
            position: "absolute",
            bottom: "30px",
            display: "flex",
            fontSize: "26px",
            color: "#64748b",
          }}
        >
          reportlost.org
        </div>
      </div>
    ),
    { width: W, height: H, ...(fonts.length ? { fonts } : {}) }
  );
}
