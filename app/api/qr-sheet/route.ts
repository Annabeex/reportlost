// app/api/qr-sheet/route.ts
import { NextRequest } from "next/server";
import { PDFDocument, rgb } from "pdf-lib";
import fs from "node:fs/promises";
import path from "node:path";

// ✅ CJS require pour éviter les problèmes ESM avec qr-image
// eslint-disable-next-line @typescript-eslint/no-var-requires
const qrImage = require("qr-image") as any;

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// ---------------------------------------------------------------------------
// Vérifie ref 5 chiffres
// ---------------------------------------------------------------------------
function isFiveDigits(v: unknown): v is string {
  return typeof v === "string" && /^[0-9]{5}$/.test(v);
}

// ---------------------------------------------------------------------------
// Génère un PNG de QR via qr-image
// ---------------------------------------------------------------------------
function generateQrPngBuffer(text: string, scale = 10): Buffer {
  return qrImage.imageSync(text, {
    type: "png",
    ec_level: "M",
    margin: 0,
    size: scale,
  }) as Buffer;
}

// ---------------------------------------------------------------------------
// ✅ Coordonnées mesurées pour ta planche
// (origine = bas-gauche, unité = point PDF)
// ---------------------------------------------------------------------------
const SLOT_POSITIONS: Array<{ x: number; y: number; size: number }> = [
  { x: 378.254, y: 590.814, size: 113.386 },
  { x: 447.791, y: 704.655, size: 113.386 },
  { x:  33.532, y: 704.524, size: 113.386 },
  { x: 171.524, y: 704.524, size: 113.386 },
  { x: 309.658, y: 704.655, size: 113.386 },

  { x: 188.057, y: 513.999, size: 115.126 },

  { x: 276.750, y:  33.127, size: 116.220 },
  { x: 433.744, y:  20.371, size: 141.732 },
  { x: 174.817, y: 302.352, size: 141.732 },
  { x:  19.217, y: 302.352, size: 141.732 },
];

const FIT_RATIO = 0.94;
const CENTER_IN_CELL = true;

// ---------------------------------------------------------------------------
// ✅ Transforme un Uint8Array en ArrayBuffer compatible Vercel
// ---------------------------------------------------------------------------
function uint8ToArrayBuffer(u8: Uint8Array): ArrayBuffer {
  const ab = new ArrayBuffer(u8.byteLength);
  new Uint8Array(ab).set(u8);
  return ab;
}

// ---------------------------------------------------------------------------
// ✅ Handler GET
// ---------------------------------------------------------------------------
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const publicId = searchParams.get("publicId");

    if (!isFiveDigits(publicId)) {
      return new Response(
        JSON.stringify({ ok: false, error: "publicId must be 5 digits." }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    // URL cible du QR code — adapte si tu veux pointer ailleurs
    const origin = req.nextUrl.origin;
    const targetUrl = `${origin}/case/${publicId}`;

    // ✅ Chemin direct vers ton fichier /public/templates/...
    const templatePath = path.join(
      process.cwd(),
      "public",
      "templates",
      "planche-QR-code.pdf"
    );

    // Vérifie la présence
    try {
      await fs.access(templatePath);
    } catch {
      return new Response(
        JSON.stringify({
          ok: false,
          error: "Template public/templates/planche-QR-code.pdf introuvable",
        }),
        { status: 404, headers: { "Content-Type": "application/json" } }
      );
    }

    // Charge le PDF modèle
    const templateBytes = await fs.readFile(templatePath);
    const pdfDoc = await PDFDocument.load(templateBytes);
    const page = pdfDoc.getPage(0);

    // Génère un QR (1 seul réutilisé pour tous les encadrés)
    const qrPngBuffer = generateQrPngBuffer(targetUrl, 10);
    const qrImg = await pdfDoc.embedPng(qrPngBuffer);

    // Dessine dans chaque encadré
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

    // Petite signature discrète
    page.drawText(`Ref: ${publicId}`, {
      x: 16,
      y: 16,
      size: 8,
      color: rgb(0.25, 0.25, 0.25),
    });

    // Sauvegarde & conversion type-safe
    const pdfBytes = await pdfDoc.save();
    const ab = uint8ToArrayBuffer(pdfBytes);

    return new Response(ab, {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `inline; filename="qr-sheet-${publicId}.pdf"`,
        "Cache-Control": "no-store",
      },
    });
  } catch (err: any) {
    return new Response(
      JSON.stringify({ ok: false, error: String(err?.message || err) }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}
