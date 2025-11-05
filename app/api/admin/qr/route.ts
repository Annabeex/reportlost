import { NextRequest, NextResponse } from "next/server";

// ⚙️ Important: QRCode a besoin de Buffer → runtime Node
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

// ——————————————————————————————
// Utilitaires
// ——————————————————————————————
function json(data: any, status = 200) {
  return NextResponse.json(data, { status });
}

function bad(method: string) {
  return json({ ok: false, error: `Method ${method} not allowed` }, 405);
}

// ——————————————————————————————
// GET principal (et POST délégué)
// ——————————————————————————————
export async function GET(req: NextRequest) {
  try {
    // Import dynamique (évite les warnings de types)
    // @ts-ignore
    const QR: any = await import("qrcode");

    const url = new URL(req.url);
    const searchParams = url.searchParams;

    // On accepte id fourni en query: ?id=... (UUID ou row id)
    const id = searchParams.get("id");
    const format = (searchParams.get("format") || "svg").toLowerCase(); // svg|png
    const aliasMode = (searchParams.get("aliasMode") || "scan").toLowerCase(); // scan|item

    if (!id) {
      return json({ ok: false, error: "Missing id" }, 400);
    }

    const admin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE);

    // 1) Récupérer l’item
    const { data: item, error: fetchErr } = await admin
      .from("lost_items")
      .select("id, public_id, qr_token, email_alias")
      .eq("id", id)
      .single();

    if (fetchErr || !item) {
      return json({ ok: false, error: "Item not found" }, 404);
    }

    const publicId = String(item.public_id || "").trim();
    if (!publicId) {
      return json({ ok: false, error: "Missing public_id on item" }, 400);
    }

    // 2) Générer un token si absent (on le garde pour compat)
    let token: string | null = (item as any).qr_token || null;
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

    // 3) Assurer un alias email si absent
    //    – par défaut on utilise le sous-domaine Mailgun: {public_id}@scan.reportlost.org
    //    – on accepte aussi le format secondaire: item{public_id}@reportlost.org
    let storedAlias: string | null = (item as any).email_alias || null;

    const primaryAlias = `${publicId}@scan.reportlost.org`;
    const secondaryAlias = `item${publicId}@reportlost.org`;

    // choix de l’alias à encoder dans le mailto (paramètre aliasMode optionnel)
    const aliasToUse = aliasMode === "item" ? secondaryAlias : primaryAlias;

    if (!storedAlias) {
      storedAlias = aliasToUse;
      const { error: aliasErr } = await admin
        .from("lost_items")
        .update({ email_alias: storedAlias })
        .eq("id", id);
      if (aliasErr) {
        return json({ ok: false, error: "Cannot save email alias" }, 500);
      }
    }

    // 4) Construire l’URL mailto: (texte orienté pour la personne qui a trouvé l’objet)
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

    const mailtoUrl = `mailto:${aliasToUse}?subject=${subject}&body=${body}`;

    // 5) Générer le QR
    if (format === "png") {
      // PNG (DataURL)
      // @ts-ignore
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
    } else {
      // SVG (DataURL + svg brut)
      // @ts-ignore
      const svg = await QR.toString(mailtoUrl, {
        type: "svg",
        errorCorrectionLevel: "M",
        margin: 1,
      });
      const dataUrl = `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
      return json({
        ok: true,
        format: "svg",
        svg,
        dataUrl,
        scanUrl: mailtoUrl,
        fileName: `RL-${publicId}.svg`,
        alias: aliasToUse,
      });
    }
  } catch (e: any) {
    // Renvoie toujours du JSON (évite le “Unexpected end of JSON input” côté client)
    return json({ ok: false, error: String(e?.message || e) }, 500);
  }
}

// ——————————————————————————————
// POST → délègue à GET (utile si un proxy appelle en POST)
// ——————————————————————————————
export async function POST(req: NextRequest) {
  // Si un POST arrive, on tente de récupérer ?id=… depuis l’URL
  // ou depuis un JSON body { id, format, aliasMode }
  const url = new URL(req.url);
  const sp = url.searchParams;
  if (!sp.get("id")) {
    try {
      const { id, format, aliasMode } = await req.json();
      if (id) {
        if (format) sp.set("format", String(format));
        if (aliasMode) sp.set("aliasMode", String(aliasMode));
        sp.set("id", String(id));
      }
    } catch {
      // pas de body JSON → on laisse tel quel
    }
  }
  return GET(new NextRequest(url.toString(), { headers: req.headers }));
}

// ——————————————————————————————
// OPTIONS / HEAD pour être complet (évite d’autres 405)
// ——————————————————————————————
export function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET,POST,OPTIONS,HEAD",
      "Access-Control-Allow-Headers": "Content-Type, Authorization",
    },
  });
}

export function HEAD() {
  return new NextResponse(null, { status: 200 });
}
