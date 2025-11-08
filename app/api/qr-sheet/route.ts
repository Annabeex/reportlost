// app/api/qr-sheet/route.ts
import { NextRequest, NextResponse } from "next/server";
import { PDFDocument, rgb, StandardFonts } from "pdf-lib";
// ✅ use CJS require to avoid TS typing issue with qr-image
// eslint-disable-next-line @typescript-eslint/no-var-requires
const qrImage = require("qr-image") as any;
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Couleurs
 */
const ORANGE = rgb(0.98, 0.51, 0.14);      // #FA8324 approché
const ORANGE_DARK = rgb(0.92, 0.45, 0.10); // bande basse légèrement plus sombre
const CREAM = rgb(0.98, 0.98, 0.96);       // fond crème du QR
const BLACK = rgb(0, 0, 0);
const WHITE = rgb(1, 1, 1);

/**
 * Helpers PDF
 */
function mm(n: number) {
  // 72 dpi • 1 in = 25.4 mm
  return (n / 25.4) * 72;
}

function roundedRect(page: any, opts: {
  x: number; y: number; w: number; h: number;
  r: number; fill?: any; stroke?: any; lineWidth?: number;
}) {
  const { x, y, w, h, r, fill, stroke, lineWidth = 1 } = opts;
  const rr = Math.min(r, Math.min(w, h) / 2);

  // centre des coins
  const cx = x + rr, cy = y + rr;
  const cx2 = x + w - rr, cy2 = y + h - rr;

  // rectangles centraux
  page.drawRectangle({ x: x + rr, y, width: w - 2 * rr, height: h, color: fill, borderColor: stroke, borderWidth: lineWidth });
  page.drawRectangle({ x, y: y + rr, width: w, height: h - 2 * rr, color: fill, borderColor: stroke, borderWidth: lineWidth });

  // 4 disques pour arrondis
  page.drawCircle({ x: cx,  y: cy,  size: rr, color: fill, borderColor: stroke, borderWidth: lineWidth });
  page.drawCircle({ x: cx2, y: cy,  size: rr, color: fill, borderColor: stroke, borderWidth: lineWidth });
  page.drawCircle({ x: cx,  y: cy2, size: rr, color: fill, borderColor: stroke, borderWidth: lineWidth });
  page.drawCircle({ x: cx2, y: cy2, size: rr, color: fill, borderColor: stroke, borderWidth: lineWidth });
}

/**
 * Génère un PNG de QR (Buffer) via qr-image
 */
function makeQrPng(url: string): Buffer {
  // marge=0 car on encadre déjà avec un fond crème
  const pngBuf = qrImage.imageSync(url, {
    type: "png",
    ec_level: "M",
    margin: 0,
  }) as Buffer;
  return pngBuf;
}

/**
 * Dessine UNE étiquette au look “sticker orange”
 * tailles exprimées en points (72dpi)
 */
async function drawSticker(opts: {
  page: any; x: number; y: number; w: number; h: number;
  scanUrl: string; font: any; smallFont: any;
}) {
  const { page, x, y, w, h, scanUrl, font, smallFont } = opts;

  // Carte à coins arrondis
  roundedRect(page, { x, y, w, h, r: mm(6), fill: ORANGE });

  // Bande supérieure (titre)
  const topH = h * 0.26;

  // Titre
  const title = "IF YOU FIND ME,\nPLEASE SCAN ME";
  const titleSize = Math.min( mm(7.8), h * 0.075 );
  const tMarginX = mm(8);
  const tMarginY = mm(6);

  const lines = title.split("\n");
  let ty = y + h - tMarginY - titleSize;
  for (const line of lines) {
    page.drawText(line, {
      x: x + tMarginX,
      y: ty,
      size: titleSize,
      font,
      color: WHITE,
    });
    ty -= titleSize + mm(1.5);
  }

  // Zone QR (fond crème)
  const qrPad = mm(8);
  const qrBoxX = x + qrPad;
  const qrBoxW = w - qrPad * 2;
  const qrBoxH = h * 0.45;
  const qrBoxY = y + (h * 0.30);

  roundedRect(page, {
    x: qrBoxX,
    y: qrBoxY,
    w: qrBoxW,
    h: qrBoxH,
    r: mm(6),
    fill: CREAM,
  });

  // QR lui-même
  const qrPng = makeQrPng(scanUrl);
  const qrImg = await page.doc.embedPng(qrPng);

  // On garde un peu de marge intérieure
  const innerMargin = mm(8);
  const qrAvailW = qrBoxW - innerMargin * 2;
  const qrAvailH = qrBoxH - innerMargin * 2;
  const qrSize = Math.min(qrAvailW, qrAvailH);
  const qrX = qrBoxX + (qrBoxW - qrSize) / 2;
  const qrY = qrBoxY + (qrBoxH - qrSize) / 2;

  page.drawImage(qrImg, {
    x: qrX,
    y: qrY,
    width: qrSize,
    height: qrSize,
  });

  // Bande basse (pictogramme + texte)
  const bandH = h * 0.16;
  roundedRect(page, { x, y, w, h: bandH, r: mm(6), fill: ORANGE_DARK });

  // Bulle
  const bubbleR = Math.min(bandH * 0.42, mm(12));
  page.drawCircle({
    x: x + mm(12),
    y: y + bandH / 2,
    size: bubbleR,
    color: rgb(1, 0.85, 0.3),
  });

  // Texte bande basse
  const foot = "TO SEND A MESSAGE\nTO THE OWNER";
  const footSize = Math.min(mm(5.3), bandH * 0.28);
  const fx = x + mm(26);
  const fy = y + bandH / 2 + footSize * 0.45;

  const footLines = foot.split("\n");
  page.drawText(footLines[0], { x: fx, y: fy, size: footSize, font: smallFont, color: WHITE });
  page.drawText(footLines[1], { x: fx, y: fy - (footSize + mm(1)), size: footSize, font: smallFont, color: WHITE });
}

/**
 * Fabrique une page A4 avec 4 formats :
 * - 90×130 mm (grand sticker)
 * - 54×85 mm (format étiquette bagage)
 * - 60×60 mm (carré laptop)
 * - 35×35 mm (mini pour clés / gourde)
 */
async function makeSheet(scanUrl: string) {
  const pdf = await PDFDocument.create();
  const page = pdf.addPage([mm(210), mm(297)]); // A4 portrait
  (page as any).doc = pdf; // petit “pont” pour embed depuis drawSticker

  const font = await pdf.embedFont(StandardFonts.HelveticaBold);
  const smallFont = await pdf.embedFont(StandardFonts.HelveticaBold);

  // Grille simple
  const margin = mm(12);

  // 1) Grand (90×130)
  await drawSticker({
    page,
    x: margin,
    y: page.getHeight() - margin - mm(130),
    w: mm(90),
    h: mm(130),
    scanUrl,
    font,
    smallFont,
  });

  // 2) Luggage tag (54×85)
  await drawSticker({
    page,
    x: margin + mm(100),
    y: page.getHeight() - margin - mm(85),
    w: mm(54),
    h: mm(85),
    scanUrl,
    font,
    smallFont,
  });

  // 3) Carré 60×60 (laptop)
  await drawSticker({
    page,
    x: margin + mm(160),
    y: page.getHeight() - margin - mm(60),
    w: mm(60),
    h: mm(60),
    scanUrl,
    font,
    smallFont,
  });

  // 4) 2 minis 35×35
  await drawSticker({
    page,
    x: margin + mm(100),
    y: page.getHeight() - margin - mm(85) - mm(45),
    w: mm(35),
    h: mm(35),
    scanUrl,
    font,
    smallFont,
  });
  await drawSticker({
    page,
    x: margin + mm(140),
    y: page.getHeight() - margin - mm(85) - mm(45),
    w: mm(35),
    h: mm(35),
    scanUrl,
    font,
    smallFont,
  });

  return await pdf.save();
}

/**
 * Base URL (dev/preprod/prod)
 */
function getBaseUrl(req: NextRequest) {
  const env = (process.env.NEXT_PUBLIC_SITE_URL || "").trim();
  if (env) return env.replace(/\/+$/, "");
  const proto = req.headers.get("x-forwarded-proto") || "https";
  const host = req.headers.get("x-forwarded-host") || req.headers.get("host") || "localhost:3000";
  return `${proto}://${host}`;
}

export async function GET(req: NextRequest) {
  try {
    const supabase = getSupabaseAdmin();
    if (!supabase) {
      return NextResponse.json({ ok: false, error: "Supabase non configuré" }, { status: 500 });
    }

    const url = new URL(req.url);
    const id = url.searchParams.get("id");
    const publicIdParam = url.searchParams.get("public_id");

    // Récupération du public_id (5 chiffres)
    let public_id: string | null = publicIdParam;

    if (!public_id) {
      if (!id) {
        return NextResponse.json({ ok: false, error: "Paramètre manquant: id ou public_id" }, { status: 400 });
      }
      const { data, error } = await supabase
        .from("lost_items")
        .select("public_id")
        .eq("id", id)
        .maybeSingle();
      if (error || !data?.public_id) {
        return NextResponse.json({ ok: false, error: "Report introuvable" }, { status: 404 });
      }
      public_id = String(data.public_id);
    }

    if (!/^\d{5}$/.test(public_id)) {
      return NextResponse.json({ ok: false, error: "public_id invalide (5 chiffres requis)" }, { status: 400 });
    }

    // URL encodée dans le QR — page message (anonyme)
    const base = getBaseUrl(req);
    const scanUrl = `${base}/message?case=${encodeURIComponent(public_id)}`;

    // Génération PDF
    const bytes = await makeSheet(scanUrl);

    const fileName = `reportlost_stickers_${public_id}.pdf`;
    return new NextResponse(Buffer.from(bytes), {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `inline; filename="${fileName}"`,
        "Cache-Control": "no-store",
      },
    });
  } catch (e: any) {
    console.error("[qr-sheet] error:", e);
    return NextResponse.json({ ok: false, error: String(e?.message || e) }, { status: 500 });
  }
}
