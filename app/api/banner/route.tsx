// app/api/banner/route.tsx
// Superpose "VILLE, ST" (vert, style Helvetica via Arimo) sur la bannière
// Lost & Found d'origine (public/images/lost-found-base.png).
// Ville + code État TOUJOURS sur une seule ligne : taille auto selon la longueur.
// URL : /api/banner?city=Bronx&state=NY  (réglages fins : ?top=&left=&width=&size=&color=)

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
  const label = [city.toUpperCase(), state].filter(Boolean).join(", ");

  // Position/box réglables par l'URL (comme avant)
  const topPct = searchParams.get("top") || "65";
  const leftPct = searchParams.get("left") || "8";
  const widthPct = searchParams.get("width") || "38";
  const sizeOverride = Number(searchParams.get("size") || 0);
  const colorParam = searchParams.get("color");
  const green = colorParam ? `#${colorParam.replace(/^#/, "")}` : GREEN;

  // Fond : la bannière d'origine (data URI, fiable)
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

  // ✅ UNE seule ligne garantie : taille calculée pour tenir dans la boîte
  // (largeur boîte en px / largeur estimée du texte ≈ 0.62 × size par caractère)
  const boxWidthPx = (W * Number(widthPct)) / 100;
  const autoSize = Math.max(
    22,
    Math.min(66, Math.floor((boxWidthPx * 0.96) / (Math.max(label.length, 6) * 0.62)))
  );
  const size = sizeOverride > 0 ? sizeOverride : autoSize;

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
              whiteSpace: "nowrap",
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
