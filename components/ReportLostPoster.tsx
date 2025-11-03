// components/ReportLostPoster.tsx
"use client";
import React, { useRef } from "react";

export type PageFormat = "A4" | "Letter";
export type HalfSide = "left" | "right";

export type PosterProps = {
  departmentName?: string;
  url?: string;
  qrValue?: string;

  headerTitle?: string;
  headerSubtitle?: string;
  introText?: string;

  lostTitle?: string;
  lostLines?: string[];
  foundTitle?: string;
  foundLines?: string[];

  brandBlue?: string;
  brandGreen?: string;

  // Icônes perso (dans /public)
  lostSvgSrc?: string;   // ex: "/search.svg"
  foundSvgSrc?: string;  // ex: "/main-ouverte.svg"
  flipFoundLeft?: boolean;

  // PDF format
  pageFormat?: PageFormat;
  halfSide?: HalfSide;

  // UI
  showDownloadButtons?: boolean;
};

const defaults = {
  headerTitle: "Lost or Found Something?",
  headerSubtitle: "Scan this QR — quick, free & secure",
  introText:
    "If the item isn’t registered here, please report it on ReportLost.org — it’s free and helps match items faster.",
  lostTitle: "Lost something?",
  lostLines: [
    "Submit a short report with a photo or description.",
    "We’ll index it so nearby stations and residents can see it.",
  ],
  foundTitle: "Found something?",
  foundLines: [
    "Before leaving it here, please scan the QR and fill out the short ‘Found item’ form.",
    "Your report helps locate the rightful owner more quickly.",
  ],
  brandBlue: "#1E4B86",
  brandGreen: "#12A150",
};

const ICON_BOX = 28;
const ICON_SIZE = 26;

export default function ReportLostPoster({
  departmentName = "[City / County Police Department]",
  url = "reportlost.org/citycode",
  qrValue = "https://reportlost.org/report?tab=lost",

  headerTitle = defaults.headerTitle,
  headerSubtitle = defaults.headerSubtitle,
  introText = defaults.introText,

  lostTitle = defaults.lostTitle,
  lostLines = defaults.lostLines,
  foundTitle = defaults.foundTitle,
  foundLines = defaults.foundLines,

  brandBlue = defaults.brandBlue,
  brandGreen = defaults.brandGreen,

  lostSvgSrc = "/search.svg",
  foundSvgSrc = "/main-ouverte.svg",
  flipFoundLeft = true,

  pageFormat = "A4",
  halfSide = "left",
  showDownloadButtons = true,
}: PosterProps) {
  const posterRef = useRef<HTMLDivElement>(null);

  const safeQr = (qrValue ?? "").trim() || "https://reportlost.org/report?tab=lost";
  const safeUrl = (url ?? "").trim() || "reportlost.org";

  // Helpers formats (mm)
  const mmSize = (fmt: PageFormat) =>
    fmt === "A4" ? { w: 210, h: 297 } : { w: 215.9, h: 279.4 };

  async function getJsPDF() {
    const mod: any = await import("jspdf");
    return mod.jsPDF || mod.default?.jsPDF || mod.default || mod;
  }

  const capturePosterCanvas = async (target: HTMLElement, widthMm: number) => {
    const [{ default: html2canvas }] = await Promise.all([import("html2canvas")]);
    const clone = target.cloneNode(true) as HTMLElement;
    clone.style.width = `${widthMm}mm`;
    clone.style.height = "auto";
    clone.style.position = "fixed";
    clone.style.left = "-99999px";
    clone.style.boxShadow = "none";
    clone.style.border = "none";
    clone.style.borderRadius = "0";
    document.body.appendChild(clone);

    const imgs = Array.from(clone.querySelectorAll("img"));
    await Promise.all(
      imgs.map(
        (img) =>
          new Promise<void>((res) => {
            const el = img as HTMLImageElement;
            if (el.complete) return res();
            el.onload = () => res();
            el.onerror = () => res();
          })
      )
    );

    const canvas = await html2canvas(clone, {
      scale: 2,
      backgroundColor: "#ffffff",
      useCORS: true,
    });
    document.body.removeChild(clone);
    return canvas;
  };

  const downloadPdfFullPage = async () => {
    if (!posterRef.current) return;
    const JsPDF: any = await getJsPDF();

    const { w: pageWmm } = mmSize(pageFormat);
    const canvas = await capturePosterCanvas(posterRef.current, pageWmm);
    const imgData = canvas.toDataURL("image/png");

    const pdf = new JsPDF({ unit: "mm", format: pageFormat.toLowerCase(), orientation: "portrait" });
    const pw = pdf.internal.pageSize.getWidth();
    const ph = pdf.internal.pageSize.getHeight();

    const margin = 6;
    const maxW = pw - margin * 2;
    const maxH = ph - margin * 2;

    const ratio = canvas.width / canvas.height;
    let w = maxW, h = w / ratio;
    if (h > maxH) { h = maxH; w = h * ratio; }

    const x = (pw - w) / 2;
    const y = (ph - h) / 2;

    pdf.addImage(imgData, "PNG", x, y, w, h);
    pdf.save(`ReportLost_${pageFormat}_Full.pdf`);
  };

  const downloadPdfHalfPageHorizontal = async () => {
    if (!posterRef.current) return;
    const JsPDF: any = await getJsPDF();

    const { w: pageWmm } = mmSize(pageFormat);
    const captureWidth = pageFormat === "A4" ? 148 : pageWmm / 2;
    const canvas = await capturePosterCanvas(posterRef.current, captureWidth);
    const imgData = canvas.toDataURL("image/png");

    const pdf = new JsPDF({ unit: "mm", format: pageFormat.toLowerCase(), orientation: "landscape" });
    const pw = pdf.internal.pageSize.getWidth();
    const ph = pdf.internal.pageSize.getHeight();

    const margin = 6;
    const slotW = (pw - margin * 2) / 2;
    const slotH = ph - margin * 2;
    const slotX = margin + (halfSide === "left" ? 0 : slotW);
    const slotY = margin;

    const ratio = canvas.width / canvas.height;
    let h = slotH, w = h * ratio;
    if (w > slotW) { w = slotW; h = w / ratio; }
    const x = slotX + (slotW - w) / 2;
    const y = slotY + (slotH - h) / 2;

    pdf.addImage(imgData, "PNG", x, y, w, h);
    pdf.save(`ReportLost_${pageFormat}_HalfHorizontal_${halfSide}.pdf`);
  };

  return (
    <div className="w-full min-h-screen bg-gray-50 py-6">
      {showDownloadButtons && (
        <div className="max-w-[900px] mx-auto mb-4 flex flex-wrap justify-end gap-2">
          <button
            onClick={downloadPdfFullPage}
            className="px-3 py-2 rounded-xl bg-gray-800 text-white text-sm hover:opacity-90"
          >
            Download PDF — Full Page ({pageFormat})
          </button>
          <button
            onClick={downloadPdfHalfPageHorizontal}
            className="px-3 py-2 rounded-xl bg-gray-700 text-white text-sm hover:opacity-90"
          >
            Download PDF — Half Page Horizontal ({pageFormat}, {halfSide})
          </button>
        </div>
      )}

      <div
        id="poster-print"
        ref={posterRef}
        className="mx-auto bg-white shadow-xl rounded-2xl overflow-hidden border border-gray-200"
        style={{ width: 874, height: 1240 }}
      >
        {/* Header */}
        <div className="px-10 pt-8 pb-6 text-white" style={{ backgroundColor: brandBlue }}>
          <h1 className="text-5xl font-extrabold leading-tight text-center">{headerTitle}</h1>
          <p className="text-xl text-center mt-2 opacity-95">{headerSubtitle}</p>
        </div>

        {/* Body */}
        <div className="px-10 pt-8 pb-6">
          <p className="text-center text-lg text-gray-800 max-w-[660px] mx-auto">{introText}</p>

          <div className="grid grid-cols-2 gap-10 mt-8">
            {/* LOST */}
            <div className="flex items-start gap-3">
              <div className="shrink-0 flex items-center justify-center" style={{ width: ICON_BOX, height: ICON_BOX }}>
                <img
                  src={lostSvgSrc}
                  alt="search"
                  width={ICON_SIZE}
                  height={ICON_SIZE}
                  className="object-contain"
                />
              </div>
              <div>
                <h3 className="text-2xl font-semibold" style={{ color: brandGreen }}>
                  {lostTitle}
                </h3>
                <div className="mt-2 space-y-2 text-gray-800">
                  {lostLines.map((line, i) => (
                    <p key={i} className="leading-snug">{line}</p>
                  ))}
                </div>
              </div>
            </div>

            {/* FOUND */}
            <div className="flex items-start gap-3">
              <div className="shrink-0 flex items-center justify-center" style={{ width: ICON_BOX, height: ICON_BOX }}>
                <img
                  src={foundSvgSrc}
                  alt="found hand"
                  width={ICON_SIZE}
                  height={ICON_SIZE}
                  className={`object-contain ${flipFoundLeft ? "-scale-x-100" : ""}`}
                />
              </div>
              <div>
                <h3 className="text-2xl font-semibold" style={{ color: brandBlue }}>
                  {foundTitle}
                </h3>
                <div className="mt-2 space-y-2 text-gray-800">
                  {foundLines.map((line, i) => (
                    <p key={i} className="leading-snug">{line}</p>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* QR + URL */}
          <div className="mt-10 flex flex-col items-center">
            <div className="p-2 bg-white rounded-xl border border-gray-300">
              {/* ✅ QR forcé en image PNG (zéro dépendance) */}
              <img
                src={`https://api.qrserver.com/v1/create-qr-code/?size=240x240&data=${encodeURIComponent(
                  safeQr
                )}`}
                width={240}
                height={240}
                alt="QR code"
              />
            </div>
            <div className="mt-4 text-2xl font-semibold tracking-wide text-gray-900">{safeUrl}</div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-10 pb-8 text-center text-sm text-gray-600">
          Provided in partnership with <span className="font-medium">{departmentName}</span> and{" "}
          <span className="italic">ReportLost.org</span>
        </div>
      </div>
    </div>
  );
}
