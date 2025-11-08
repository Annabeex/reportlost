// app/api/sticker-sheet/route.ts
import { NextRequest, NextResponse } from "next/server";
import { PDFDocument } from "pdf-lib";
// eslint-disable-next-line @typescript-eslint/no-var-requires
const qrImage: { imageSync: (data: string, opts: any) => Buffer } = require("qr-image");
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// ---------------------------
// Helpers
// ---------------------------
const mm = (n: number) => (n / 25.4) * 72; // pdf-lib en points (72 dpi)

// Coordonnées (en mm) des QR à poser sur TA planche PDF.
// 👉 Ajuste-les 1 fois si besoin, puis c’est terminé.
const SLOTS: Array<{ x_mm: number; y_mm: number; size_mm: number; note?: string }> = [
  // Exemple de maquette (3 rangées). Ajuste sans scrupule après un tirage test.
  // Rangée du haut
  { x_mm: 18,  y_mm: 255, size_mm: 38, note: "rond" },
  { x_mm: 78,  y_mm: 255, size_mm: 38, note: "carré" },
  { x_mm: 138, y_mm: 255, size_mm: 38, note: "rect. horizontal" },

  // Rangée milieu
  { x_mm: 18,  y_mm: 175, size_mm: 58, note: "rect. vertical (grand)" },
  { x_mm: 98,  y_mm: 175, size_mm: 48, note: "carré moyen" },
  { x_mm: 158, y_mm: 175, size_mm: 34, note: "mini" },

  // Rangée bas
  { x_mm: 18,  y_mm: 95,  size_mm: 38, note: "rond" },
  { x_mm: 78,  y_mm: 95,  size_mm: 38, note: "carré" },
  { x_mm: 138, y_mm: 95,  size_mm: 38, note: "rect. horizontal" },
];

// QR PNG sans marge (le fond crème/contour est déjà sur la planche)
function makeQrPng(url: string): Buffer {
  return qrImage.imageSync(url, { type: "png", ec_level: "M", margin: 0 }) as Buffer;
}

// URL de base (prod/préprod/dev)
function getBaseUrl(req: NextRequest) {
  const fixed = (process.env.NEXT_PUBLIC_SITE_URL || "").trim();
  if (fixed) return fixed.replace(/\/+$/, "");
  const proto = req.headers.get("x-forwarded-proto") || "https";
  const host = req.headers.get("x-forwarded-host") || req.headers.get("host") || "localhost:3000";
  return `${proto}://${host}`;
}

// Charge le PDF modèle depuis /public/templates/planche-QR-code.pdf
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

    // 1) Récupération du public_id (5 chiffres)
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

    // 2) URL de scan (page message anonyme)
    const base = getBaseUrl(req);
    const scanUrl = `${base}/message?case=${encodeURIComponent(public_id)}`;

    // 3) Charger la planche PDF
    const templateBytes = await loadTemplate(req);
    const pdf = await PDFDocument.load(templateBytes);
    const [page] = pdf.getPages();

    // 4) Générer + embarquer le QR
    const qrPng = makeQrPng(scanUrl);
    const qrImg = await pdf.embedPng(qrPng);

    // 5) Poser le même QR sur chaque emplacement de la planche
    for (const s of SLOTS) {
      page.drawImage(qrImg, {
        x: mm(s.x_mm),
        y: mm(s.y_mm),
        width: mm(s.size_mm),
        height: mm(s.size_mm),
      });
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
