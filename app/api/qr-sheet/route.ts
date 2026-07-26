// app/api/qr-sheet/route.ts
// Planche A4 de stickers "IF FOUND, SCAN ME" générée entièrement en code
// (plus de template Canva) : identité visuelle ReportLost (verts), QR vert
// foncé assortis, découpe le long des bordures.
// 4 petits (clés, gourde) + 3 moyens (téléphone, ordinateur) + 4 grands
// (bagage, sac) + 1 bandeau large.
import { NextRequest, NextResponse } from "next/server";
import { PDFDocument, StandardFonts, rgb, PDFFont } from "pdf-lib";
const QRCode = require("qrcode");
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const mm = (n: number) => (n / 25.4) * 72;
const PAGE_W = mm(210);
const PAGE_H = mm(297);

// Palette ReportLost
const GREEN_DEEP = rgb(0.096, 0.325, 0.18); // bandeaux
const GREEN = rgb(0.18, 0.627, 0.322); // #2EA052 bordures
const GREEN_BG = rgb(0.929, 0.973, 0.941); // fond doux
const GRAY = rgb(0.42, 0.45, 0.44);
const WHITE = rgb(1, 1, 1);
const QR_DARK = "#14532d"; // vert très foncé, contraste suffisant pour le scan

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

    // QR vert foncé, net (scale élevé), sans marge (le sticker fournit la sienne)
    const qrPng: Buffer = await QRCode.toBuffer(scanUrl, {
      errorCorrectionLevel: "M",
      margin: 0,
      scale: 12,
      color: { dark: QR_DARK, light: "#ffffff" },
    });

    const pdf = await PDFDocument.create();
    const page = pdf.addPage([PAGE_W, PAGE_H]);
    const qr = await pdf.embedPng(qrPng);
    const helv = await pdf.embedFont(StandardFonts.Helvetica);
    const helvB = await pdf.embedFont(StandardFonts.HelveticaBold);
    const helvO = await pdf.embedFont(StandardFonts.HelveticaOblique);

    // ---- helpers (coordonnées en mm depuis le HAUT-GAUCHE) ----
    const text = (t: string, leftMm: number, topMm: number, size: number, font: PDFFont, color = GREEN_DEEP) =>
      page.drawText(t, { x: mm(leftMm), y: PAGE_H - mm(topMm) - size, size, font, color });
    const textCenter = (t: string, centerMm: number, topMm: number, size: number, font: PDFFont, color = GREEN_DEEP) => {
      const w = font.widthOfTextAtSize(t, size);
      page.drawText(t, { x: mm(centerMm) - w / 2, y: PAGE_H - mm(topMm) - size, size, font, color });
    };
    const rect = (leftMm: number, topMm: number, wMm: number, hMm: number, opts: any) =>
      page.drawRectangle({ x: mm(leftMm), y: PAGE_H - mm(topMm) - mm(hMm), width: mm(wMm), height: mm(hMm), ...opts });
    const qrAt = (leftMm: number, topMm: number, sizeMm: number) =>
      page.drawImage(qr, { x: mm(leftMm), y: PAGE_H - mm(topMm) - mm(sizeMm), width: mm(sizeMm), height: mm(sizeMm) });

    // ---- En-tête ----
    rect(12, 12, 186, 20, { color: GREEN_DEEP });
    text("ReportLost", 18, 17.5, 18, helvB, WHITE);
    {
      const t = `Secure ID stickers  ·  Case #${public_id}`;
      const w = helv.widthOfTextAtSize(t, 10.5);
      page.drawText(t, { x: mm(192) - w, y: PAGE_H - mm(20.5) - 10.5, size: 10.5, font: helv, color: WHITE });
    }
    text("Stick them on the items you carry every day. A finder scans the code and reaches you through", 12, 35.5, 8, helv, GRAY);
    text("your protected ReportLost address. Your personal details stay private.", 12, 39.5, 8, helv, GRAY);

    // ---- Petits stickers (x4) : clés, gourde, étui... ----
    const drawSmall = (left: number, top: number) => {
      const w = 42, h = 40;
      rect(left, top, w, h, { color: WHITE, borderColor: GREEN, borderWidth: 1.2 });
      rect(left, top, w, 7.5, { color: GREEN_BG });
      textCenter("IF FOUND, SCAN ME", left + w / 2, top + 2.3, 6.8, helvB);
      qrAt(left + (w - 24) / 2, top + 10.5, 24);
      textCenter("reportlost.org", left + w / 2, top + h - 4.6, 6, helv, GRAY);
    };
    [0, 1, 2, 3].forEach((i) => drawSmall(12 + i * 48, 46));

    // ---- Stickers moyens (x3) : téléphone, ordinateur... ----
    const drawMedium = (left: number, top: number) => {
      const w = 58, h = 32;
      rect(left, top, w, h, { color: WHITE, borderColor: GREEN, borderWidth: 1.2 });
      qrAt(left + 4, top + 4, 24);
      text("IF FOUND", left + 32.5, top + 7, 9.5, helvB);
      text("please scan the code", left + 32.5, top + 13.5, 6.8, helv, GRAY);
      text("reportlost.org", left + 32.5, top + 21, 7, helvB, GREEN);
    };
    [0, 1, 2].forEach((i) => drawMedium(12 + i * 64, 92));

    // ---- Grands stickers (x4) : bagage, sac, poussette... ----
    const drawLarge = (left: number, top: number) => {
      const w = 90, h = 52;
      rect(left, top, w, h, { color: WHITE, borderColor: GREEN, borderWidth: 1.2 });
      rect(left, top, w, 9, { color: GREEN_DEEP });
      textCenter("THIS ITEM IS PROTECTED", left + w / 2, top + 2.6, 7.8, helvB, WHITE);
      qrAt(left + 5, top + 14, 30);
      text("If found, please scan the code", left + 39.5, top + 17, 8.2, helvB);
      text("or email us at:", left + 39.5, top + 23.5, 7, helv, GRAY);
      text(relayEmail, left + 39.5, top + 28.5, 7.6, helvB);
      text("Thank you for your honesty.", left + 39.5, top + 36, 6.6, helvO, GRAY);
      textCenter("reportlost.org", left + w / 2, top + h - 5, 6.5, helv, GRAY);
    };
    drawLarge(12, 130);
    drawLarge(108, 130);
    drawLarge(12, 188);
    drawLarge(108, 188);

    // ---- Bandeau large (x1) : valise, carton, vélo... ----
    {
      const left = 12, top = 246, w = 186, h = 32;
      rect(left, top, w, h, { color: WHITE, borderColor: GREEN, borderWidth: 1.2 });
      qrAt(left + 4, top + 4, 24);
      text("IF FOUND, PLEASE SCAN THE CODE", left + 34, top + 8.5, 13, helvB);
      text(`or email ${relayEmail}   ·   reportlost.org`, left + 34, top + 19, 8.5, helv, GRAY);
    }

    // ---- Pied de page ----
    textCenter("Print on adhesive A4 paper and cut along the green borders  ·  reportlost.org", 105, 285, 7.5, helv, GRAY);

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
