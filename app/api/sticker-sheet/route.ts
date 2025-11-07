// app/api/sticker-sheet/route.ts
import { NextRequest, NextResponse } from "next/server";
import { PDFDocument } from "pdf-lib";
const qrImage = require("qr-image"); // CJS ok sur Node/Next API routes
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Helpers mm → points (pdf-lib travaille en points à 72 dpi) */
const mm = (n: number) => (n / 25.4) * 72;

/** A4 = 210 × 297 mm */
const A4_W = mm(210);
const A4_H = mm(297);

/**
 * SLOTS = coordonnées (en mm) où coller les QR sur ta planche.
 * ⚠️ Valeurs de départ raisonnables à ajuster une fois : imprime 1 page de test.
 * Tu peux ajouter/retirer des emplacements à volonté.
 *
 * Chaque slot : { x_mm, y_mm, size_mm }
 *  - x_mm, y_mm = coin BAS-GAUCHE du QR sur la page (origine en bas à gauche)
 *  - size_mm     = largeur = hauteur du QR
 */
const SLOTS: Array<{ x_mm: number; y_mm: number; size_mm: number; note?: string }> = [
  // — EXEMPLES (à ajuster à ta planche finale) —
  // Rangée du haut
  { x_mm: 15,  y_mm: 255, size_mm: 40, note: "Format rond" },
  { x_mm: 75,  y_mm: 255, size_mm: 40, note: "Format carré" },
  { x_mm: 135, y_mm: 255, size_mm: 40, note: "Rect. horizontal" },

  // Rangée du milieu
  { x_mm: 15,  y_mm: 175, size_mm: 60, note: "Rect. vertical (grand)" },
  { x_mm: 95,  y_mm: 175, size_mm: 50, note: "Carré moyen" },
  { x_mm: 155, y_mm: 175, size_mm: 35, note: "Mini 35 mm" },

  // Rangée du bas
  { x_mm: 15,  y_mm: 95,  size_mm: 40, note: "Rond" },
  { x_mm: 75,  y_mm: 95,  size_mm: 40, note: "Carré" },
  { x_mm: 135, y_mm: 95,  size_mm: 40, note: "Rect. horizontal" },
];

/** Génère un PNG QR (sans marge) */
function makeQrPng(url: string): Buffer {
  return qrImage.imageSync(url, {
    type: "png",
    ec_level: "M",
    margin: 0,
  }) as Buffer;
}

/** Récupère l’URL de base (prod/préprod/dev) */
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

/** Charge la planche-modèle depuis /public/templates/planche-QR-code.pdf */
async function loadTemplate(req: NextRequest): Promise<Uint8Array> {
  const base = getBaseUrl(req);
  const url = `${base}/templates/planche-QR-code.pdf`; // ← place ton PDF ici : /public/templates/planche-QR-code.pdf
  const res = await fetch(url, { cache: "no-store" });
  if (!res.ok) throw new Error(`Template introuvable (${res.status})`);
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

    // 3) Charger la planche PDF modèle
    const templateBytes = await loadTemplate(req);
    const pdf = await PDFDocument.load(templateBytes);

    // Sanity : s’assurer A4 (sinon on pose quand même aux coords fournies)
    const [page] = pdf.getPages();
    const { width: pw, height: ph } = page.getSize();
    // Optionnel : si ton PDF n’est pas exactement A4, pas grave :
    // tu ajusteras SLOTS pour coller visuellement à TON fond.

    // 4) Générer + embed le QR
    const qrPng = makeQrPng(scanUrl);
    const qrImg = await pdf.embedPng(qrPng);

    // 5) Poser les QR sur tous les emplacements
    for (const s of SLOTS) {
      const x = mm(s.x_mm);
      const y = mm(s.y_mm);
      const size = mm(s.size_mm);
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
