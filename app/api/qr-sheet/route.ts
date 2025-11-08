// app/api/sticker-sheet/route.ts
import { NextRequest, NextResponse } from "next/server";
import { PDFDocument, rgb } from "pdf-lib";
// CJS ok en route API Next
const qrImage = require("qr-image");
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/* ---------- Utils ---------- */
const mm = (n: number) => (n / 25.4) * 72; // 72pt/in • 25.4 mm/in

/** A4 portrait */
const PAGE_W_MM = 210;
const PAGE_H_MM = 297;
const PAGE_W_PT = mm(PAGE_W_MM);
const PAGE_H_PT = mm(PAGE_H_MM);

/** Charge la planche modèle depuis /public/templates/planche-QR-code.pdf */
async function loadTemplate(req: NextRequest): Promise<Uint8Array> {
  const base =
    (process.env.NEXT_PUBLIC_SITE_URL || "").replace(/\/+$/, "") ||
    `${req.headers.get("x-forwarded-proto") || "https"}://${
      req.headers.get("x-forwarded-host") || req.headers.get("host")
    }`;
  const url = `${base}/templates/planche-QR-code.pdf`;
  const res = await fetch(url, { cache: "no-store" });
  if (!res.ok) throw new Error(`Template introuvable (${res.status})`);
  return new Uint8Array(await res.arrayBuffer());
}

/** Génère un PNG QR (sans marge) */
function makeQrPng(url: string): Buffer {
  return qrImage.imageSync(url, {
    type: "png",
    ec_level: "M",
    margin: 0,
  }) as Buffer;
}

/* ---------- SLOTS : coller ici tes mesures Canva ---------- */
/**
 * IMPORTANT
 * - Canva t’affiche LARG., HAUT., X, Y (souvent en cm) pour chaque QR maquette.
 * - Convertis-les en mm (cm × 10) et renseigne ci-dessous.
 * - left_mm / top_mm = coin SUPÉRIEUR GAUCHE de la zone QR.
 * - width_mm / height_mm = taille exacte du QR voulu (souvent carré).
 * - Le code convertit automatiquement en coordonnées PDF (origine bas-gauche).
 *
 * Commence avec 2–3 emplacements, vérifie en local (?debug=1), puis complète.
 */
type SlotTopLeft = {
  left_mm: number;
  top_mm: number;
  width_mm: number;
  height_mm: number;
  eraseUnder?: boolean; // masque blanc sous le QR (par défaut true)
};

// EXEMPLES (à remplacer par tes vraies valeurs Canva) :
const SLOTS_TOPLEFT: SlotTopLeft[] = [
  // ---- Ligne 1 (exemples fictifs) ----
  { left_mm: 22.5,  top_mm: 19.4, width_mm: 18.6, height_mm: 18.3, eraseUnder: true }, // rond 1
  { left_mm: 71.1, top_mm: 19.2, width_mm: 18.6, height_mm: 18.3, eraseUnder: true }, // rond 2
  { left_mm: 121.4, top_mm: 20.7, width_mm: 16.4, height_mm: 16.1, eraseUnder: true }, // rond 3
  { left_mm: 169.9, top_mm: 20.1, width_mm: 16.9, height_mm: 16.6, eraseUnder: true }, // rond 4

  // ---- Ligne 2 (rect. verticaux) ----
  { left_mm: 27.4,  top_mm: 27, width_mm: 18, height_mm: 81.7, eraseUnder: true },
  { left_mm: 23.3,  top_mm: 22.9, width_mm: 75, height_mm: 84.1, eraseUnder: true },
  { left_mm: 18.6, top_mm: 18.3, width_mm: 144.4, height_mm: 59.4, eraseUnder: true },

  // ---- Grand rectangle à droite ----
  { left_mm: 55.5, top_mm: 54.7, width_mm: 131.8, height_mm: 136, eraseUnder: true },

  // ---- Lignes du bas… (complète avec tes vraies mesures) ----
  // { left_mm: ..., top_mm: ..., width_mm: ..., height_mm: ..., eraseUnder: true },
];

/* ---------- Route ---------- */
export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const debug = url.searchParams.get("debug") === "1";
    const onlyIdx = url.searchParams.get("only"); // e.g. ?only=0 pour ne poser qu’un slot

    // public_id : ?public_id=12345 ou via lost_items.id
    const sb = getSupabaseAdmin();
    if (!sb) {
      return NextResponse.json({ ok: false, error: "Supabase non configuré" }, { status: 500 });
    }
    let public_id = url.searchParams.get("public_id");
    if (!public_id) {
      const id = url.searchParams.get("id");
      if (!id) {
        return NextResponse.json({ ok: false, error: "Paramètre manquant: id ou public_id" }, { status: 400 });
      }
      const { data, error } = await sb
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

    // URL scannée
    const base =
      (process.env.NEXT_PUBLIC_SITE_URL || "").replace(/\/+$/, "") ||
      `${req.headers.get("x-forwarded-proto") || "https"}://${
        req.headers.get("x-forwarded-host") || req.headers.get("host")
      }`;
    const scanUrl = `${base}/message?case=${encodeURIComponent(public_id)}`;

    // Charger la planche
    const templateBytes = await loadTemplate(req);
    const pdf = await PDFDocument.load(templateBytes);
    const [page] = pdf.getPages();
    const { width: pw, height: ph } = page.getSize();

    // Sanity : si ton PDF n’est pas exactement A4, on convertit quand même
    // en proportion de la taille réelle.
    const scaleX = pw / PAGE_W_PT;
    const scaleY = ph / PAGE_H_PT;

    // QR unique
    const qrPng = makeQrPng(scanUrl);
    const qrImg = await pdf.embedPng(qrPng);

    // Sélection de slots
    const slots = SLOTS_TOPLEFT.filter((_, i) =>
      onlyIdx === null ? true : i === Number(onlyIdx)
    );

    for (const s of slots) {
      const leftPt = mm(s.left_mm) * scaleX;
      const topPt = mm(s.top_mm) * scaleY;
      const wPt = mm(s.width_mm) * scaleX;
      const hPt = mm(s.height_mm) * scaleY;

      // Conversion top-left (Canva) -> bottom-left (PDF)
      const x = leftPt;
      const y = ph - topPt - hPt;

      // Masque blanc pour cacher le QR maquette en dessous
      if (s.eraseUnder !== false) {
        page.drawRectangle({
          x,
          y,
          width: wPt,
          height: hPt,
          color: rgb(1, 1, 1),
        });
      }

      // Debug : contour rouge
      if (debug) {
        page.drawRectangle({
          x,
          y,
          width: wPt,
          height: hPt,
          borderWidth: 1,
          borderColor: rgb(1, 0, 0),
          color: undefined,
        });
      }

      // Coller le QR
      page.drawImage(qrImg, {
        x,
        y,
        width: wPt,
        height: hPt,
      });
    }

    const bytes = await pdf.save();
    const fileName = `stickers_${public_id}.pdf`;
    return new NextResponse(Buffer.from(bytes), {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `inline; filename="${fileName}"`,
        "Cache-Control": "no-store",
      },
    });
  } catch (e: any) {
    console.error("[sticker-sheet]", e);
    return NextResponse.json({ ok: false, error: String(e?.message || e) }, { status: 500 });
  }
}
