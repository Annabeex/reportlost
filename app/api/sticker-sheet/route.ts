// app/api/sticker-sheet/route.ts
// PDF en 3 pages :
//   1. page de présentation — pourquoi étiqueter ses affaires, ce que coûte le
//      remplacement des objets courants (chiffres sourcés, voir COSTS), où coller
//      les stickers, et comment ça marche ;
//   2. la planche QR historique — design "piste B" validé ;
//   3. stickers « adresse seule », ronds / ovales / longs, sans QR : ils tiennent
//      sur une clé, un câble, une monture de lunettes, là où un QR ne passe pas.
//
// Planche A4 de stickers — design "piste B" validé : cartes blanches à coins
// arrondis, bandeau dégradé signature (#26723e → #2ea052), QR vert foncé.
// Les dégradés sont rendus en PNG haute résolution via sharp (SVG sans texte,
// donc aucun problème de police serverless) ; les textes restent en Helvetica
// native du PDF pour une netteté d'impression parfaite.
import { NextRequest, NextResponse } from "next/server";
import { PDFDocument, StandardFonts, rgb, PDFFont, degrees } from "pdf-lib";
const QRCode = require("qrcode");
import sharp from "sharp";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 30;

const mm = (n: number) => (n / 25.4) * 72;
const PAGE_W = mm(210);
const PAGE_H = mm(297);

const GREEN_DEEP = rgb(0.078, 0.325, 0.176); // #14532d
const GREEN = rgb(0.18, 0.627, 0.322); // #2EA052
const BORDER = rgb(0.843, 0.918, 0.867); // #d7eadd
const GRAY = rgb(0.36, 0.42, 0.376); // #5c6b60
const WHITE = rgb(1, 1, 1);

const PX = 12; // pixels par mm (~300 dpi)

// Bandeau dégradé en PNG (SVG sans texte → rendu sharp fiable partout)
async function gradientPng(wMm: number, hMm: number, corners: "top" | "all" | "left"): Promise<Buffer> {
  const w = Math.round(wMm * PX);
  const h = Math.round(hMm * PX);
  const r = Math.round(2.6 * PX);
  let path = "";
  if (corners === "all") {
    path = `M ${r} 0 H ${w - r} Q ${w} 0 ${w} ${r} V ${h - r} Q ${w} ${h} ${w - r} ${h} H ${r} Q 0 ${h} 0 ${h - r} V ${r} Q 0 0 ${r} 0 Z`;
  } else if (corners === "top") {
    path = `M ${r} 0 H ${w - r} Q ${w} 0 ${w} ${r} V ${h} H 0 V ${r} Q 0 0 ${r} 0 Z`;
  } else {
    path = `M ${r} 0 H ${w} V ${h} H ${r} Q 0 ${h} 0 ${h - r} V ${r} Q 0 0 ${r} 0 Z`;
  }
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}"><defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#26723e"/><stop offset="1" stop-color="#2ea052"/></linearGradient></defs><path d="${path}" fill="url(#g)"/></svg>`;
  return sharp(Buffer.from(svg)).png().toBuffer();
}

// Disque et ellipse en dégradé, même signature couleur que les bandeaux.
async function gradientCirclePng(dMm: number): Promise<Buffer> {
  const d = Math.round(dMm * PX);
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${d}" height="${d}" viewBox="0 0 ${d} ${d}"><defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#26723e"/><stop offset="1" stop-color="#2ea052"/></linearGradient></defs><circle cx="${d / 2}" cy="${d / 2}" r="${d / 2}" fill="url(#g)"/></svg>`;
  return sharp(Buffer.from(svg)).png().toBuffer();
}
async function gradientEllipsePng(wMm: number, hMm: number): Promise<Buffer> {
  const w = Math.round(wMm * PX);
  const h = Math.round(hMm * PX);
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}"><defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#26723e"/><stop offset="1" stop-color="#2ea052"/></linearGradient></defs><ellipse cx="${w / 2}" cy="${h / 2}" rx="${w / 2}" ry="${h / 2}" fill="url(#g)"/></svg>`;
  return sharp(Buffer.from(svg)).png().toBuffer();
}

// Contour arrondi (path pt, y vers le bas depuis le point d'ancrage)
function roundedRectPath(wPt: number, hPt: number, rPt: number): string {
  const w = wPt, h = hPt, r = rPt;
  return `M ${r} 0 H ${w - r} Q ${w} 0 ${w} ${r} V ${h - r} Q ${w} ${h} ${w - r} ${h} H ${r} Q 0 ${h} 0 ${h - r} V ${r} Q 0 0 ${r} 0 Z`;
}

export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const sb = getSupabaseAdmin();
    if (!sb) return NextResponse.json({ ok: false, error: "Supabase non configuré" }, { status: 500 });

    let public_id = url.searchParams.get("public_id");
    if (!public_id) {
      const id = url.searchParams.get("id");
      if (!id) return NextResponse.json({ ok: false, error: "Paramètre manquant: id ou public_id" }, { status: 400 });
      const { data, error } = await sb.from("lost_items").select("public_id").eq("id", id).maybeSingle();
      if (error || !data?.public_id) return NextResponse.json({ ok: false, error: "Report introuvable" }, { status: 404 });
      public_id = String(data.public_id);
    }
    if (!/^\d{5}$/.test(public_id)) {
      return NextResponse.json({ ok: false, error: "public_id invalide (5 chiffres requis)" }, { status: 400 });
    }

    const base =
      (process.env.NEXT_PUBLIC_SITE_URL || "").replace(/\/+$/, "") ||
      `${req.headers.get("x-forwarded-proto") || "https"}://${req.headers.get("x-forwarded-host") || req.headers.get("host")}`;
    // ⚠️ Le QR encode un mailto:, pas une URL de page.
    // Historique : la version d'origine de cette planche utilisait deja un
    // mailto. Lors de la refonte "piste B", le code de qr-sheet a ete recopie
    // ici et a apporte avec lui `${base}/message?case=...`, une page qui
    // n'existe pas : tous les QR generes entre-temps menaient a un 404.
    // Le mailto n'a besoin d'aucune page, fonctionne hors ligne cote serveur,
    // et ouvre directement la messagerie du trouveur sur la bonne adresse.
    //
    // Densite du code : chaque caractere ajoute au mailto densifie le QR, et un
    // QR trop dense sur un petit sticker use devient impossible a scanner.
    // Mesure (ECL M) : sujet seul = 37x37 modules ; sujet + corps ci-dessous =
    // 49x49 ; corps detaille facon formulaire = 85x85, injouable.
    // Repere : en dessous d'environ 0,40 mm par module, le scan devient fragile.
    // Avec 49x49, le plus petit QR de la planche (moyen, porte a 22 mm) donne
    // 0,45 mm. Ne pas rallonger ce corps sans regarder ce chiffre.
    // ⚠️ Adresse de relais : SEUL le format XXXXX@scan.reportlost.org est route.
    // Le webhook /api/inbound-email n'accepte que ce motif
    // (extractPublicId : /^([0-9]{5})@scan\.reportlost\.org$/), transmet le
    // message au proprietaire et permet la conversation dans les deux sens.
    // Un "item#####@reportlost.org" tombe dans la branche "alias non gere" :
    // le mail atterrit chez le support et n'atteint jamais le client.
    const relayEmail = `${public_id}@scan.reportlost.org`;
    const mailBody = ["Where I found it:", "When:", "How to reach me:"].join("\n");
    const scanUrl =
      `mailto:${relayEmail}` +
      `?subject=${encodeURIComponent(`I found your item (ID ${public_id})`)}` +
      `&body=${encodeURIComponent(mailBody)}`;

    // QR compact pour la page 3. Le QR de la page 2 encode un mailto avec sujet
    // ET corps pré-rempli : 49x49 modules, donc 19,6 mm minimum à 0,40 mm par
    // module. Ici on n'encode que "mailto:adresse" : 29x29 modules, soit 11,6 mm
    // minimum. C'est ce qui rend un QR possible sur un sticker de 40 mm.
    // Mesuré, pas estimé — ne pas rallonger cette charge utile sans re-mesurer.
    const scanUrlShort = `mailto:${relayEmail}`;

    // Assets image
    const [qrPng, qrSmallPng, bandHeader, bandSm, bandMd, bandLg, bandWide, discGreen, ovalGreen, stripGreen, stripThin] = await Promise.all([
      QRCode.toBuffer(scanUrl, { errorCorrectionLevel: "M", margin: 0, scale: 12, color: { dark: "#14532d", light: "#ffffff" } }) as Promise<Buffer>,
      QRCode.toBuffer(scanUrlShort, { errorCorrectionLevel: "M", margin: 0, scale: 16, color: { dark: "#14532d", light: "#ffffff" } }) as Promise<Buffer>,
      gradientPng(186, 18, "all"),
      gradientPng(42, 7.5, "top"),
      gradientPng(58, 6.5, "top"),
      gradientPng(90, 8.5, "top"),
      gradientPng(12, 30, "left"),
      gradientCirclePng(40),
      gradientEllipsePng(48, 22),
      gradientPng(90, 18, "all"),
      gradientPng(44, 5, "all"),
    ]);

    const pdf = await PDFDocument.create();

    // Les helpers de dessin étaient liés à la variable `page`. Avec trois pages,
    // ils deviennent une fabrique : on obtient un jeu de helpers par page, en
    // gardant exactement la même sémantique (coordonnées en mm, origine en haut).
    const helpersFor = (pg: any) => ({
      text: (t: string, leftMm: number, topMm: number, size: number, font: PDFFont, color = GREEN_DEEP) =>
        pg.drawText(t, { x: mm(leftMm), y: PAGE_H - mm(topMm) - size, size, font, color }),
      textCenter: (t: string, centerMm: number, topMm: number, size: number, font: PDFFont, color = GREEN_DEEP) => {
        const w = font.widthOfTextAtSize(t, size);
        pg.drawText(t, { x: mm(centerMm) - w / 2, y: PAGE_H - mm(topMm) - size, size, font, color });
      },
      textRight: (t: string, rightMm: number, topMm: number, size: number, font: PDFFont, color = GREEN_DEEP) => {
        const w = font.widthOfTextAtSize(t, size);
        pg.drawText(t, { x: mm(rightMm) - w, y: PAGE_H - mm(topMm) - size, size, font, color });
      },
      img: (im: any, leftMm: number, topMm: number, wMm: number, hMm: number) =>
        pg.drawImage(im, { x: mm(leftMm), y: PAGE_H - mm(topMm) - mm(hMm), width: mm(wMm), height: mm(hMm) }),
      card: (leftMm: number, topMm: number, wMm: number, hMm: number, fill = WHITE, stroke = BORDER) =>
        pg.drawSvgPath(roundedRectPath(mm(wMm), mm(hMm), mm(2.6)), {
          x: mm(leftMm),
          y: PAGE_H - mm(topMm),
          color: fill,
          borderColor: stroke,
          borderWidth: 1,
        }),
      circle: (cxMm: number, cyMm: number, rMm: number, fill = WHITE, stroke = BORDER) =>
        pg.drawCircle({
          x: mm(cxMm),
          y: PAGE_H - mm(cyMm),
          size: mm(rMm),
          color: fill,
          borderColor: stroke,
          borderWidth: 1,
        }),
      ellipse: (cxMm: number, cyMm: number, rxMm: number, ryMm: number, fill = WHITE, stroke = BORDER) =>
        pg.drawEllipse({
          x: mm(cxMm),
          y: PAGE_H - mm(cyMm),
          xScale: mm(rxMm),
          yScale: mm(ryMm),
          color: fill,
          borderColor: stroke,
          borderWidth: 1,
        }),
      /** Texte centré horizontalement, baseline calée sur un centre vertical. */
      centerOn: (t: string, cxMm: number, cyMm: number, size: number, font: PDFFont, color = GREEN_DEEP) => {
        const w = font.widthOfTextAtSize(t, size);
        pg.drawText(t, { x: mm(cxMm) - w / 2, y: PAGE_H - mm(cyMm) - size * 0.36, size, font, color });
      },
    });

    const cover = pdf.addPage([PAGE_W, PAGE_H]); // page 1 : présentation
    const page = pdf.addPage([PAGE_W, PAGE_H]); // page 2 : planche QR
    const emailPage = pdf.addPage([PAGE_W, PAGE_H]); // page 3 : adresse seule
    const qr = await pdf.embedPng(qrPng);
    const gHeader = await pdf.embedPng(bandHeader);
    const gSm = await pdf.embedPng(bandSm);
    const gMd = await pdf.embedPng(bandMd);
    const gLg = await pdf.embedPng(bandLg);
    const gWide = await pdf.embedPng(bandWide);
    const qrS = await pdf.embedPng(qrSmallPng);
    const gDisc = await pdf.embedPng(discGreen);
    const gOval = await pdf.embedPng(ovalGreen);
    const gStrip = await pdf.embedPng(stripGreen);
    const gThin = await pdf.embedPng(stripThin);
    const helv = await pdf.embedFont(StandardFonts.Helvetica);
    const helvB = await pdf.embedFont(StandardFonts.HelveticaBold);
    const helvO = await pdf.embedFont(StandardFonts.HelveticaOblique);

    const { text, textCenter, img, card } = helpersFor(page);

    // ---- En-tête ----
    img(gHeader, 12, 12, 186, 18);
    text("ReportLost", 18, 17, 16, helvB, WHITE);
    {
      const t = `Secure ID stickers  ·  Case #${public_id}`;
      const w = helv.widthOfTextAtSize(t, 9.5);
      page.drawText(t, { x: mm(192) - w, y: PAGE_H - mm(19.5) - 9.5, size: 9.5, font: helv, color: WHITE });
    }
    text("Stick them on the items you carry every day. A finder scans the code and reaches you through", 12, 33.5, 7.5, helv, GRAY);
    text("your protected ReportLost address. Your personal details stay private.", 12, 37.3, 7.5, helv, GRAY);

    // ---- 4 petits (clés, gourde) ----
    const drawSmall = (left: number, top: number) => {
      const w = 42, h = 40;
      card(left, top, w, h);
      img(gSm, left, top, w, 7.5);
      textCenter("SCAN ME", left + w / 2, top + 2.4, 6.5, helvB, WHITE);
      img(qr, left + (w - 22) / 2, top + 10.5, 22, 22);
      textCenter("reportlost.org", left + w / 2, top + h - 5, 5.8, helv, GRAY);
    };
    [0, 1, 2, 3].forEach((i) => drawSmall(12 + i * 48, 43));

    // ---- 3 moyens (téléphone, ordinateur) ----
    const drawMedium = (left: number, top: number) => {
      const w = 58, h = 32;
      card(left, top, w, h);
      img(gMd, left, top, w, 6.5);
      textCenter("IF FOUND, PLEASE SCAN", left + w / 2, top + 2, 5.8, helvB, WHITE);
      // QR porte de 19 a 22 mm : avec le corps de message pre-rempli, 19 mm
      // donnait 0,39 mm par module, sous le seuil de scan fiable.
      img(qr, left + 3, top + 8, 22, 22);
      text("This item is protected", left + 28, top + 14, 6.5, helvB, GREEN_DEEP);
      text("reportlost.org", left + 28, top + 20.5, 6.4, helvB, GREEN);
    };
    [0, 1, 2].forEach((i) => drawMedium(12 + i * 64, 89));

    // ---- 4 grands (bagage, sac) ----
    const drawLarge = (left: number, top: number) => {
      const w = 90, h = 52;
      card(left, top, w, h);
      img(gLg, left, top, w, 8.5);
      textCenter("IF FOUND, PLEASE SCAN", left + w / 2, top + 2.7, 7, helvB, WHITE);
      img(qr, left + 5, top + 13.5, 28, 28);
      text("This item is under", left + 38, top + 16, 8, helvB, GREEN_DEEP);
      text("ReportLost protection", left + 38, top + 20.5, 8, helvB, GREEN_DEEP);
      text(relayEmail, left + 38, top + 27, 6.6, helv, GRAY);
      text("Thank you for your honesty.", left + 38, top + 32.5, 6.2, helvO, GRAY);
      text("reportlost.org", left + 38, top + 38.5, 6.4, helvB, GREEN);
    };
    drawLarge(12, 127);
    drawLarge(108, 127);
    drawLarge(12, 185);
    drawLarge(108, 185);

    // ---- Bandeau large (valise, vélo) ----
    {
      const left = 12, top = 243, w = 186, h = 30;
      card(left, top, w, h);
      img(gWide, left, top, 12, h);
      page.drawText("IF FOUND", {
        x: mm(left + 7.8),
        y: PAGE_H - mm(top + h - 6),
        size: 7,
        font: helvB,
        color: WHITE,
        rotate: degrees(90),
      });
      img(qr, left + 17, top + 4, 22, 22);
      text("Please scan the code", left + 44, top + 8, 13, helvB, GREEN_DEEP);
      text(`or email ${relayEmail}   ·   reportlost.org`, left + 44, top + 17.5, 8, helv, GRAY);
    }

    // ---- Pied de page ----
    textCenter("Print on adhesive A4 paper and cut along the rounded borders  ·  reportlost.org", 105, 281, 7, helv, GRAY);


    // =====================================================================
    // PAGE 1 — Présentation
    // Chiffres vérifiés en septembre 2026, sources en pied de page. Ce sont des
    // ordres de grandeur affichés comme tels : aucun n'est présenté comme un
    // devis, et aucun n'est inventé.
    // =====================================================================
    {
      const C = helpersFor(cover);
      const GREEN_TINT = rgb(0.937, 0.98, 0.949); // #eff9f2

      C.img(gHeader, 12, 12, 186, 18);
      C.text("ReportLost", 18, 17, 16, helvB, WHITE);
      C.textRight(`Prevention kit  ·  Case #${public_id}`, 192, 19.5, 9.5, helv, WHITE);

      C.text("Label what you carry.", 12, 38, 26, helvB, GREEN_DEEP);
      C.text(
        "A sticker costs a few cents. Replacing what it is stuck on rarely does.",
        12, 52, 10.5, helv, GRAY
      );
      C.text(
        "Each code and address below belongs to your case alone, so a finder can reach you",
        12, 59, 9, helv, GRAY
      );
      C.text(
        "without ever seeing your email address or your phone number.",
        12, 64.5, 9, helv, GRAY
      );

      // --- Quatre ordres de grandeur ---
      const costCard = (
        left: number,
        top: number,
        amount: string,
        title: string,
        line1: string,
        line2: string
      ) => {
        const w = 90, h = 38;
        C.card(left, top, w, h, GREEN_TINT, BORDER);
        C.text(amount, left + 7, top + 6, 23, helvB, GREEN_DEEP);
        C.text(title, left + 7, top + 19, 9, helvB, GREEN_DEEP);
        C.text(line1, left + 7, top + 25, 7.6, helv, GRAY);
        if (line2) C.text(line2, left + 7, top + 30, 7.6, helv, GRAY);
      };

      costCard(12, 76, "$165", "Replacing a lost US passport",
        "Application fee $130 plus the $35 acceptance fee,", "and a trip to a passport facility in person.");
      costCard(108, 76, "$400-900", "A smart car key, at the dealer",
        "A transponder key runs $230 to $450. A locksmith", "is usually 30 to 50 percent cheaper than a dealer.");
      costCard(12, 120, "$1,299", "What a flagship phone costs new",
        "iPhone 18 Pro Max, 256 GB, list price. Most of the", "loss is the data and the hours, not the hardware.");
      costCard(108, 120, "$50-300", "Rekeying a home after losing keys",
        "Per visit, depending on how many locks and", "whether it is an emergency call-out.");

      // --- Où les coller ---
      C.text("Where to stick them", 12, 168, 13, helvB, GREEN_DEEP);
      C.text("One sticker per item. The ones you would hate to lose, and the ones that walk away on their own.", 12, 177, 8, helv, GRAY);

      const items = [
        ["Keys and key fobs", "Wallet and card holder", "Phone case", "Laptop and tablet", "Headphone case", "Camera and lenses", "Water bottle", "Backpack and gym bag"],
        ["Suitcase and cabin bag", "Passport holder", "Glasses case", "Chargers and cables", "Umbrella", "Notebook and planner", "Lunchbox", "Kids' school bag"],
        ["Bike frame and helmet", "Stroller", "Tool case", "Instrument case", "Sports gear", "Pet carrier", "Cooler and beach bag", "Anything you lend out"],
      ];
      items.forEach((col, ci) => {
        col.forEach((it, ri) => {
          const x = 12 + ci * 62;
          const y = 186 + ri * 6.2;
          cover.drawCircle({ x: mm(x + 1.1), y: PAGE_H - mm(y + 1.6), size: mm(0.9), color: GREEN });
          C.text(it, x + 4, y, 8, helv, GREEN_DEEP);
        });
      });

      // --- Comment ça marche ---
      C.text("How it works", 12, 240, 13, helvB, GREEN_DEEP);
      const step = (left: number, n: string, title: string, l1: string, l2: string) => {
        const w = 58, h = 28;
        C.card(left, 249, w, h);
        cover.drawCircle({ x: mm(left + 7), y: PAGE_H - mm(255.5), size: mm(3.4), color: GREEN });
        C.centerOn(n, left + 7, 255.5, 8, helvB, WHITE);
        C.text(title, left + 13, 252.5, 9, helvB, GREEN_DEEP);
        C.text(l1, left + 5, 261, 7.4, helv, GRAY);
        C.text(l2, left + 5, 265.6, 7.4, helv, GRAY);
      };
      // ⚠️ La planche est en A4 alors que la clientèle est américaine : sur une
      // imprimante réglée en Letter, il faut « Fit to page ». À trancher un jour.
      step(12, "1", "Print", "Adhesive paper, A4 or letter with", "\"fit to page\". Cut along the borders.");
      step(76, "2", "Stick", "Pages 2 and 3 carry the same case.", "Use whichever shape fits the item.");
      step(140, "3", "Get it back", "A finder scans or writes to your", "private address. It reaches you.");

      C.textCenter(
        "Figures checked September 2026: U.S. Department of State (passport), Apple (iPhone list price), 2026 US locksmith price surveys (keys, rekeying).",
        105, 282, 6.4, helv, GRAY
      );
      C.textCenter(
        "Indicative ranges, not quotes. Your own costs will differ.",
        105, 287.5, 6.4, helvO, GRAY
      );
    }

    // =====================================================================
    // PAGE 3 — Stickers « adresse seule », avec QR compact
    //
    // Deux contraintes mesurées commandent toute la page :
    //  - l'adresse ne doit JAMAIS être coupée : à 5,5 pt elle fait 23,5 mm de
    //    large, à 6 pt 25,6 mm. Aucun sticker n'est plus étroit que ça ;
    //  - le QR compact fait 29x29 modules, donc 11,6 mm au minimum. On le pose
    //    à 13 mm, soit 0,45 mm par module, la même marge que la page 2.
    // =====================================================================
    {
      const E = helpersFor(emailPage);

      E.img(gHeader, 12, 12, 186, 18);
      E.text("ReportLost", 18, 17, 16, helvB, WHITE);
      E.textRight(`Address stickers  ·  Case #${public_id}`, 192, 19.5, 9.5, helv, WHITE);

      E.text("Small formats for what a code cannot fit on: keys, cables, glasses, a bike frame.", 12, 33.5, 7.5, helv, GRAY);
      E.text(`Scan the code or write to ${relayEmail} — it reaches you directly.`, 12, 37.3, 7.5, helv, GRAY);

      const label = (t: string, topMm: number) => E.text(t, 12, topMm, 7, helvB, GREEN);

      // Respiration : 8 mm avant chaque intitulé, et 3,5 mm entre le bas du
      // texte de l'intitulé et le haut des stickers. Un intitulé de 7 pt occupe
      // environ 2,5 mm sous son point d'ancrage : sans cette marge, le titre
      // touchait le premier rond.

      // ---- A · Ronds 40 mm, fond vert, avec QR -------------------------
      label("Round  ·  40 mm  ·  bottle, laptop, helmet", 42);
      for (let i = 0; i < 4; i++) {
        const cx = 32 + i * 46;
        const cy = 68;
        E.img(gDisc, cx - 20, cy - 20, 40, 40);
        // Carte blanche derrière le QR : un QR sans marge claire ne scanne pas.
        emailPage.drawSvgPath(roundedRectPath(mm(16), mm(16), mm(1.6)), {
          x: mm(cx - 8),
          y: PAGE_H - mm(cy - 13.5),
          color: WHITE,
        });
        E.img(qrS, cx - 6.5, cy - 12, 13, 13);
        E.centerOn(relayEmail, cx, cy + 7.5, 6, helv, WHITE);
        E.centerOn("IF FOUND, SCAN OR EMAIL", cx, cy + 12.5, 4.6, helvB, WHITE);
        E.centerOn("reportlost.org", cx, cy + 16.5, 4.4, helv, WHITE);
      }

      // ---- B · Ronds 28 mm, contour vert ------------------------------
      label("Round  ·  28 mm  ·  keys, chargers, remotes", 96);
      for (let i = 0; i < 6; i++) {
        const cx = 26 + i * 31;
        const cy = 116;
        E.circle(cx, cy, 14, WHITE, GREEN);
        E.centerOn("IF FOUND, EMAIL", cx, cy - 4.5, 4.8, helvB, GREEN);
        E.centerOn(relayEmail, cx, cy + 1.5, 5.5, helv, GREEN_DEEP);
        E.centerOn("reportlost.org", cx, cy + 7.5, 4.8, helv, GRAY);
      }

      // ---- C · Bandes 90 x 18, fond vert, avec QR ---------------------
      label("Strip  ·  90 x 18 mm  ·  laptop edge, bike frame, luggage", 138);
      for (let r = 0; r < 2; r++) {
        for (let i = 0; i < 2; i++) {
          const left = 12 + i * 96;
          const top = 144 + r * 22;
          E.img(gStrip, left, top, 90, 18);
          emailPage.drawSvgPath(roundedRectPath(mm(15), mm(15), mm(1.5)), {
            x: mm(left + 2),
            y: PAGE_H - mm(top + 1.5),
            color: WHITE,
          });
          E.img(qrS, left + 3, top + 2.5, 13, 13);
          E.text("IF FOUND, SCAN OR EMAIL", left + 21, top + 3.5, 5.4, helvB, WHITE);
          E.text(relayEmail, left + 21, top + 8.5, 6.5, helv, WHITE);
        }
      }

      // ---- D · Bandes 60 x 12, contour vert ---------------------------
      label("Strip  ·  60 x 12 mm  ·  tools, bottles, cases", 192);
      for (let r = 0; r < 2; r++) {
        for (let i = 0; i < 3; i++) {
          const left = 12 + i * 62;
          const top = 198 + r * 14;
          E.card(left, top, 60, 12, WHITE, GREEN);
          E.centerOn("IF FOUND, EMAIL", left + 30, top + 4, 4.6, helvB, GREEN);
          E.centerOn(relayEmail, left + 30, top + 8.4, 5.5, helv, GREEN_DEEP);
        }
      }

      // ---- E · Bandes ultra-fines 44 x 5 -------------------------------
      // 5 mm de haut : ça se glisse à l'intérieur d'une branche de lunettes,
      // le long d'un stylo ou autour d'un câble. Adresse seule, rien d'autre —
      // à 4,6 pt elle fait 19,6 mm, il reste donc de la marge sur 44 mm.
      label("Ultra-thin  ·  44 x 5 mm  ·  inside a glasses arm, a pen, a cable", 232);
      for (let r = 0; r < 6; r++) {
        for (let i = 0; i < 4; i++) {
          const left = 12 + i * 47.5;
          const top = 238 + r * 6.5;
          E.img(gThin, left, top, 44, 5);
          E.centerOn(relayEmail, left + 22, top + 2.6, 4.6, helvB, WHITE);
        }
      }

      E.textCenter(
        "Cut along the outlines. The address is never split across two lines, so it stays readable even on the smallest sticker.",
        105, 282, 6.4, helv, GRAY
      );
    }

    const bytes = await pdf.save();
    return new NextResponse(Buffer.from(bytes), {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `inline; filename="stickers_${public_id}.pdf"`,
        "Cache-Control": "no-store",
      },
    });
  } catch (e: any) {
    console.error("[sticker-sheet]", e);
    return NextResponse.json({ ok: false, error: String(e?.message || e) }, { status: 500 });
  }
}
