// app/api/sticker-sheet/route.ts
import { NextRequest, NextResponse } from "next/server";
import { PDFDocument, rgb } from "pdf-lib";
const qrImage = require("qr-image");
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// unit helpers
const mm = (n: number) => (n / 25.4) * 72;
const cm = (n: number) => mm(n * 10);

// A4
const A4_W = mm(210);
const A4_H = mm(297);

// types
type SlotTL = {
  left_mm: number;
  top_mm: number;
  width_mm: number;
  height_mm: number;
  eraseUnder?: boolean;
  nudge_left_mm?: number;
  nudge_top_mm?: number;
};

type Frame = {
  x_mm: number;
  y_mm: number;
  width_mm: number;
  height_mm: number;
  slots: SlotTL[];
};

// ============================================================================
// ✅ COORDONNÉES ABSOLUES
// ============================================================================
const FRAMES: Frame[] = [
  // ========================================================================
  // ✅ FRAME 1 — GRAND BLOC DU HAUT
  // ========================================================================
  {
    x_mm: cm(0.45),
    y_mm: cm(0.66),
    width_mm: cm(20.28),
    height_mm: cm(22.66),
    slots: [
      { left_mm: mm(22.5),  top_mm: mm(19.4), width_mm: mm(18.6), height_mm: mm(18.3), eraseUnder: true, nudge_top_mm: -7 },
      { left_mm: mm(71.1),  top_mm: mm(19.2), width_mm: mm(18.6), height_mm: mm(18.3), eraseUnder: true, nudge_top_mm: -7 },
      { left_mm: mm(121.4), top_mm: mm(20.7), width_mm: mm(16.4), height_mm: mm(16.1), eraseUnder: true, nudge_top_mm: -7 },
      { left_mm: mm(169.9), top_mm: mm(20.1), width_mm: mm(16.9), height_mm: mm(16.6), eraseUnder: true, nudge_top_mm: -7 },

      // 2ᵉ ligne : rond
      { left_mm: mm(144.4), top_mm: mm(59.4), width_mm: mm(18.6), height_mm: mm(18.3), eraseUnder: true, nudge_top_mm: -7 },

      // 2ᵉ ligne : rect #1
      { left_mm: mm(18), top_mm: mm(81.7), width_mm: mm(27.4), height_mm: mm(27.0), eraseUnder: true, nudge_top_mm: -7 },

      // 2ᵉ ligne : rect #2
      { left_mm: mm(75), top_mm: mm(84.1), width_mm: mm(23.3), height_mm: mm(22.9), eraseUnder: true, nudge_top_mm: -7 },

      // 3ᵉ ligne : rect gauche
      { left_mm: mm(18), top_mm: mm(151.9), width_mm: mm(27.4), height_mm: mm(27.0), eraseUnder: true, nudge_top_mm: -7 },

      // 3ᵉ ligne : rect droite
      { left_mm: mm(77.2), top_mm: mm(156.1), width_mm: mm(19.9), height_mm: mm(19.6), eraseUnder: true, nudge_top_mm: -7 },

      // 3ᵉ ligne : grand sticker droite
      { left_mm: mm(131.8), top_mm: mm(136), width_mm: mm(55.5), height_mm: mm(54.7), eraseUnder: true, nudge_top_mm: -7 },

      // 4ᵉ ligne : petit rectangle
      { left_mm: mm(82.7), top_mm: mm(203.7), width_mm: mm(22.3), height_mm: mm(22.0), eraseUnder: true, nudge_top_mm: -7 },
    ],
  },

  // ========================================================================
  // ✅ FRAME 2 — 5ᵉ ligne : Sticker gauche
  // ========================================================================
  {
    x_mm: cm(0), y_mm: cm(0), width_mm: cm(0), height_mm: cm(0),
    slots: [
      { 
  left_mm: mm(103.1), 
  top_mm: mm(249.8), 
  width_mm: mm(30.5), 
  height_mm: mm(30.0), 
  eraseUnder: true, 
  nudge_left_mm: 1.5, 
  nudge_top_mm: -7 
},
    ],
  },

  // ========================================================================
  // ✅ FRAME 3 — 5ᵉ ligne : Sticker droit
  // ========================================================================
  {
    x_mm: cm(0), y_mm: cm(0), width_mm: cm(0), height_mm: cm(0),
    slots: [
      { 
  left_mm: mm(166.0), 
  top_mm: mm(253.9), 
  width_mm: mm(22.9), 
  height_mm: mm(22.5), 
  eraseUnder: true, 
  nudge_left_mm: 1.5, 
  nudge_top_mm: -7 
},
    ],
  },
];

// ============================================================================
// Load PDF template
// ============================================================================
function getBaseUrl(req: NextRequest) {
  const fixed = (process.env.NEXT_PUBLIC_SITE_URL || "").trim();
  if (fixed) return fixed.replace(/\/+$/, "");
  const proto = req.headers.get("x-forwarded-proto") || "https";
  const host = req.headers.get("x-forwarded-host") || req.headers.get("host") || "localhost:3000";
  return `${proto}://${host}`;
}

async function loadTemplate(req: NextRequest): Promise<Uint8Array> {
  const base = getBaseUrl(req);
  const url = `${base}/templates/planche-QR-code.pdf`;
  const res = await fetch(url, { cache: "no-store" });
  if (!res.ok) throw new Error(`Template introuvable (${res.status}) : ${url}`);
  return new Uint8Array(await res.arrayBuffer());
}

// ============================================================================
// QR generator
// ============================================================================
function makeQrPng(url: string): Buffer {
  return qrImage.imageSync(url, { type: "png", ec_level: "M", margin: 0 }) as Buffer;
}

// ============================================================================
// MAIN ROUTE
// ============================================================================
export async function GET(req: NextRequest) {
  try {
    const sb = getSupabaseAdmin();
    if (!sb) {
      return NextResponse.json({ ok: false, error: "Supabase non configuré" }, { status: 500 });
    }

    const url = new URL(req.url);
    const id = url.searchParams.get("id");
    const publicIdParam = url.searchParams.get("public_id");

    let public_id: string | null = publicIdParam;

    if (!public_id) {
      if (!id) {
        return NextResponse.json({ ok: false, error: "Paramètre manquant: id ou public_id" }, { status: 400 });
      }
      const { data, error } = await sb.from("lost_items").select("public_id").eq("id", id).maybeSingle();
      if (error || !data?.public_id) {
        return NextResponse.json({ ok: false, error: "Report introuvable" }, { status: 404 });
      }
      public_id = String(data.public_id);
    }

    if (!/^\d{5}$/.test(public_id)) {
      return NextResponse.json({ ok: false, error: "public_id invalide (5 chiffres requis)" }, { status: 400 });
    }

    const base = getBaseUrl(req);
    const scanUrl = `${base}/message?case=${encodeURIComponent(public_id)}`;

    const templateBytes = await loadTemplate(req);
    const pdf = await PDFDocument.load(templateBytes);
    const [page] = pdf.getPages();

    const qrPng = makeQrPng(scanUrl);
    const qrImg = await pdf.embedPng(qrPng);

    for (const f of FRAMES) {
      for (const s of f.slots) {
        const x = s.left_mm + (s.nudge_left_mm ?? 0);
        const y = A4_H - ((s.top_mm + (s.nudge_top_mm ?? 0)) + s.height_mm);

        if (s.eraseUnder) {
          const pad = mm(0.4);
          page.drawRectangle({
            x: x - pad,
            y: y - pad,
            width: s.width_mm + pad * 2,
            height: s.height_mm + pad * 2,
            color: rgb(1, 1, 1),
          });
        }

        page.drawImage(qrImg, {
          x, y,
          width: s.width_mm,
          height: s.height_mm,
        });
      }
    }

    const bytes = await pdf.save();
    return new NextResponse(Buffer.from(bytes), {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `inline; filename=stickers_${public_id}.pdf`,
        "Cache-Control": "no-store",
      },
    });
  } catch (e: any) {
    console.error("[sticker-sheet] error:", e);
    return NextResponse.json({ ok: false, error: String(e?.message || e) }, { status: 500 });
  }
}
