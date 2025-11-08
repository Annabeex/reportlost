// app/api/sticker-sheet/route.ts
import { NextRequest, NextResponse } from "next/server";
import { PDFDocument, rgb } from "pdf-lib";
const qrImage = require("qr-image");
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// ────────────────────────────────────────────────────────────────────────────
// Units
// ────────────────────────────────────────────────────────────────────────────
const mm = (n: number) => (n / 25.4) * 72;
const cm = (n: number) => mm(n * 10);

// A4
const A4_W = mm(210);
const A4_H = mm(297);

// ────────────────────────────────────────────────────────────────────────────
// Types
// ────────────────────────────────────────────────────────────────────────────
type SlotTL = {
  left_mm: number;      // Canva: coin haut-gauche (absolu)
  top_mm: number;       // Canva: coin haut-gauche (absolu)
  width_mm: number;
  height_mm: number;
  eraseUnder?: boolean; // masque blanc
  nudge_left_mm?: number; // micro-déplacement horizontal (+ → droite)
  nudge_top_mm?: number;  // micro-déplacement vertical (+ → descend)
};

type Frame = {
  x_mm: number;
  y_mm: number;
  width_mm: number;
  height_mm: number;
  slots: SlotTL[];
};

// ────────────────────────────────────────────────────────────────────────────
// FRAMES — coordonnées absolues (Canva), avec mêmes micro-réglages (-7 top)
// ────────────────────────────────────────────────────────────────────────────
const FRAMES: Frame[] = [
  // ========================================================================
  // FRAME 1 — GRAND BLOC DU HAUT
  // Canva: X 0.45 / Y 0.66 / L 20.28 / H 22.66
  // ========================================================================
  {
    x_mm: cm(0.45),
    y_mm: cm(0.66),
    width_mm: cm(20.28),
    height_mm: cm(22.66),
    slots: [
      { left_mm: mm(22.5),  top_mm: mm(19.4),  width_mm: mm(18.6), height_mm: mm(18.3), eraseUnder: true, nudge_left_mm: 0,   nudge_top_mm: -7 },
      { left_mm: mm(71.1),  top_mm: mm(19.2),  width_mm: mm(18.6), height_mm: mm(18.3), eraseUnder: true, nudge_left_mm: 0,   nudge_top_mm: -7 },
      { left_mm: mm(121.4), top_mm: mm(20.7),  width_mm: mm(16.4), height_mm: mm(16.1), eraseUnder: true, nudge_left_mm: 0,   nudge_top_mm: -7 },
      { left_mm: mm(169.9), top_mm: mm(20.1),  width_mm: mm(16.9), height_mm: mm(16.6), eraseUnder: true, nudge_left_mm: 0,   nudge_top_mm: -7 },

      // 2e ligne — rond
      { left_mm: mm(144.4), top_mm: mm(59.4),  width_mm: mm(18.6), height_mm: mm(18.3), eraseUnder: true, nudge_left_mm: 0,   nudge_top_mm: -7 },

      // 2e ligne — rectangulaire #1
      // Canva : X 1.8 / Y 8.17 / L 2.74 / H 2.7
      { left_mm: mm(18),    top_mm: mm(81.7),  width_mm: mm(27.4), height_mm: mm(27.0), eraseUnder: true, nudge_left_mm: 0,   nudge_top_mm: -7 },

      // 2e ligne — rectangulaire #2
      // Canva : X 7.5 / Y 8.41 / L 2.33 / H 2.29
      { left_mm: mm(75),    top_mm: mm(84.1),  width_mm: mm(23.3), height_mm: mm(22.9), eraseUnder: true, nudge_left_mm: 0,   nudge_top_mm: -7 },

      // 3e ligne — rectangulaire gauche
      // Canva : X 1.8 / Y 15.19 / L 2.74 / H 2.7
      { left_mm: mm(18),    top_mm: mm(151.9), width_mm: mm(27.4), height_mm: mm(27.0), eraseUnder: true, nudge_left_mm: 0,   nudge_top_mm: -7 },

      // 3e ligne — rectangulaire droite
      // Canva : X 7.72 / Y 15.61 / L 1.99 / H 1.96
      { left_mm: mm(77.2),  top_mm: mm(156.1), width_mm: mm(19.9), height_mm: mm(19.6), eraseUnder: true, nudge_left_mm: 0.8, nudge_top_mm: -7 },

      // 3e ligne — grand sticker à droite
      // Canva : X 13.18 / Y 13.6 / L 5.55 / H 5.47
      { left_mm: mm(131.8), top_mm: mm(136),   width_mm: mm(55.5), height_mm: mm(54.7), eraseUnder: true, nudge_left_mm: 0.8, nudge_top_mm: -7 },

      // 4e ligne — petit rectangle
      // Canva : X 8.27 / Y 20.37 / L 2.23 / H 2.2
      { left_mm: mm(82.7),  top_mm: mm(203.7), width_mm: mm(22.3), height_mm: mm(22.0), eraseUnder: true, nudge_left_mm: 0.8, nudge_top_mm: -7 },
    ],
  },

  // ========================================================================
  // FRAME 2 — BANDEAU BAS GAUCHE (5e ligne — sticker gauche)
  // (coords Canva du cadre : X 0.45 / Y 23.55 / L 14.35 / H 5.85)
  // ========================================================================
  {
    x_mm: cm(0.45),
    y_mm: cm(23.55),
    width_mm: cm(14.35),
    height_mm: cm(5.85),
    slots: [
      // 5e ligne — gauche
      // Canva : X 10.31 / Y 24.98 / L 3.05 / H 3.00
      { left_mm: mm(103.1), top_mm: mm(249.8), width_mm: mm(30.5), height_mm: mm(30.0), eraseUnder: true, nudge_left_mm: 0.8, nudge_top_mm: -7 },
    ],
  },

  // ========================================================================
  // FRAME 3 — PETIT BLOC BAS DROIT (5e ligne — sticker droit)
  // (coords Canva du cadre : X 15.13 / Y 23.8 / L 5.35 / H 5.35)
  // ========================================================================
  {
    x_mm: cm(15.13),
    y_mm: cm(23.8),
    width_mm: cm(5.35),
    height_mm: cm(5.35),
    slots: [
      // 5e ligne — droit
      // Canva : X 16.6 / Y 25.39 / L 2.29 / H 2.25
      { left_mm: mm(166.0), top_mm: mm(253.9), width_mm: mm(22.9), height_mm: mm(22.5), eraseUnder: true, nudge_left_mm: 0.8, nudge_top_mm: -7 },
    ],
  },
];

// ────────────────────────────────────────────────────────────────────────────
// Template loader
// ────────────────────────────────────────────────────────────────────────────
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

// ────────────────────────────────────────────────────────────────────────────
function makeQrPng(data: string): Buffer {
  // même niveau ECC que getQRcode
  return qrImage.imageSync(data, { type: "png", ec_level: "M", margin: 0 }) as Buffer;
}

// ────────────────────────────────────────────────────────────────────────────
// MAIN
// ────────────────────────────────────────────────────────────────────────────
export async function GET(req: NextRequest) {
  try {
    const sb = getSupabaseAdmin();
    if (!sb) {
      return NextResponse.json({ ok: false, error: "Supabase non configuré" }, { status: 500 });
    }

    // Params: on accepte ?public_id=12345 ou ?id=<uuid>
    const url = new URL(req.url);
    const id = url.searchParams.get("id");
    const publicIdParam = url.searchParams.get("public_id");

    // 1) Résoudre public_id
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

    // 2) Construire l'URL mailto (même contenu que getQRcode)
    const alias = `${public_id}@scan.reportlost.org`;
    const subject = encodeURIComponent(`I found an item with your QR tag (ID ${public_id})`);
    const body = encodeURIComponent(
      [
        `Hello,`,
        ``,
        `I just found an item that has your Reportlost QR tag (ID ${public_id}).`,
        ``,
        `Here are the details:`,
        `• Where I found it:`,
        `• Date & time:`,
        `• Item description:`,
        ``,
        `How you can reach me:`,
        `• Name:`,
        `• Phone:`,
        `• Email:`,
        ``,
        `Message to you:`,
        `—`,
        ``,
        `Please reply to this email so we can arrange pickup or shipping.`,
        ``,
        `Thank you,`,
        `— Reportlost`,
      ].join("\n")
    );
    const mailto = `mailto:${alias}?subject=${subject}&body=${body}`;

    // 3) Charger le PDF modèle
    const templateBytes = await loadTemplate(req);
    const pdf = await PDFDocument.load(templateBytes);
    const [page] = pdf.getPages();

    // 4) Générer un seul PNG de QR, réutilisé partout
    const qrPng = makeQrPng(mailto);
    const qrImg = await pdf.embedPng(qrPng);

    // 5) Pose (absolu Canva → PDF bottom-left)
    for (const f of FRAMES) {
      for (const s of f.slots) {
        const nudgeX = s.nudge_left_mm ?? 0;
        const nudgeT = s.nudge_top_mm ?? 0;

        const x = s.left_mm + nudgeX;
        const y = A4_H - ((s.top_mm + nudgeT) + s.height_mm);

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

        page.drawImage(qrImg, { x, y, width: s.width_mm, height: s.height_mm });
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
