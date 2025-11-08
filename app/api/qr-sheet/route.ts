// app/api/qr-sheet/route.ts
import { NextRequest, NextResponse } from "next/server";
import { PDFDocument, rgb } from "pdf-lib";
import fs from "node:fs/promises";
import path from "node:path";

// ✅ CJS require pour éviter les erreurs d’import ESM
// eslint-disable-next-line @typescript-eslint/no-var-requires
const qrImage = require("qr-image") as any;

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// ———————————————————————————————————————
// Vérif ref publique (5 chiffres)
// ———————————————————————————————————————
function isFiveDigits(v: unknown): v is string {
  return typeof v === "string" && /^[0-9]{5}$/.test(v);
}

// ———————————————————————————————————————
// Génération QR PNG buffer via qr-image
// ———————————————————————————————————————
function generateQrPngBuffer(text: string, scale = 8): Buffer {
  return qrImage.imageSync(text, {
    type: "png",
    ec_level: "M",
    margin: 0,
    size: scale,
  }) as Buffer;
}

// ———————————————————————————————————————
// Liste des fichiers possibles du template PDF
// ———————————————————————————————————————
const TEMPLATE_CANDIDATES = [
  "planche-QR-code -v3 (1).pdf",
  "planche-QR-code-v3.pdf",
  "planche.pdf",
];

// ———————————————————————————————————————
// ✅ Positions EXACTES DES CADRES (mesurées sur ton PDF)
// origine = bas-gauche, unités = points PDF
// ———————————————————————————————————————
const SLOT_POSITIONS: Array<{ x: number; y: number; size: number }> = [
  { x: 378.254, y: 590.814, size: 113.386 },
  { x: 447.791, y: 704.655, size: 113.386 },
  { x: 33.532,  y: 704.524, size: 113.386 },
  { x: 171.524, y: 704.524, size: 113.386 },
  { x: 309.658, y: 704.655, size: 113.386 },
  { x: 188.057, y: 513.999, size: 115.126 },
  { x: 276.750, y: 33.127,  size: 116.220 },
  { x: 433.744, y: 20.371,  size: 141.732 },
  { x: 174.817, y: 302.352, size: 141.732 },
  { x: 19.217,  y: 302.352, size: 141.732 },
];

// léger retrait pour ne pas toucher les bords
const FIT_RATIO = 0.94;
const CENTER_IN_CELL = true;

// ———————————————————————————————————————
// ✅ ROUTE GET
// ———————————————————————————————————————
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const publicId = searchParams.get("publicId");

    if (!isFiveDigits(publicId)) {
      return NextResponse.json(
        { ok: false, error: "publicId doit être 5 chiffres" },
        { status: 400 }
      );
    }

    // URL que le QR renvoie
    const origin = req.nextUrl.origin;
    const targetUrl = `${origin}/case/${publicId}`;

    // ——————————————————————————
    // Recherche du template PDF dans /public
    // ——————————————————————————
    let templatePath: string | null = null;
    for (const name of TEMPLATE_CANDIDATES) {
      const p = path.join(process.cwd(), "public", name);
      try {
        await fs.access(p);
        templatePath = p;
        break;
      } catch {}
    }

    if (!templatePath) {
      return NextResponse.json(
        { ok: false, error: "Template PDF introuvable dans /public" },
        { status: 404 }
      );
    }

    // Charge PDF template
    const templateBytes = await fs.readFile(templatePath);
    const pdfDoc = await PDFDocument.load(templateBytes);
    const page = pdfDoc.getPage(0);

    // Génération d'un seul QR PNG qu'on réutilise
    const qrPngBuffer = generateQrPngBuffer(targetUrl, 10);
    const qrImg = await pdfDoc.embedPng(qrPngBuffer);

    // ——————————————————————————
    // Placement de chaque QR
    // ——————————————————————————
    for (const slot of SLOT_POSITIONS) {
      const size = slot.size * FIT_RATIO;
      const dx = CENTER_IN_CELL ? (slot.size - size) / 2 : 0;
      const dy = CENTER_IN_CELL ? (slot.size - size) / 2 : 0;

      page.drawImage(qrImg, {
        x: slot.x + dx,
        y: slot.y + dy,
        width: size,
        height: size,
      });
    }

    // Légende discrète (optionnelle)
    page.drawText(`Ref: ${publicId}`, {
      x: 16,
      y: 16,
      size: 8,
      color: rgb(0.2, 0.2, 0.2),
    });

    // ——————————————————————————
    // Sauvegarde et réponse HTTP
    // ——————————————————————————
    const pdfBytes = await pdfDoc.save();

    // ✅ Fix Vercel / TypeScript — emballer dans un Blob
    const pdfBlob = new Blob([pdfBytes], { type: "application/pdf" });

    return new NextResponse(pdfBlob, {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `inline; filename="qr-sheet-${publicId}.pdf"`,
        "Cache-Control": "no-store",
      },
    });
  } catch (e: any) {
    return NextResponse.json(
      { ok: false, error: String(e?.message || e) },
      { status: 500 }
    );
  }
}
