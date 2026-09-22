// lib/orgPosterPdf.ts
//
// Le kit d'affichage d'un établissement, en un seul PDF de deux pages :
//
//   page 1 — une affiche pleine page ;
//   page 2 — une demi-affiche (moitié haute) et quatre cartes à découper
//            (moitié basse), pour un comptoir, une vitre, un tableau de liège.
//
// Partout, les DEUX QR codes côte à côte : « Lost something? » ouvre la page de
// l'établissement (objets détenus + déclaration de perte qui lui est adressée),
// « Found something? » le formulaire de dépôt. Ils sont
// de deux couleurs différentes, parce que se tromper de code est l'erreur la
// plus probable devant une affiche qui en porte deux.
//
// Format Letter par défaut (les établissements sont américains), A4 sur
// demande. Toute la mise en page est calculée depuis la taille de la feuille.

import { PDFDocument, StandardFonts, rgb, type PDFFont, type PDFImage, type PDFPage, type RGB } from "pdf-lib";
import sharp from "sharp";
// eslint-disable-next-line @typescript-eslint/no-var-requires
const QRCode = require("qrcode");

export type PosterPaper = "letter" | "a4";
export type PosterOrg = {
  slug: string;
  name: string;
  city?: string | null;
  state_id?: string | null;
  /** Chemin de la page publique : /campus/<slug> ou /org/<slug> (publicPath). */
  path: string;
  /** Code court de l'établissement : les QR codes encodent reportlost.org/q/<code>
   *  et /f/<code>, qui redirigent vers la page. Une adresse de 30 caractères
   *  donne un QR code de 29 modules au lieu de 41 : plus aéré, et lisible en
   *  format carte. Absent → on encode l'adresse longue. */
  shortCode?: string | null;
  /** true si la liste publique est réellement consultable. */
  publicPage?: boolean;
};

const mm = (n: number) => (n / 25.4) * 72;
const PAPER: Record<PosterPaper, [number, number]> = { letter: [215.9, 279.4], a4: [210, 297] };
// Carte de visite : 3,5 × 2 pouces aux États-Unis, 85 × 55 mm ailleurs.
const CARD: Record<PosterPaper, [number, number]> = { letter: [88.9, 50.8], a4: [85, 55] };

const GREEN = rgb(0.078, 0.325, 0.176); // #14532d
const BLUE = rgb(0.118, 0.227, 0.541); // #1e3a8a
const BORDER = rgb(0.84, 0.87, 0.9);
const GRAY = rgb(0.36, 0.4, 0.44);
const LIGHT = rgb(0.62, 0.66, 0.7);
const WHITE = rgb(1, 1, 1);

const GRAD = {
  green: ["#26723e", "#2ea052"],
  blue: ["#1e3a8a", "#2f5fd0"],
} as const;
type Tone = keyof typeof GRAD;
const INK: Record<Tone, RGB> = { green: GREEN, blue: BLUE };
const QR_DARK: Record<Tone, string> = { green: "#14532d", blue: "#1e3a8a" };

const PX = 12; // pixels par millimètre des bandeaux en dégradé

/** Bandeau en dégradé. `round` : "all" | "top" (haut arrondi, bas droit). */
async function gradientPng(wMm: number, hMm: number, tone: Tone, round: "all" | "top", rMm = 2.6): Promise<Buffer> {
  const w = Math.round(wMm * PX);
  const h = Math.round(hMm * PX);
  const r = Math.round(rMm * PX);
  const path =
    round === "all"
      ? `M ${r} 0 H ${w - r} Q ${w} 0 ${w} ${r} V ${h - r} Q ${w} ${h} ${w - r} ${h} H ${r} Q 0 ${h} 0 ${h - r} V ${r} Q 0 0 ${r} 0 Z`
      : `M ${r} 0 H ${w - r} Q ${w} 0 ${w} ${r} V ${h} H 0 V ${r} Q 0 0 ${r} 0 Z`;
  const [a, b] = GRAD[tone];
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}"><defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="${a}"/><stop offset="1" stop-color="${b}"/></linearGradient></defs><path d="${path}" fill="url(#g)"/></svg>`;
  return sharp(Buffer.from(svg)).png().toBuffer();
}

/* ------------------------------------------------------------------ */
/* QR code dessiné : points ronds, yeux arrondis, repère au centre      */
/* ------------------------------------------------------------------ */
//
// Le QR code brut (carrés noirs collés) est ce qui enlaidit une affiche. On
// garde exactement la même matrice, mais on la dessine : chaque module devient
// un point, les trois yeux de repérage des anneaux adoucis à cœur rond, et le
// centre porte l'épingle ReportLost. La correction d'erreur passe à Q (25 %)
// pour absorber le centre masqué.
//
// ⚠️ Chaque valeur ci-dessous a été mesurée avec un décodeur (OpenCV), du
// format affiche au format carte. Ce qui coûte de la lisibilité, c'est
// l'arrondi EXTÉRIEUR des yeux : au-delà de 0,6 module le code ne se lit plus
// en petit. Points ronds et cœur rond, eux, ne coûtent rien. Ne pas « arrondir
// un peu plus » sans refaire la mesure.
function qrSvg(url: string, tone: Tone): string {
  const qr = QRCode.create(url, { errorCorrectionLevel: "Q" });
  const n: number = qr.modules.size;
  const data: Uint8Array = qr.modules.data;
  const dark = QR_DARK[tone];
  const [g1, g2] = GRAD[tone];

  const inEye = (x: number, y: number) =>
    (x < 7 && y < 7) || (x >= n - 7 && y < 7) || (x < 7 && y >= n - 7);
  // Centre réservé au repère : 7 modules si le code est assez grand, sinon 5.
  const k = n >= 29 ? 7 : 5;
  const c0 = (n - k) / 2;
  const inLogo = (x: number, y: number) => x >= c0 && x < c0 + k && y >= c0 && y < c0 + k;

  let dots = "";
  for (let y = 0; y < n; y++) {
    for (let x = 0; x < n; x++) {
      if (!data[y * n + x] || inEye(x, y) || inLogo(x, y)) continue;
      dots += `<circle cx="${x + 0.5}" cy="${y + 0.5}" r="0.5"/>`;
    }
  }

  const eye = (x: number, y: number) =>
    `<rect x="${x + 0.5}" y="${y + 0.5}" width="6" height="6" rx="0.6" fill="none" stroke="${dark}" stroke-width="1"/>` +
    `<circle cx="${x + 3.5}" cy="${y + 3.5}" r="1.5" fill="${dark}"/>`;

  // Repère central : pastille en dégradé + épingle blanche (même dessin que
  // l'icône du portail), avec un module de blanc tout autour.
  const lx = c0 + 0.6, ls = k - 1.2, cx = n / 2, cy = n / 2 - ls * 0.08, r = ls * 0.2;
  const tip = cy + ls * 0.4;
  const ang = Math.asin(r / (tip - cy));
  const tx = r * Math.cos(ang), ty = r * Math.sin(ang);
  const logo =
    `<rect x="${lx}" y="${lx}" width="${ls}" height="${ls}" rx="${ls * 0.24}" fill="url(#lg)"/>` +
    `<circle cx="${cx}" cy="${cy}" r="${r}" fill="#fff"/>` +
    `<path d="M ${cx - tx} ${cy + ty} L ${cx + tx} ${cy + ty} L ${cx} ${tip} Z" fill="#fff"/>` +
    `<circle cx="${cx}" cy="${cy}" r="${r * 0.45}" fill="${g1}"/>`;

  const px = 40; // pixels par module : net même sur l'affiche pleine page
  return (
    `<svg xmlns="http://www.w3.org/2000/svg" width="${n * px}" height="${n * px}" viewBox="0 0 ${n} ${n}">` +
    `<defs><linearGradient id="lg" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${g1}"/><stop offset="1" stop-color="${g2}"/></linearGradient></defs>` +
    `<rect width="${n}" height="${n}" fill="#fff"/>` +
    `<g fill="${dark}">${dots}</g>` +
    eye(0, 0) + eye(n - 7, 0) + eye(0, n - 7) +
    logo +
    `</svg>`
  );
}

function roundedRectPath(wPt: number, hPt: number, rPt: number): string {
  const w = wPt, h = hPt, r = rPt;
  return `M ${r} 0 H ${w - r} Q ${w} 0 ${w} ${r} V ${h - r} Q ${w} ${h} ${w - r} ${h} H ${r} Q 0 ${h} 0 ${h - r} V ${r} Q 0 0 ${r} 0 Z`;
}

/** Les polices standard d'un PDF ne connaissent que WinAnsi : un nom
 *  d'établissement avec un caractère hors table ferait échouer tout le PDF. */
function safeText(font: PDFFont, s: string): string {
  const ok = new Set(font.getCharacterSet());
  return Array.from(String(s || "").normalize("NFC"))
    .map((ch) => (ok.has(ch.codePointAt(0)!) ? ch : ch.normalize("NFKD").replace(/[^\x20-\x7e]/g, "")))
    .join("")
    .replace(/\s+/g, " ")
    .trim();
}

function fit(font: PDFFont, text: string, size: number, maxPt: number): string {
  if (font.widthOfTextAtSize(text, size) <= maxPt) return text;
  let t = text;
  while (t.length > 1 && font.widthOfTextAtSize(`${t}...`, size) > maxPt) t = t.slice(0, -1);
  return `${t.trimEnd()}...`;
}

function wrap(font: PDFFont, text: string, size: number, maxPt: number): string[] {
  const lines: string[] = [];
  let cur = "";
  for (const word of text.split(/\s+/)) {
    const next = cur ? `${cur} ${word}` : word;
    if (cur && font.widthOfTextAtSize(next, size) > maxPt) { lines.push(cur); cur = word; }
    else cur = next;
  }
  if (cur) lines.push(cur);
  return lines;
}

/** Petite boîte à outils en millimètres, origine en HAUT à gauche. */
function tools(page: PDFPage) {
  const H = page.getHeight();
  return {
    image(im: PDFImage, x: number, y: number, w: number, h: number) {
      page.drawImage(im, { x: mm(x), y: H - mm(y) - mm(h), width: mm(w), height: mm(h) });
    },
    /** Texte centré sur cx ; `top` = haut de la ligne, en mm. */
    center(t: string, cx: number, top: number, size: number, font: PDFFont, color: RGB) {
      const w = font.widthOfTextAtSize(t, size);
      page.drawText(t, { x: mm(cx) - w / 2, y: H - mm(top) - size * 0.78, size, font, color });
    },
    box(x: number, y: number, w: number, h: number, r: number, border: RGB, width = 1.2) {
      page.drawSvgPath(roundedRectPath(mm(w), mm(h), mm(r)), {
        x: mm(x), y: H - mm(y), color: WHITE, borderColor: border, borderWidth: width,
      });
    },
    dashed(x1: number, y: number, x2: number) {
      page.drawLine({
        start: { x: mm(x1), y: H - mm(y) }, end: { x: mm(x2), y: H - mm(y) },
        thickness: 0.6, color: LIGHT, dashArray: [4, 3],
      });
    },
  };
}

const ptToMm = (pt: number) => (pt / 72) * 25.4;

export async function buildPosterPdf(org: PosterOrg, base: string, paper: PosterPaper = "letter"): Promise<Uint8Array> {
  const [W, H] = PAPER[paper];
  const site = base.replace(/\/+$/, "");
  const host = site.replace(/^https?:\/\//, "");
  // « Lost something? » ouvre la page de l'établissement : la liste des objets
  // qu'il détient, puis, si l'objet n'y est pas, la déclaration de perte qui
  // lui est adressée.
  const code = String(org.shortCode || "").trim().toLowerCase();
  const lostUrl = code ? `${site}/q/${code}` : `${site}${org.path}`;
  const foundUrl = code ? `${site}/f/${code}` : `${site}${org.path}/found`;

  const qrPng = (url: string, tone: Tone): Promise<Buffer> =>
    sharp(Buffer.from(qrSvg(url, tone))).png().toBuffer();

  const pdf = await PDFDocument.create();
  pdf.setTitle(`Lost & Found display kit - ${org.name}`);
  const helv = await pdf.embedFont(StandardFonts.Helvetica);
  const bold = await pdf.embedFont(StandardFonts.HelveticaBold);

  const name = safeText(bold, org.name);
  const place = safeText(helv, [org.city, org.state_id].filter(Boolean).join(", "));

  const SIDES = [
    {
      tone: "green" as Tone, title: "Lost something?",
      cta: org.publicPage ? "Scan to see what was found" : "Scan to report it",
      sub: org.publicPage
        ? "See the items held here. If yours is not listed, report it to the office on the same page."
        : `Report what you lost. Your report is compared with the items handed in at ${name}.`,
      url: lostUrl,
    },
    { tone: "blue" as Tone, title: "Found something?", cta: "Scan to hand it in", sub: "Describe the item, then bring it to the front desk with the code you receive.", url: foundUrl },
  ];
  const qr = await Promise.all(SIDES.map(async (s) => pdf.embedPng(await qrPng(s.url, s.tone))));
  // L'adresse en toutes lettres sous chaque code, très discrète : pour qui n'a
  // pas d'appareil photo sous la main, ou lit l'affiche sur un écran.
  const shortUrl = (u: string) => u.replace(/^https?:\/\//, "");

  const embedBand = async (w: number, h: number, tone: Tone, round: "all" | "top", r?: number) =>
    pdf.embedPng(await gradientPng(w, h, tone, round, r));

  /** Un bloc « titre en bandeau + QR + consigne », identique aux trois tailles. */
  async function block(
    page: PDFPage, i: number, x: number, y: number, w: number, h: number,
    o: { band: number; title: number; qr: number; gap: number; cta: number; sub: number; subLines: number }
  ) {
    const t = tools(page);
    const s = SIDES[i];
    t.box(x, y, w, h, 3, BORDER);
    t.image(await embedBand(w, o.band, s.tone, "top", 3), x, y, w, o.band);
    t.center(s.title, x + w / 2, y + (o.band - ptToMm(o.title) * 0.72) / 2, o.title, bold, WHITE);

    const qy = y + o.band + o.gap;
    t.image(qr[i], x + (w - o.qr) / 2, qy, o.qr, o.qr);
    t.center(shortUrl(s.url), x + w / 2, qy + o.qr + 1.2, o.sub * 0.8, helv, LIGHT);

    let ty = qy + o.qr + o.gap * 0.8 + ptToMm(o.sub * 0.8);
    t.center(s.cta, x + w / 2, ty, o.cta, bold, INK[s.tone]);
    ty += ptToMm(o.cta) + 1.6;
    if (o.subLines > 0) {
      for (const line of wrap(helv, s.sub, o.sub, mm(w - 10)).slice(0, o.subLines)) {
        t.center(line, x + w / 2, ty, o.sub, helv, GRAY);
        ty += ptToMm(o.sub) * 1.25;
      }
    }
  }

  const footer = org.publicPage
    ? `Items currently held here: ${host}${org.path}`
    : host;

  // ── Page 1 : affiche pleine page ─────────────────────────────────────────
  {
    const page = pdf.addPage([mm(W), mm(H)]);
    const t = tools(page);
    const M = 12;
    t.image(await embedBand(W - 2 * M, 26, "green", "all"), M, M, W - 2 * M, 26);
    t.center("LOST & FOUND", W / 2, M + 8.2, 30, bold, WHITE);
    t.center(fit(bold, name, 17, mm(W - 2 * M)), W / 2, 45, 17, bold, GREEN);
    if (place) t.center(place, W / 2, 53, 11, helv, GRAY);

    const gap = 8;
    const bw = (W - 2 * M - gap) / 2;
    const qrSize = bw - 18;
    // Hauteur du bloc = son contenu ; l'espace restant est réparti au-dessus et
    // en dessous, pour que l'affiche reste équilibrée en Letter comme en A4.
    const bh = 20 + 9 + qrSize + 7.2 + ptToMm(15) + 1.6 + 3 * ptToMm(10.5) * 1.25 + 7;
    const slack = Math.max(0, H - M - 14 - 58 - bh - 30);
    const by = 58 + slack * 0.4;
    for (let i = 0; i < 2; i++) {
      await block(page, i, M + i * (bw + gap), by, bw, bh, { band: 20, title: 20, qr: qrSize, gap: 9, cta: 15, sub: 10.5, subLines: 3 });
    }

    t.center("Point your phone camera at a code. No app to install.", W / 2, by + bh + 10, 12, helv, GREEN);
    t.center(`Items are returned once ${fit(helv, name, 11, mm(90))} has checked ownership.`, W / 2, by + bh + 17.5, 11, helv, GRAY);

    t.image(await embedBand(W - 2 * M, 14, "green", "all"), M, H - M - 14, W - 2 * M, 14);
    t.center(fit(helv, footer, 10.5, mm(W - 2 * M - 10)), W / 2, H - M - 14 + 5, 10.5, helv, WHITE);
  }

  // ── Page 2 : demi-affiche + cartes à découper ────────────────────────────
  {
    const page = pdf.addPage([mm(W), mm(H)]);
    const t = tools(page);
    const half = H / 2;

    // Demi-affiche (moitié haute)
    const M = 10;
    t.image(await embedBand(W - 2 * M, 16, "green", "all"), M, M, W - 2 * M, 16);
    t.center("LOST & FOUND", W / 2, M + 4.6, 20, bold, WHITE);
    t.center(fit(bold, place ? `${name} · ${place}` : name, 12, mm(W - 2 * M)), W / 2, 30, 12, bold, GREEN);

    const gap = 8;
    const bw = (W - 2 * M - gap) / 2;
    const by = 38;
    const bh = half - by - 8;
    const qrSize = Math.min(54, bh - 38);
    for (let i = 0; i < 2; i++) {
      await block(page, i, M + i * (bw + gap), by, bw, bh, { band: 12, title: 13, qr: qrSize, gap: 5, cta: 11.5, sub: 8.5, subLines: 2 });
    }

    // Trait de coupe
    t.dashed(0, half, W);
    t.center("cut here", W / 2, half + 1.2, 6.5, helv, LIGHT);

    // Cartes (moitié basse) : 2 × 2, au format carte de visite
    const [cw, ch] = CARD[paper];
    const cg = 6;
    const x0 = (W - (2 * cw + cg)) / 2;
    const y0 = half + (half - (2 * ch + cg)) / 2 + 1.5;
    const strip = await embedBand(cw, 8, "green", "top", 2);
    const head = fit(bold, `LOST & FOUND · ${name}`, 7.5, mm(cw - 8));
    for (let r = 0; r < 2; r++) {
      for (let c = 0; c < 2; c++) {
        const x = x0 + c * (cw + cg);
        const y = y0 + r * (ch + cg);
        t.box(x, y, cw, ch, 2, BORDER, 0.8);
        t.image(strip, x, y, cw, 8);
        t.center(head, x + cw / 2, y + 2.7, 7.5, bold, WHITE);
        const q = 26;
        for (let i = 0; i < 2; i++) {
          const cx = x + (cw / 4) * (i === 0 ? 1 : 3);
          t.image(qr[i], cx - q / 2, y + 11, q, q);
          t.center(SIDES[i].title, cx, y + 11 + q + 2, 8, bold, INK[SIDES[i].tone]);
          t.center(SIDES[i].cta, cx, y + 11 + q + 5.6, 6.5, helv, GRAY);
          t.center(shortUrl(SIDES[i].url), cx, y + 11 + q + 8.6, 5, helv, LIGHT);
        }
      }
    }
  }

  return pdf.save();
}
