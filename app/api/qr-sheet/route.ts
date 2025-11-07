// app/api/qr-sheet/route.ts
import { NextRequest, NextResponse } from "next/server";
import { PDFDocument } from "pdf-lib";
import { createClient } from "@supabase/supabase-js";
import fs from "node:fs/promises";
import path from "node:path";

// ⚠️ petite dépendance serveur, robuste en serverless :
//    npm i qr-image
import qrImage from "qr-image";

/* ===========================
   Helpers
=========================== */
const mm = (v: number) => (v * 72) / 25.4; // mm → points

// chemins des gabarits (mets tes PNG ici)
const TPL_LARGE = path.join(process.cwd(), "public", "stickers", "sticker-large.png");
const TPL_SMALL = path.join(process.cwd(), "public", "stickers", "sticker-small.png");

// zone QR à l’intérieur des templates (en pourcentages du gabarit)
// → ajuste ces ratios 1 fois pour coller EXACTEMENT à ta maquette.
const LARGE_QR_BOX = {
  // fenêtre blanche intérieure (x,y,width,height) *relatifs* [0..1]
  x: 0.105, // ~10.5% depuis la gauche
  y: 0.34,  // ~34% depuis le bas
  w: 0.79,  // ~79% largeur
  h: 0.36,  // ~36% hauteur
};
const SMALL_QR_BOX = {
  x: 0.105,
  y: 0.36,
  w: 0.79,
  h: 0.36,
};

// format A4
const A4 = { w: mm(210), h: mm(297) };

// disposition par défaut : multi‐tailles
// - 4 grandes “luggage tag” (≈ 90×140 mm)
// - 8 petites (≈ 50×80 mm)
const SHEET_LAYOUT = {
  marginX: mm(10),
  marginY: mm(10),
  gutterX: mm(6),
  gutterY: mm(8),

  large: {
    w: mm(90),
    h: mm(140),
    perRow: 2,
    rows: 2, // 2x2 = 4 grandes
  },
  small: {
    w: mm(50),
    h: mm(80),
    perRow: 4,
    rows: 2, // 4x2 = 8 petites
  },
};

/* ===========================
   Supabase (lecture)
=========================== */
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const sb = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

/* ===========================
   Génération QR (PNG Buffer)
=========================== */
function makeQrPng(url: string): Buffer {
  // margin = quiet zone, size = module scale
  // ec_level M/L selon préférence (M est un bon compromis)
  return qrImage.imageSync(url, {
    type: "png",
    margin: 2,
    size: 8,
    ec_level: "M",
  });
}

/* ===========================
   Placement d’un sticker
=========================== */
async function drawSticker(opts: {
  page: any;
  tplPng: Uint8Array;
  tplW: number;
  tplH: number;
  x: number;
  y: number;
  qrPng: Uint8Array;
  qrBox: { x: number; y: number; w: number; h: number }; // ratios
}) {
  const { page, tplPng, tplW, tplH, x, y, qrPng, qrBox } = opts;

  // 1) template (PNG) — on scale au format cible (tplW x tplH)
  const tplImg = await page.doc.embedPng(tplPng);
  page.drawImage(tplImg, { x, y, width: tplW, height: tplH });

  // 2) QR — on le pose dans la fenêtre blanche définie par qrBox
  const qrImg = await page.doc.embedPng(qrPng);
  const qx = x + tplW * qrBox.x;
  const qy = y + tplH * qrBox.y;
  const qw = tplW * qrBox.w;
  const qh = tplH * qrBox.h;
  const size = Math.min(qw, qh); // carré
  // centrer dans la fenêtre si elle n’est pas parfaitement carrée
  const padX = (qw - size) / 2;
  const padY = (qh - size) / 2;

  page.drawImage(qrImg, {
    x: qx + padX,
    y: qy + padY,
    width: size,
    height: size,
  });
}

/* ===========================
   Route handler
=========================== */
export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url);
    // Tu peux appeler /api/qr-sheet?publicId=12345
    // (ou case=, compatible avec tes URL actuelles)
    const publicId = (url.searchParams.get("publicId") || url.searchParams.get("case") || "").trim();

    if (!publicId || !/^\d{5}$/.test(publicId)) {
      return NextResponse.json({ ok: false, error: "missing_or_invalid_publicId (5 digits required)" }, { status: 400 });
    }

    // 1) Récup QR token & slug/email/… si besoin
    const { data: row, error } = await sb
      .from("lost_items")
      .select("id, public_id, qr_token")
      .eq("public_id", publicId)
      .maybeSingle();

    if (error || !row) {
      return NextResponse.json({ ok: false, error: "not_found" }, { status: 404 });
    }
    if (!row.qr_token) {
      return NextResponse.json({ ok: false, error: "missing_qr_token_for_this_case" }, { status: 400 });
    }

    // 2) URL cible du QR (ta route /qr/[token] existe déjà)
    const base =
      process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/+$/, "") ||
      `https://${req.headers.get("host") || "reportlost.org"}`; // fallback
    const scanUrl = `${base}/qr/${encodeURIComponent(row.qr_token)}`;

    // 3) QR (PNG)
    const qrPng = makeQrPng(scanUrl);

    // 4) Charge les templates
    const tplLarge = await fs.readFile(TPL_LARGE);
    const tplSmall = await fs.readFile(TPL_SMALL);

    // 5) PDF
    const pdf = await PDFDocument.create();
    const page = pdf.addPage([A4.w, A4.h]);
    // @ts-ignore stocker la ref du doc pour drawSticker
    (page as any).doc = pdf;

    // 5.a) grandes étiquettes
    {
      const { w, h, perRow, rows } = SHEET_LAYOUT.large;
      const totalW = perRow * w + (perRow - 1) * SHEET_LAYOUT.gutterX;
      const startX = (A4.w - totalW) / 2; // centré
      let y = A4.h - SHEET_LAYOUT.marginY - h;

      for (let r = 0; r < rows; r++) {
        let x = startX;
        for (let c = 0; c < perRow; c++) {
          await drawSticker({
            page,
            tplPng: tplLarge,
            tplW: w,
            tplH: h,
            x,
            y,
            qrPng,
            qrBox: LARGE_QR_BOX,
          });
          x += w + SHEET_LAYOUT.gutterX;
        }
        y -= h + SHEET_LAYOUT.gutterY;
      }
    }

    // 5.b) petites étiquettes
    {
      const { w, h, perRow, rows } = SHEET_LAYOUT.small;
      const totalW = perRow * w + (perRow - 1) * SHEET_LAYOUT.gutterX;
      const startX = (A4.w - totalW) / 2;
      // positionner sous le bloc précédent
      // marge supplémentaire
      let y =
        SHEET_LAYOUT.marginY + h * rows + SHEET_LAYOUT.gutterY * (rows - 1);
      // remonte au dernier rang en partant du bas
      y = SHEET_LAYOUT.marginY;

      for (let r = 0; r < rows; r++) {
        let x = startX;
        for (let c = 0; c < perRow; c++) {
          await drawSticker({
            page,
            tplPng: tplSmall,
            tplW: w,
            tplH: h,
            x,
            y,
            qrPng,
            qrBox: SMALL_QR_BOX,
          });
          x += w + SHEET_LAYOUT.gutterX;
        }
        y += h + SHEET_LAYOUT.gutterY;
      }
    }

    const bytes = await pdf.save();

    const res = new NextResponse(Buffer.from(bytes), {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `inline; filename="stickers-${publicId}.pdf"`,
        "Cache-Control": "no-store",
      },
    });
    return res;
  } catch (e: any) {
    console.error("[qr-sheet] error:", e);
    return NextResponse.json({ ok: false, error: String(e?.message || e) }, { status: 500 });
  }
}
