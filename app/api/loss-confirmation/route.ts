// app/api/loss-confirmation/route.ts
// Attestation de déclaration de perte (Loss Report Confirmation).
// Document PDF A4 remis au client depuis sa page privée /case/[public_id].
//
// ⚠️ Portée juridique : ce document atteste UNIQUEMENT de la date, du contenu
// et de la persistance du signalement tel que déclaré par le client. Il
// n'atteste ni l'existence, ni la propriété, ni la valeur des objets décrits.
// Ne jamais modifier le paragraphe SCOPE sans réflexion : c'est lui qui rend
// l'attestation délivrable automatiquement sans risque.
//
// Accès : exige le case_token du dossier (?t=...), comme la page /case.
// Les public_id à 5 chiffres sont énumérables et le document contient des
// données personnelles : pas de token, pas de PDF.
import { NextRequest, NextResponse } from "next/server";
import { PDFDocument, StandardFonts, rgb, PDFFont, PDFPage } from "pdf-lib";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 30;

const mm = (n: number) => (n / 25.4) * 72;
const PAGE_W = mm(210);
const PAGE_H = mm(297);
const M = mm(15); // marge
const CONTENT_W = PAGE_W - 2 * M;

const INK = rgb(0.102, 0.11, 0.122); // #1a1c1f
const GREEN_DEEP = rgb(0.078, 0.325, 0.176); // #14532d
const GOLD = rgb(0.722, 0.569, 0.184); // #b8912f
const GRAY = rgb(0.42, 0.455, 0.502); // #6b7480
const HAIR = rgb(0.843, 0.863, 0.886); // #d7dce2
const PANEL = rgb(0.961, 0.969, 0.976); // #f5f7f9

// ---------- helpers ----------
// Les polices standard PDF sont encodees en WinAnsi : tout caractere hors de
// cette table fait planter pdf-lib. Les descriptions viennent des clients et
// peuvent contenir n'importe quoi (emoji, guillemets typographiques, cyrillique).
// On normalise donc systematiquement avant de dessiner.
const WINANSI_OK = /^[\x20-\x7E\xA0-\xFF\u2018\u2019\u201C\u201D\u2013\u2014\u2022\u2026\u20AC]$/;
function safe(input: any): string {
  const s = String(input ?? "")
    .replace(/\u00A0/g, " ")
    .normalize("NFC");
  let out = "";
  for (const ch of s) {
    if (WINANSI_OK.test(ch)) out += ch;
    else if (/\s/.test(ch)) out += " ";
    // sinon : caractere non imprimable dans la police, on le laisse tomber
  }
  return out.replace(/[ \t]{2,}/g, " ").trim();
}

function wrap(text: string, font: PDFFont, size: number, maxW: number): string[] {
  const out: string[] = [];
  for (const para of String(text || "").split(/\n+/)) {
    let line = "";
    for (const word of para.split(/\s+/).filter(Boolean)) {
      const test = line ? `${line} ${word}` : word;
      if (font.widthOfTextAtSize(test, size) <= maxW) {
        line = test;
      } else {
        if (line) out.push(line);
        line = word;
      }
    }
    if (line) out.push(line);
  }
  return out.length ? out : [""];
}

function fmtDate(v: any): string {
  if (!v) return "";
  const d = new Date(v);
  if (isNaN(d.getTime())) return String(v);
  return d.toLocaleDateString("en-US", { day: "numeric", month: "long", year: "numeric" });
}

// Nettoie une ville du type "Charleston (SC)"
const cleanCity = (s: any) => String(s || "").replace(/\s*\([^)]*\)\s*$/, "").trim();

export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const public_id = String(url.searchParams.get("public_id") || "").trim();
    const token = String(url.searchParams.get("t") || "").trim();

    if (!/^\d{5}$/.test(public_id)) {
      return NextResponse.json({ ok: false, error: "public_id invalide" }, { status: 400 });
    }

    const sb = getSupabaseAdmin();
    if (!sb) {
      return NextResponse.json({ ok: false, error: "Supabase non configuré" }, { status: 500 });
    }

    const { data: row, error } = await sb
      .from("lost_items")
      .select(
        "public_id, created_at, paid, paid_at, contribution, case_token, first_name, last_name, email, email_alias, title, description, circumstances, city, state_id, date, time_slot, place_type, place_type_other, loss_street, loss_neighborhood, object_photo"
      )
      .eq("public_id", public_id)
      .maybeSingle();

    if (error || !row) {
      return NextResponse.json({ ok: false, error: "Report introuvable" }, { status: 404 });
    }

    // 🔒 jeton obligatoire
    if (!row.case_token || token !== row.case_token) {
      return NextResponse.json({ ok: false, error: "Lien invalide ou expiré" }, { status: 403 });
    }

    // Réservé aux dossiers payants
    if (!row.paid && !(Number(row.contribution || 0) > 0)) {
      return NextResponse.json({ ok: false, error: "Dossier non éligible" }, { status: 403 });
    }

    // ---------- données ----------
    const fullName = safe([row.first_name, row.last_name].filter(Boolean).join(" "));
    const reportingParty = fullName || safe(row.email) || "the reporting party";
    const filedOn = fmtDate(row.created_at);
    const issuedOn = fmtDate(new Date());

    const city = cleanCity(row.city);
    const placeBits = [
      safe(row.place_type_other || row.place_type),
      safe(row.loss_street),
      safe(row.loss_neighborhood),
      safe([city, row.state_id].filter(Boolean).join(", ")),
    ].filter(Boolean);
    const locationDeclared = placeBits.join(", ") || "Not specified";

    const dateOfLoss =
      [fmtDate(row.date), safe(row.time_slot)].filter(Boolean).join(", ") ||
      "Not specified";

    const itemTitle = safe(row.title) || "Item as declared";
    const itemDesc = safe(row.description);
    const circumstances = safe(row.circumstances);
    const relay = safe(row.email_alias) || `item${public_id}@reportlost.org`;

    // ---------- document ----------
    const pdf = await PDFDocument.create();
    pdf.setTitle(`Loss Report Confirmation ${public_id}`);
    pdf.setAuthor("ReportLost.org");
    pdf.setSubject("Loss Report Confirmation");
    pdf.setProducer("ReportLost.org");

    const page: PDFPage = pdf.addPage([PAGE_W, PAGE_H]);
    const helv = await pdf.embedFont(StandardFonts.Helvetica);
    const helvB = await pdf.embedFont(StandardFonts.HelveticaBold);
    const times = await pdf.embedFont(StandardFonts.TimesRoman);

    let y = PAGE_H - M; // curseur, depuis le haut

    const text = (s: string, x: number, size: number, font: PDFFont, color = INK) =>
      page.drawText(safe(s), { x, y, size, font, color });

    const textAt = (s: string, x: number, yy: number, size: number, font: PDFFont, color = INK) =>
      page.drawText(safe(s), { x, y: yy, size, font, color });

    const line = (x1: number, yy: number, x2: number, color = HAIR, thickness = 0.7) =>
      page.drawLine({ start: { x: x1, y: yy }, end: { x: x2, y: yy }, thickness, color });

    const centered = (s: string, yy: number, size: number, font: PDFFont, color = INK) => {
      const w = font.widthOfTextAtSize(safe(s), size);
      page.drawText(safe(s), { x: (PAGE_W - w) / 2, y: yy, size, font, color });
    };

    // Paragraphe justifié à gauche, renvoie la nouvelle position y
    const paragraph = (
      s: string,
      x: number,
      yy: number,
      size: number,
      font: PDFFont,
      maxW: number,
      lead = size * 1.42,
      color = INK
    ) => {
      for (const l of wrap(safe(s), font, size, maxW)) {
        page.drawText(l, { x, y: yy, size, font, color });
        yy -= lead;
      }
      return yy;
    };

    // ---- en-tête ----
    y -= 12;
    text("ReportLost.org", M, 16, helvB, GREEN_DEEP);
    const rightX = PAGE_W - M;
    const e1 = "support@reportlost.org";
    const e2 = "reportlost.org";
    textAt(e1, rightX - helv.widthOfTextAtSize(e1, 8), y + 5, 8, helv, GRAY);
    textAt(e2, rightX - helv.widthOfTextAtSize(e2, 8), y - 5, 8, helv, GRAY);
    y -= 11;
    text("LOST ITEM INVESTIGATION TEAM", M, 7.5, helv, GRAY);
    y -= 7;
    line(M, y, PAGE_W - M, GREEN_DEEP, 1.6);

    // ---- titre ----
    y -= 26;
    centered("LOSS REPORT CONFIRMATION", y, 15, helvB, GREEN_DEEP);
    y -= 9;
    page.drawLine({
      start: { x: PAGE_W / 2 - 22, y },
      end: { x: PAGE_W / 2 + 22, y },
      thickness: 2,
      color: GOLD,
    });

    // ---- bandeau références ----
    y -= 16;
    line(M, y, PAGE_W - M);
    const cols: [string, string][] = [
      ["REPORT REFERENCE", public_id],
      ["REPORT FILED", filedOn],
      ["ISSUED", issuedOn],
    ];
    const colW = CONTENT_W / 3;
    cols.forEach(([lab, val], i) => {
      const cx = M + colW * i + colW / 2;
      textAt(lab, cx - helv.widthOfTextAtSize(lab, 7) / 2, y - 13, 7, helv, GRAY);
      textAt(val, cx - helvB.widthOfTextAtSize(val, 10.5) / 2, y - 26, 10.5, helvB, GREEN_DEEP);
    });
    y -= 33;
    line(M, y, PAGE_W - M);

    // ---- phrase d'attestation ----
    y -= 18;
    y = paragraph(
      `This document confirms that on ${filedOn}, ${reportingParty} submitted a loss report to ReportLost.org concerning the item described below, and that this report has remained open and active on our platform continuously since that date.`,
      M,
      y,
      10,
      times,
      CONTENT_W,
      14
    );

    // ---- sections ----
    const heading = (label: string) => {
      y -= 10;
      text(label.toUpperCase(), M, 8.2, helvB, GREEN_DEEP);
      y -= 5;
      line(M, y, PAGE_W - M);
      y -= 12;
    };

    const KEY_W = mm(42);
    const VAL_X = M + KEY_W;
    const VAL_W = CONTENT_W - KEY_W;

    const field = (k: string, v: string) => {
      const lines = wrap(v, times, 10, VAL_W);
      textAt(k.toUpperCase(), M, y, 8, helv, GRAY);
      let yy = y;
      for (const l of lines) {
        textAt(l, VAL_X, yy, 10, times, INK);
        yy -= 13.5;
      }
      y = yy - 3;
      line(M, y + 6, PAGE_W - M, rgb(0.9, 0.918, 0.937), 0.5);
    };

    heading("Loss as declared by the reporting party");
    field("Reporting party", reportingParty);
    if (row.email) field("Contact on file", String(row.email));
    field("Date of loss", dateOfLoss);
    field("Location declared", locationDeclared);
    if (circumstances) field("Circumstances", `As declared: "${circumstances}"`);

    heading("Item as declared");
    // barre dorée + description
    const descText = itemDesc || itemTitle;
    const descLines = wrap(descText, times, 10, CONTENT_W - mm(6));
    const blockH = 12 + descLines.length * 13.5;
    page.drawRectangle({
      x: M,
      y: y - blockH + 12,
      width: 2.2,
      height: blockH,
      color: GOLD,
    });
    textAt(itemTitle.toUpperCase().slice(0, 70), M + mm(4), y, 8, helvB, GOLD);
    let dy = y - 13;
    for (const l of descLines) {
      textAt(l, M + mm(4), dy, 10, times, INK);
      dy -= 13.5;
    }
    y = dy - 4;

    heading("On file");
    field("Documents", "Report as submitted by the reporting party, together with any documents and photographs provided.");
    field(
      "Dedicated address",
      // Adresse publique : elle arrive chez ReportLost, qui filtre puis relaie.
      // Ne pas ecrire "forwards directly" : c'est faux et le document est
      // destine a des assureurs.
      `${relay} — active on this report since ${filedOn}, monitored by ReportLost.org and relayed to the reporting party.`
    );

    // ---- portée ----
    heading("Scope of this confirmation");
    const scope =
      "ReportLost.org confirms the date, the content and the continued existence of this report as submitted by the reporting party. ReportLost.org has not witnessed the loss and makes no representation as to the existence, ownership or value of the items described, which are stated as declared by the reporting party.";
    const scopeLines = wrap(scope, times, 9.2, CONTENT_W - mm(8));
    const scopeH = scopeLines.length * 12.5 + 16;
    page.drawRectangle({
      x: M,
      y: y - scopeH + 10,
      width: CONTENT_W,
      height: scopeH,
      color: PANEL,
      borderColor: HAIR,
      borderWidth: 0.7,
    });
    let sy = y - 4;
    for (const l of scopeLines) {
      textAt(l, M + mm(4), sy, 9.2, times, INK);
      sy -= 12.5;
    }
    y = y - scopeH - 2;

    // ---- signature + sceau ----
    y -= 26;
    line(M, y + 14, M + mm(74), INK, 0.8);
    textAt("Anna Boquien", M, y, 10, helvB, INK);
    textAt("Lost Item Investigation Team", M, y - 12, 8.6, helv, INK);
    textAt(`ReportLost.org  ·  ${issuedOn}`, M, y - 23, 8.6, helv, INK);

    const seal = { cx: PAGE_W - M - mm(14), cy: y + 4, r: mm(13) };
    page.drawCircle({
      x: seal.cx,
      y: seal.cy,
      size: seal.r,
      borderColor: GOLD,
      borderWidth: 1.2,
    });
    const sealLines: [string, number, PDFFont][] = [
      ["REPORTLOST", 8, helvB],
      ["CONFIRMED", 6.4, helv],
      [`REPORT ${public_id}`, 6.4, helv],
    ];
    let scy = seal.cy + 8;
    for (const [s, size, f] of sealLines) {
      textAt(s, seal.cx - f.widthOfTextAtSize(s, size) / 2, scy, size, f, GOLD);
      scy -= 10;
    }

    // ---- pied de page ----
    const footY = M - 4;
    line(M, footY + 12, PAGE_W - M);
    textAt(`Loss Report Confirmation · Reference ${public_id}`, M, footY, 7.2, helv, GRAY);
    const fr = `Issued ${issuedOn} · ReportLost.org`;
    textAt(fr, PAGE_W - M - helv.widthOfTextAtSize(fr, 7.2), footY, 7.2, helv, GRAY);

    const bytes = await pdf.save();
    return new NextResponse(Buffer.from(bytes), {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `inline; filename="loss_report_confirmation_${public_id}.pdf"`,
        "Cache-Control": "no-store",
      },
    });
  } catch (e: any) {
    console.error("[loss-confirmation]", e);
    return NextResponse.json({ ok: false, error: String(e?.message || e) }, { status: 500 });
  }
}
