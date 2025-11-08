// app/api/sticker-sheet/route.ts
import { NextRequest, NextResponse } from "next/server";
import { PDFDocument, rgb } from "pdf-lib";
const qrImage = require("qr-image"); // CJS ok en route API Next.js
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/* ===========================
   Helpers
=========================== */
const mm = (n: number) => (n / 25.4) * 72; // pdf-lib travaille en points (72 dpi)

/** A4 = 210 × 297 mm (info seulement) */
const A4_W = mm(210);
const A4_H = mm(297);

/** 
 * Mode debug : dessine des cadres rouges à l’emplacement prévu du QR.
 * Mets false quand c’est calé.
 */
const DEBUG_OUTLINES = true;

/**
 * Emplacements (en mm) du coin bas-gauche + taille du QR.
 * ⚠️ Ce sont des valeurs de base : imprime une page de test et ajuste.
 * Tu peux ajouter / retirer des entrées librement.
 */
const SLOTS: Array<{ x_mm: number; y_mm: number; size_mm: number; note?: string }> = [
  // --- Rangée du haut (exemple) ---
  { x_mm: 13,  y_mm: 255, size_mm: 42, note: "Rond" },
  { x_mm: 73,  y_mm: 255, size_mm: 42, note: "Carré" },
  { x_mm: 133, y_mm: 255, size_mm: 42, note: "Rond" },
  { x_mm: 193, y_mm: 255, size_mm: 42, note: "Rond" },

  // --- Rangée du milieu (exemple) ---
  { x_mm: 24,  y_mm: 171, size_mm: 62, note: "Rect. vertical" },
  { x_mm: 104, y_mm: 171, size_mm: 62, note: "Rect. vertical" },
  { x_mm: 172, y_mm: 166, size_mm: 72, note: "Grand rect. vertical (droite)" },

  // --- Rangée du bas (exemple) ---
  { x_mm: 40,  y_mm: 86,  size_mm: 60, note: "Rect. vertical bas gauche" },
  { x_mm: 120, y_mm: 86,  size_mm: 60, note: "Rect. vertical bas centre" },
  { x_mm: 180, y_mm: 98,  size_mm: 52, note: "Grand rect. vertical bas droite" },

  // --- Bandeau horizontal (tout en bas) ---
  { x_mm: 40,  y_mm: 26,  size_mm: 38, note: "Bandeau horizontal" },
  { x_mm: 120, y_mm: 26,  size_mm: 38, note: "Bandeau horizontal" },
];

/** Génère un PNG de QR (sans marge) */
function makeQrPng(url: string): Buffer {
  return qrImage.imageSync(url, {
    type: "png",
    ec_level: "M",
    margin: 0,
  }) as Buffer;
}

/** URL de base (prod/préprod/dev) */
function getBaseUrl(req: NextRequest) {
  const fixed = (process.env.NEXT_PUBLIC_SITE_URL || "").trim();
  if (fixed) return fixed.replace(/\/+$/, "");
  const proto = req.headers.get("x-forwarded-proto") || "https";
  const host =
    req.headers.get("x-forwarded-host") ||
    req.headers.get("host") ||
    "localhost:3000";
  return `${proto}://${host}`;
}

/** Charge le fond depuis /public/templates/planche-QR-code.pdf */
async function loadTemplate(req: NextRequest): Promise<Uint8Array> {
  const base = getBaseUrl(req);
  const url = `${base}/templates/planche-QR-code.pdf`;
  const res = await fetch(url, { cache: "no-store" });
  if (!res.ok) throw new Error(`Template introuvable (${res.status}) à ${url}`);
  return new Uint8Array(await res.arrayBuffer());
}

export async function GET(req: NextRequest) {
  try {
    const sb = getSupabaseAdmin();
    if (!sb) {
      return NextResponse.json({ ok: false, error: "Supabase non configuré" }, { status: 500 });
    }

    const url = new URL(req.url);
    const id = url.searchParams.get("id");
    const publicIdParam = url.searchParams.get("public_id");

    // 1) public_id (5 chiffres) depuis ?public_id=xxxxx ou via lost_items.id
    let public_id: string | null = publicIdParam;
    if (!public_id) {
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

    // 2) URL scannée (page message anonyme)
    const base = getBaseUrl(req);
    const scanUrl = `${base}/message?case=${encodeURIComponent(public_id)}`;

    // 3) Charger la planche modèle et créer le doc en sortie
    const templateBytes = await loadTemplate(req);
    const pdf = await PDFDocument.load(templateBytes);
    const [page] = pdf.getPages();

    // 4) Générer + embed le QR
    const qrPng = makeQrPng(scanUrl);
    const qrImg = await pdf.embedPng(qrPng);

    // 5) Poser les QR sur tous les emplacements
    for (const s of SLOTS) {
      const x = mm(s.x_mm);
      const y = mm(s.y_mm);
      const size = mm(s.size_mm);

      // Debug : cadre rouge (corrigé → rgb(1,0,0))
      if (DEBUG_OUTLINES) {
        page.drawRectangle({
          x,
          y,
          width: size,
          height: size,
          borderColor: rgb(1, 0, 0),
          borderWidth: 1.2,
        });
      }

      page.drawImage(qrImg, { x, y, width: size, height: size });
    }

    // 6) Retour PDF
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
    console.error("[sticker-sheet] error:", e);
    return NextResponse.json({ ok: false, error: String(e?.message || e) }, { status: 500 });
  }
}
