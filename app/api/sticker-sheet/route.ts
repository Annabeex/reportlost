// app/api/sticker-sheet/route.ts
import { NextRequest, NextResponse } from "next/server";
import { PDFDocument, rgb } from "pdf-lib";
const qrImage = require("qr-image");
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// units
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

// ---------------------------
// Template loader
// ---------------------------
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

// ---------------------------
// QR (design “gauche”) via qr-image
// ---------------------------
function makeQrPng(data: string): Buffer {
  // même niveau que tes autres QR
  return qrImage.imageSync(data, { type: "png", ec_level: "M", margin: 0 }) as Buffer;
}

// ---------------------------
// Frames & slots (TA VERSION + ajouts)
// ---------------------------
const FRAMES: Frame[] = [
  {
    // FRAME 1 — grand bloc haut (coords Canva: X 0.45 / Y 0.66 / L 20.28 / H 22.66)
    x_mm: cm(0.45),
    y_mm: cm(0.66),
    width_mm: cm(20.28),
    height_mm: cm(22.66),
    slots: [
      { left_mm: mm(22.5),  top_mm: mm(19.4), width_mm: mm(18.6), height_mm: mm(18.3), eraseUnder: true, nudge_left_mm: 0, nudge_top_mm: -7 },
      { left_mm: mm(71.1),  top_mm: mm(19.2), width_mm: mm(18.6), height_mm: mm(18.3), eraseUnder: true, nudge_left_mm: 0, nudge_top_mm: -7 },
      { left_mm: mm(121.4), top_mm: mm(20.7), width_mm: mm(16.4), height_mm: mm(16.1), eraseUnder: true, nudge_left_mm: 0, nudge_top_mm: -7 },
      { left_mm: mm(169.9), top_mm: mm(20.1), width_mm: mm(16.9), height_mm: mm(16.6), eraseUnder: true, nudge_left_mm: 0, nudge_top_mm: -7 },

      // 2e ligne — rond
      { left_mm: mm(144.4), top_mm: mm(59.4), width_mm: mm(18.6), height_mm: mm(18.3), eraseUnder: true, nudge_left_mm: 0, nudge_top_mm: -7 },

      // 2e ligne — rectangulaires
      { left_mm: mm(18),   top_mm: mm(81.7),  width_mm: mm(27.4), height_mm: mm(27.0), eraseUnder: true, nudge_left_mm: 0, nudge_top_mm: -7 },
      { left_mm: mm(75),   top_mm: mm(84.1),  width_mm: mm(23.3), height_mm: mm(22.9), eraseUnder: true, nudge_left_mm: 0, nudge_top_mm: -7 },

      // 3e ligne — rect gauche & rect droite
      { left_mm: mm(18),   top_mm: mm(151.9), width_mm: mm(27.4), height_mm: mm(27.0), eraseUnder: true, nudge_left_mm: 0, nudge_top_mm: -7 },
      { left_mm: mm(77.2), top_mm: mm(156.1), width_mm: mm(19.9), height_mm: mm(19.6), eraseUnder: true, nudge_left_mm: 0, nudge_top_mm: -7 },

      // 3e ligne — grand à droite
      { left_mm: mm(131.8), top_mm: mm(136),  width_mm: mm(55.5), height_mm: mm(54.7), eraseUnder: true, nudge_left_mm: 0, nudge_top_mm: -7 },

      // 4e ligne — petit rectangle
      { left_mm: mm(82.7), top_mm: mm(203.7), width_mm: mm(22.3), height_mm: mm(22.0), eraseUnder: true, nudge_left_mm: 0, nudge_top_mm: -7 },
    ],
  },

  // FRAME 2 — 5e ligne, sticker gauche
  {
    x_mm: cm(0.45),
    y_mm: cm(23.55),
    width_mm: cm(14.35),
    height_mm: cm(5.85),
    slots: [
      // Canva : X 10.31 / Y 24.98 / L 3.05 / H 3.00
      { left_mm: mm(103.1), top_mm: mm(249.8), width_mm: mm(30.5), height_mm: mm(30.0), eraseUnder: true, nudge_left_mm: 0, nudge_top_mm: -7 },
    ],
  },

  // FRAME 3 — 5e ligne, petit bloc bas droit
  {
    x_mm: cm(15.13),
    y_mm: cm(23.8),
    width_mm: cm(5.35),
    height_mm: cm(5.35),
    slots: [
      // Canva : X 16.6 / Y 25.39 / L 2.29 / H 2.25
      { left_mm: mm(166.0), top_mm: mm(253.9), width_mm: mm(22.9), height_mm: mm(22.5), eraseUnder: true, nudge_left_mm: 0, nudge_top_mm: -7 },
    ],
  },
];

// ---------------------------
// Build MAILTO like getQRcode
// ---------------------------
function buildMailto(publicId: string, alias?: string | null) {
  const primaryAlias = `${publicId}@scan.reportlost.org`;
  const to = (alias && alias.trim()) || primaryAlias;

  const subject = encodeURIComponent(`I found an item with your QR tag (ID ${publicId})`);
  const body = encodeURIComponent(
    [
      `Hello,`,
      ``,
      `I just found an item that has your Reportlost QR tag (ID ${publicId}).`,
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
  return `mailto:${to}?subject=${subject}&body=${body}`;
}

// ---------------------------
// MAIN
// ---------------------------
export async function GET(req: NextRequest) {
  try {
    const sb = getSupabaseAdmin();
    if (!sb) return NextResponse.json({ ok: false, error: "Supabase non configuré" }, { status: 500 });

    // --- identify the report
    const url = new URL(req.url);
    const id = url.searchParams.get("id");
    const publicIdParam = url.searchParams.get("public_id");
    let public_id: string | null = publicIdParam ? String(publicIdParam) : null;
    let email_alias: string | null = null;

    if (!public_id) {
      if (!id) return NextResponse.json({ ok: false, error: "Paramètre manquant: id ou public_id" }, { status: 400 });
      const { data, error } = await sb
        .from("lost_items")
        .select("public_id, email_alias")
        .eq("id", id)
        .maybeSingle();
      if (error || !data?.public_id) return NextResponse.json({ ok: false, error: "Report introuvable" }, { status: 404 });
      public_id = String(data.public_id);
      email_alias = (data as any).email_alias || null;

      // si pas d'alias, on l’enregistre (comme getQRcode)
      if (!email_alias) {
        email_alias = `${public_id}@scan.reportlost.org`;
        await sb.from("lost_items").update({ email_alias }).eq("id", id);
      }
    }

    if (!/^\d{5}$/.test(public_id!)) {
      return NextResponse.json({ ok: false, error: "public_id invalide (5 chiffres requis)" }, { status: 400 });
    }

    // --- MAILTO identique à getQRcode
    const scanData = buildMailto(public_id!, email_alias);

    // --- PDF template
    const templateBytes = await loadTemplate(req);
    const pdf = await PDFDocument.load(templateBytes);
    const [page] = pdf.getPages();

    // --- un seul QR réutilisé partout (design gauche)
    const qrPng = makeQrPng(scanData);
    const qrImg = await pdf.embedPng(qrPng);

    // --- draw
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
