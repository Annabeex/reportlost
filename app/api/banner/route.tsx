// app/api/banner/route.tsx
// Superpose "VILLE - ÉTAT" (vert, style Helvetica via Arimo) sur la bannière
// Lost & Found vierge (public/images/lost-found-base.png).
// URL : /api/banner?city=Bronx&state=NY

import { ImageResponse } from "next/og";
import fs from "node:fs";
import path from "node:path";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const W = 1200;
const H = 800;
const GREEN = "#4a9a2e";

async function loadArimo(): Promise<ArrayBuffer | null> {
  try {
    const res = await fetch("https://cdn.jsdelivr.net/npm/@fontsource/arimo@5.0.18/files/arimo-latin-700-normal.woff", {
      cache: "force-cache",
    });
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
  const label = [city.toUpperCase(), state].filter(Boolean).join(" - ");

  // Réglages fins par l'URL (pour caler au pixel) : top/left en %, size en px, color en hex
  // Le texte est centré dans une "boîte" qui couvre la largeur du bloc FOUND
  const topPct = searchParams.get("top") || "65";
  const leftPct = searchParams.get("left") || "8"; // bord gauche de la boîte (~= "FOUND")
  const widthPct = searchParams.get("width") || "38"; // largeur de la boîte (~= "FOUND")
  const sizeOverride = Number(searchParams.get("size") || 0);
  const colorParam = searchParams.get("color");
  const green = colorParam ? `#${colorParam.replace(/^#/, "")}` : GREEN;

  // Fond : la bannière vierge (data URI, fiable)
  let bg = "";
  try {
    const buf = fs.readFileSync(path.join(process.cwd(), "public", "images", "lost-found-base.png"));
    bg = `data:image/png;base64,${buf.toString("base64")}`;
  } catch {
    bg = "";
  }

  const font = await loadArimo();
  const fonts = font ? [{ name: "Arimo", data: font, weight: 700 as const, style: "normal" as const }] : [];
  const fam = font ? "Arimo" : "sans-serif";

  // Taille adaptée à la longueur (plus la ville est longue, plus c'est petit) — ou forcée par ?size=
  const size =
    sizeOverride > 0
      ? sizeOverride
      : label.length > 19
      ? 38
      : label.length > 15
      ? 46
      : label.length > 11
      ? 56
      : 66;

  return new ImageResponse(
    (
      <div
        style={{
          width: `${W}px`,
          height: `${H}px`,
          display: "flex",
          position: "relative",
          background: "#d7e6f4",
          fontFamily: fam,
        }}
      >
        {bg ? (
          <img src={bg} width={W} height={H} style={{ width: `${W}px`, height: `${H}px`, objectFit: "cover" }} />
        ) : null}
        <div
          style={{
            position: "absolute",
            top: `${topPct}%`,
            left: `${leftPct}%`,
            width: `${widthPct}%`,
            display: "flex",
            justifyContent: "center",
          }}
        >
          <div
            style={{
              display: "flex",
              fontSize: `${size}px`,
              fontWeight: 700,
              color: green,
              letterSpacing: "1px",
              textAlign: "center",
            }}
          >
            {label}
          </div>
        </div>
      </div>
    ),
    { width: W, height: H, ...(fonts.length ? { fonts } : {}) }
  );
}
