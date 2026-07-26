// app/api/qr-sheet/route.ts
// Planche A4 de stickers — design "piste B" validé : cartes blanches à coins
// arrondis, bandeau dégradé signature (#26723e → #2ea052), QR vert foncé.
// Les dégradés sont rendus en PNG haute résolution via sharp (SVG sans texte,
// donc aucun problème de police serverless) ; les textes restent en Helvetica
// native du PDF pour une netteté d'impression parfaite.
import { NextRequest, NextResponse } from "next/server";
import { PDFDocument, StandardFonts, rgb, PDFFont, degrees } from "pdf-lib";
const QRCode = require("qrcode");
import sharp from "sharp";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 30;

const mm = (n: number) => (n / 25.4) * 72;
const PAGE_W = mm(210);
const PAGE_H = mm(297);

const GREEN_DEEP = rgb(0.078, 0.325, 0.176); // #14532d
const GREEN = rgb(0.18, 0.627, 0.322); // #2EA052
const BORDER = rgb(0.843, 0.918, 0.867); // #d7eadd
const GRAY = rgb(0.36, 0.42, 0.376); // #5c6b60
const WHITE = rgb(1, 1, 1);

const PX = 12; // pixels par mm (~300 dpi)

// Bandeau dégradé en PNG (SVG sans texte → rendu sharp fiable partout)
async function gradientPng(wMm: number, hMm: number, corners: "top" | "all" | "left"): Promise<Buffer> {
  const w = Math.round(wMm * PX);
  const h = Math.round(hMm * PX);
  const r = Math.round(2.6 * PX);
  let path = "";
  if (corners === "all") {
    path = `M ${r} 0 H ${w - r} Q ${w} 0 ${w} ${r} V ${h - r} Q ${w} ${h} ${w - r} ${h} H ${r} Q 0 ${h} 0 ${h - r} V ${r} Q 0 0 ${r} 0 Z`;
  } else if (corners === "top") {
    path = `M ${r} 0 H ${w - r} Q ${w} 0 ${w} ${r} V ${h} H 0 V ${r} Q 0 0 ${r} 0 Z`;
  } else {
    path = `M ${r} 0 H ${w} V ${h} H ${r} Q 0 ${h} 0 ${h - r} V ${r} Q 0 0 ${r} 0 Z`;
  }
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}"><defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#26723e"/><stop offset="1" stop-color="#2ea052"/></linearGradient></defs><path d="${path}" fill="url(#g)"/></svg>`;
  return sharp(Buffer.from(svg)).png().toBuffer();
}

// Contour arrondi (path pt, y vers le bas depuis le point d'ancrage)
function roundedRectPath(wPt: number, hPt: number, rPt: number): string {
  const w = wPt, h = hPt, r = rPt;
  return `M ${r} 0 H ${w - r} Q ${w} 0 ${w} ${r} V ${h - r} Q ${w} ${h} ${w - r} ${h} H ${r} Q 0 ${h} 0 ${h - r} V ${r} Q 0 0 ${r} 0 Z`;
}

export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const sb = getSupabaseAdmin();
    if (!sb) return NextResponse.json({ ok: false, error: "Supabase non configuré" }, { status: 500 });

    let public_id = url.searchParams.get("public_id");
    if (!public_id) {
      const id = url.searchParams.get("id");
      if (!id) return NextResponse.json({ ok: false, error: "Paramètre manquant: id ou public_id" }, { status: 400 });
      const { data, error } = await sb.from("lost_items").select("public_id").eq("id", id).maybeSingle();
      if (error || !data?.public_id) return NextResponse.json({ ok: false, error: "Report introuvable" }, { status: 404 });
      public_id = String(data.public_id);
    }
    if (!/^\d{5}$/.test(public_id)) {
      return NextResponse.json({ ok: false, error: "public_id invalide (5 chiffres requis)" }, { status: 400 });
    }

    const base =
      (process.env.NEXT_PUBLIC_SITE_URL || "").replace(/\/+$/, "") ||
      `${req.headers.get("x-forwarded-proto") || "https"}://${req.headers.get("x-forwarded-host") || req.headers.get("host")}`;
    const scanUrl = `${base}/message?case=${encodeURIComponent(public_id)}`;
    const relayEmail = `item${public_id}@reportlost.org`;

    // Assets image
    const [qrPng, bandHeader, bandSm, bandMd, bandLg, bandWide] = await Promise.all([
      QRCode.toBuffer(scanUrl, { errorCorrectionLevel: "M", margin: 0, scale: 12, color: { dark: "#14532d", light: "#ffffff" } }) as Promise<Buffer>,
      gradientPng(186, 18, "all"),
      gradientPng(42, 7.5, "top"),
      gradientPng(58, 6.5, "top"),
      gradientPng(90, 8.5, "top"),
      gradientPng(12, 30, "left"),
    ]);

    const pdf = await PDFDocument.create();
    const page = pdf.addPage([PAGE_W, PAGE_H]);
    const qr = await pdf.embedPng(qrPng);
    const gHeader = await pdf.embedPng(bandHeader);
    const gSm = await pdf.embedPng(bandSm);
    const gMd = await pdf.embedPng(bandMd);
    const gLg = await pdf.embedPng(bandLg);
    const gWide = await pdf.embedPng(bandWide);
    const helv = await pdf.embedFont(StandardFonts.Helvetica);
    const helvB = await pdf.embedFont(StandardFonts.HelveticaBold);
    const helvO = await pdf.embedFont(StandardFonts.HelveticaOblique);

    const text = (t: string, leftMm: number, topMm: number, size: number, font: PDFFont, color = GREEN_DEEP) =>
      page.drawText(t, { x: mm(leftMm), y: PAGE_H - mm(topMm) - size, size, font, color });
    const textCenter = (t: string, centerMm: number, topMm: number, size: number, font: PDFFont, color = GREEN_DEEP) => {
      const w = font.widthOfTextAtSize(t, size);
      page.drawText(t, { x: mm(centerMm) - w / 2, y: PAGE_H - mm(topMm) - size, size, font, color });
    };
    const img = (im: any, leftMm: number, topMm: number, wMm: number, hMm: number) =>
      page.drawImage(im, { x: mm(leftMm), y: PAGE_H - mm(topMm) - mm(hMm), width: mm(wMm), height: mm(hMm) });
    const card = (leftMm: number, topMm: number, wMm: number, hMm: number) =>
      page.drawSvgPath(roundedRectPath(mm(wMm), mm(hMm), mm(2.6)), {
        x: mm(leftMm),
        y: PAGE_H - mm(topMm),
        color: WHITE,
        borderColor: BORDER,
        borderWidth: 1,
      });

    // ---- En-tête ----
    img(gHeader, 12, 12, 186, 18);
    text("ReportLost", 18, 17, 16, helvB, WHITE);
    {
      const t = `Secure ID stickers  ·  Case #${public_id}`;
      const w = helv.widthOfTextAtSize(t, 9.5);
      page.drawText(t, { x: mm(192) - w, y: PAGE_H - mm(19.5) - 9.5, size: 9.5, font: helv, color: WHITE });
    }
    text("Stick them on the items you carry every day. A finder scans the code and reaches you through", 12, 33.5, 7.5, helv, GRAY);
    text("your protected ReportLost address. Your personal details stay private.", 12, 37.3, 7.5, helv, GRAY);

    // ---- 4 petits (clés, gourde) ----
    const drawSmall = (left: number, top: number) => {
      const w = 42, h = 40;
      card(left, top, w, h);
      img(gSm, left, top, w, 7.5);
      textCenter("SCAN ME", left + w / 2, top + 2.4, 6.5, helvB, WHITE);
      img(qr, left + (w - 22) / 2, top + 10.5, 22, 22);
      textCenter("reportlost.org", left + w / 2, top + h - 5, 5.8, helv, GRAY);
    };
    [0, 1, 2, 3].forEach((i) => drawSmall(12 + i * 48, 43));

    // ---- 3 moyens (téléphone, ordinateur) ----
    const drawMedium = (left: number, top: number) => {
      const w = 58, h = 32;
      card(left, top, w, h);
      img(gMd, left, top, w, 6.5);
      textCenter("IF FOUND, PLEASE SCAN", left + w / 2, top + 2, 5.8, helvB, WHITE);
      img(qr, left + 4, top + 9.5, 19, 19);
      text("This item is protected", left + 26.5, top + 12.5, 6.8, helvB, GREEN_DEEP);
      text("reportlost.org", left + 26.5, top + 19, 6.4, helvB, GREEN);
    };
    [0, 1, 2].forEach((i) => drawMedium(12 + i * 64, 89));

    // ---- 4 grands (bagage, sac) ----
    const drawLarge = (left: number, top: number) => {
      const w = 90, h = 52;
      card(left, top, w, h);
      img(gLg, left, top, w, 8.5);
      textCenter("IF FOUND, PLEASE SCAN", left + w / 2, top + 2.7, 7, helvB, WHITE);
      img(qr, left + 5, top + 13.5, 28, 28);
      text("This item is under", left + 38, top + 16, 8, helvB, GREEN_DEEP);
      text("ReportLost protection", left + 38, top + 20.5, 8, helvB, GREEN_DEEP);
      text(relayEmail, left + 38, top + 27, 6.6, helv, GRAY);
      text("Thank you for your honesty.", left + 38, top + 32.5, 6.2, helvO, GRAY);
      text("reportlost.org", left + 38, top + 38.5, 6.4, helvB, GREEN);
    };
    drawLarge(12, 127);
    drawLarge(108, 127);
    drawLarge(12, 185);
    drawLarge(108, 185);

    // ---- Bandeau large (valise, vélo) ----
    {
      const left = 12, top = 243, w = 186, h = 30;
      card(left, top, w, h);
      img(gWide, left, top, 12, h);
      page.drawText("IF FOUND", {
        x: mm(left + 7.8),
        y: PAGE_H - mm(top + h - 6),
        size: 7,
        font: helvB,
        color: WHITE,
        rotate: degrees(90),
      });
      img(qr, left + 17, top + 4, 22, 22);
      text("Please scan the code", left + 44, top + 8, 13, helvB, GREEN_DEEP);
      text(`or email ${relayEmail}   ·   reportlost.org`, left + 44, top + 17.5, 8, helv, GRAY);
    }

    // ---- Pied de page ----
    textCenter("Print on adhesive A4 paper and cut along the rounded borders  ·  reportlost.org", 105, 281, 7, helv, GRAY);

    const bytes = await pdf.save();
    return new NextResponse(Buffer.from(bytes), {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `inline; filename="stickers_${public_id}.pdf"`,
        "Cache-Control": "no-store",
      },
    });
  } catch (e: any) {
    console.error("[sticker-sheet]", e);
    return NextResponse.json({ ok: false, error: String(e?.message || e) }, { status: 500 });
  }
}
