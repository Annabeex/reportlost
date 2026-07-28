// app/api/org/poster/route.ts — affiche A4 "Lost something? Scan to report it"
// pour le guichet d'un établissement. Même design que la planche stickers
// (piste B) : bandeau dégradé signature, carte blanche, QR vert foncé.
// GET ?slug=... — public : aucune donnée sensible, l'org doit pouvoir
// l'imprimer et la partager librement.
import { NextRequest, NextResponse } from "next/server";
import { PDFDocument, StandardFonts, rgb, PDFFont } from "pdf-lib";
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
const BORDER = rgb(0.843, 0.918, 0.867); // #d7eadd
const GRAY = rgb(0.36, 0.42, 0.376); // #5c6b60
const WHITE = rgb(1, 1, 1);

const PX = 12;

async function gradientPng(wMm: number, hMm: number, rounded: boolean): Promise<Buffer> {
  const w = Math.round(wMm * PX);
  const h = Math.round(hMm * PX);
  const r = rounded ? Math.round(2.6 * PX) : 0;
  const path = `M ${r} 0 H ${w - r} Q ${w} 0 ${w} ${r} V ${h - r} Q ${w} ${h} ${w - r} ${h} H ${r} Q 0 ${h} 0 ${h - r} V ${r} Q 0 0 ${r} 0 Z`;
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}"><defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#26723e"/><stop offset="1" stop-color="#2ea052"/></linearGradient></defs><path d="${path}" fill="url(#g)"/></svg>`;
  return sharp(Buffer.from(svg)).png().toBuffer();
}

function roundedRectPath(wPt: number, hPt: number, rPt: number): string {
  const w = wPt, h = hPt, r = rPt;
  return `M ${r} 0 H ${w - r} Q ${w} 0 ${w} ${r} V ${h - r} Q ${w} ${h} ${w - r} ${h} H ${r} Q 0 ${h} 0 ${h - r} V ${r} Q 0 0 ${r} 0 Z`;
}

export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const slug = String(url.searchParams.get("slug") || "").trim().toLowerCase();
    if (!slug) return NextResponse.json({ ok: false, error: "Paramètre manquant: slug" }, { status: 400 });

    const sb = getSupabaseAdmin();
    if (!sb) return NextResponse.json({ ok: false, error: "Supabase non configuré" }, { status: 500 });

    const { data: org } = await sb
      .from("organizations")
      .select("slug, name, city, state_id, verified")
      .eq("slug", slug)
      .maybeSingle();
    if (!org) return NextResponse.json({ ok: false, error: "Organisation introuvable" }, { status: 404 });

    const base =
      (process.env.NEXT_PUBLIC_SITE_URL || "").replace(/\/+$/, "") ||
      `${req.headers.get("x-forwarded-proto") || "https"}://${req.headers.get("x-forwarded-host") || req.headers.get("host")}`;
    // src trackée : permet de mesurer les signalements venus de cette affiche
    const scanUrl = `${base}/report?src=o-${encodeURIComponent(org.slug)}`;

    const [qrPng, bandHeader, bandFooter] = await Promise.all([
      QRCode.toBuffer(scanUrl, { errorCorrectionLevel: "M", margin: 0, scale: 14, color: { dark: "#14532d", light: "#ffffff" } }) as Promise<Buffer>,
      gradientPng(186, 26, true),
      gradientPng(186, 14, true),
    ]);

    const pdf = await PDFDocument.create();
    const page = pdf.addPage([PAGE_W, PAGE_H]);
    const qr = await pdf.embedPng(qrPng);
    const gHeader = await pdf.embedPng(bandHeader);
    const gFooter = await pdf.embedPng(bandFooter);
    const helv = await pdf.embedFont(StandardFonts.Helvetica);
    const helvB = await pdf.embedFont(StandardFonts.HelveticaBold);
    const helvO = await pdf.embedFont(StandardFonts.HelveticaOblique);

    const textCenter = (t: string, topMm: number, size: number, font: PDFFont, color = GREEN_DEEP) => {
      const w = font.widthOfTextAtSize(t, size);
      page.drawText(t, { x: PAGE_W / 2 - w / 2, y: PAGE_H - mm(topMm) - size, size, font, color });
    };
    const img = (im: any, leftMm: number, topMm: number, wMm: number, hMm: number) =>
      page.drawImage(im, { x: mm(leftMm), y: PAGE_H - mm(topMm) - mm(hMm), width: mm(wMm), height: mm(hMm) });

    // ---- Bandeau haut ----
    img(gHeader, 12, 12, 186, 26);
    {
      const t = "LOST SOMETHING?";
      const w = helvB.widthOfTextAtSize(t, 30);
      page.drawText(t, { x: PAGE_W / 2 - w / 2, y: PAGE_H - mm(21) - 30 + 6, size: 30, font: helvB, color: WHITE });
    }
    textCenter(org.name, 42, 15, helvB);
    if (org.city) textCenter(`${org.city}${org.state_id ? `, ${org.state_id}` : ""}`, 49.5, 10.5, helv, GRAY);

    // ---- Carte centrale avec QR ----
    const cardW = 120, cardH = 148, cardX = (210 - cardW) / 2, cardY = 60;
    page.drawSvgPath(roundedRectPath(mm(cardW), mm(cardH), mm(4)), {
      x: mm(cardX),
      y: PAGE_H - mm(cardY),
      color: WHITE,
      borderColor: BORDER,
      borderWidth: 1.5,
    });
    textCenter("Report your lost item in 2 minutes", cardY + 10, 13, helvB);
    const qrSize = 92;
    img(qr, (210 - qrSize) / 2, cardY + 22, qrSize, qrSize);
    textCenter("SCAN ME", cardY + 22 + qrSize + 6, 15, helvB);
    textCenter("Point your phone camera at the code", cardY + 22 + qrSize + 14.5, 9.5, helv, GRAY);

    // ---- Les 3 étapes ----
    const stepsTop = cardY + cardH + 14;
    const steps: [string, string][] = [
      ["1.", "Scan the code and describe what you lost"],
      ["2.", "Your report is sent to the right local services"],
      ["3.", "It stays active, searching for a match, and you get notified"],
    ];
    let sy = stepsTop;
    for (const [n, s] of steps) {
      const line = `${n}  ${s}`;
      const w = helv.widthOfTextAtSize(line, 12);
      page.drawText(line, { x: PAGE_W / 2 - w / 2, y: PAGE_H - mm(sy) - 12, size: 12, font: helv, color: GREEN_DEEP });
      sy += 9;
    }

    // ---- Bandeau bas ----
    img(gFooter, 12, 297 - 12 - 14, 186, 14);
    {
      const t = `reportlost.org  ·  Found items held here: reportlost.org/o/${org.slug}`;
      const w = helvO.widthOfTextAtSize(t, 10);
      page.drawText(t, { x: PAGE_W / 2 - w / 2, y: mm(12) + mm(14) / 2 - 4, size: 10, font: helvO, color: WHITE });
    }

    const bytes = await pdf.save();
    return new NextResponse(Buffer.from(bytes), {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `inline; filename="reportlost-poster-${org.slug}.pdf"`,
        "Cache-Control": "public, max-age=3600",
      },
    });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: String(e?.message || e) }, { status: 500 });
  }
}
