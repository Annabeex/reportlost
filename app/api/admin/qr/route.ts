// app/api/admin/qr/route.ts
import { NextRequest, NextResponse } from "next/server";

// ⚙️ QRCode nécessite Buffer → runtime Node
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;

import { customAlphabet } from "nanoid";
import { createClient } from "@supabase/supabase-js";

const nanoid = customAlphabet(
  "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz",
  22
);

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_SERVICE_ROLE = process.env.SUPABASE_SERVICE_ROLE_KEY!;

// --------------------
// Utils
// --------------------
function json(data: any, status = 200) {
  const res = NextResponse.json(data, { status });
  res.headers.set("Cache-Control", "no-store");
  return res;
}

// --------------------
// GET principal
// --------------------
export async function GET(req: NextRequest) {
  try {
    // Import dynamique pour éviter soucis types
    // @ts-ignore
    const QR: any = await import("qrcode");

    const url = new URL(req.url);
    const searchParams = url.searchParams;

    const id = searchParams.get("id");
    const format = (searchParams.get("format") || "svg").toLowerCase(); // svg | png
    const aliasMode = (searchParams.get("aliasMode") || "scan").toLowerCase(); // scan | item

    if (!id) {
      return json({ ok: false, error: "Missing id" }, 400);
    }

    const admin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE);

    // 1) Récupération item
    const { data: item, error } = await admin
      .from("lost_items")
      .select("id, public_id, qr_token, email_alias")
      .eq("id", id)
      .single();

    if (error || !item) {
      return json({ ok: false, error: "Item not found" }, 404);
    }

    const publicId = String(item.public_id || "").trim();
    if (!publicId) {
      return json({ ok: false, error: "Missing public_id" }, 400);
    }

    // 2) Token QR
    let token = item.qr_token;
    if (!token) {
      token = nanoid();
      const { error: updErr } = await admin
        .from("lost_items")
        .update({ qr_token: token })
        .eq("id", id);
      if (updErr) {
        return json({ ok: false, error: "Cannot save token" }, 500);
      }
    }

    // 3) Alias email
    const primaryAlias = `${publicId}@scan.reportlost.org`;
    const secondaryAlias = `item${publicId}@reportlost.org`;
    const aliasToUse = aliasMode === "item" ? secondaryAlias : primaryAlias;

    if (!item.email_alias) {
      const { error: aliasErr } = await admin
        .from("lost_items")
        .update({ email_alias: aliasToUse })
        .eq("id", id);
      if (aliasErr) {
        return json({ ok: false, error: "Cannot save email alias" }, 500);
      }
    }

    // 4) Mailto
    const subject = encodeURIComponent(
      `I found an item with your QR tag (ID ${publicId})`
    );

    const body = encodeURIComponent(
      [
        "Hello,",
        "",
        `I just found an item with your ReportLost QR tag (ID ${publicId}).`,
        "",
        "Details:",
        "• Where I found it:",
        "• Date & time:",
        "• Item description:",
        "",
        "My contact:",
        "• Name:",
        "• Phone:",
        "• Email:",
        "",
        "Please reply so we can arrange pickup or shipping.",
        "",
        "— ReportLost",
      ].join("\n")
    );

    const mailtoUrl = `mailto:${aliasToUse}?subject=${subject}&body=${body}`;

    // 5) Génération QR
    if (format === "png") {
      const dataUrl = await QR.toDataURL(mailtoUrl, {
        errorCorrectionLevel: "M",
        margin: 1,
        scale: 8,
      });
      return json({
        ok: true,
        format: "png",
        dataUrl,
        scanUrl: mailtoUrl,
        fileName: `RL-${publicId}.png`,
        alias: aliasToUse,
      });
    }

    const svg = await QR.toString(mailtoUrl, {
      type: "svg",
      errorCorrectionLevel: "M",
      margin: 1,
    });

    return json({
      ok: true,
      format: "svg",
      svg,
      dataUrl: `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`,
      scanUrl: mailtoUrl,
      fileName: `RL-${publicId}.svg`,
      alias: aliasToUse,
    });
  } catch (e: any) {
    return json(
      { ok: false, error: e?.message || String(e) },
      500
    );
  }
}

// --------------------
// POST → délègue à GET
// --------------------
export async function POST(req: NextRequest) {
  const url = new URL(req.url);
  const sp = url.searchParams;

  if (!sp.get("id")) {
    try {
      const { id, format, aliasMode } = await req.json();
      if (id) {
        sp.set("id", String(id));
        if (format) sp.set("format", String(format));
        if (aliasMode) sp.set("aliasMode", String(aliasMode));
      }
    } catch {
      // ignore
    }
  }

  return GET(new NextRequest(url.toString(), { headers: req.headers }));
}

// --------------------
// HEAD
// --------------------
export function HEAD() {
  return new NextResponse(null, { status: 200 });
}
