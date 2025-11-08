"use client";

import React from "react";

/**
 * Page autonome (aucun layout), A4 exacte en mm.
 * Reproduit UNIQUEMENT le 1er sticker (haut-gauche) sans QR.
 * Impression : Ctrl/Cmd+P → “Enregistrer en PDF” (échelle 100%).
 *
 * Remarque : A4 = 210 x 297 mm.
 * On dessine dans un conteneur de 210x297mm pour correspondre au PDF.
 */
export default function Page() {
  return (
    <div className="print:bg-white" style={{ background: "#fff" }}>
      {/* Artboard A4 exact en mm, centré, sans chrome */}
      <div
        style={{
          width: "210mm",
          height: "297mm",
          margin: "0 auto",
          position: "relative",
          background: "#fff",
        }}
      >
        {/* === STICKER 1 (haut-gauche) ===
            Placement : marge haut/gauche ~18mm (ajuste si besoin)
            Taille du sticker ~50mm x 50mm avec coins arrondis
        */}
        <svg
          width="50mm"
          height="50mm"
          viewBox="0 0 150 150"
          style={{
            position: "absolute",
            top: "18mm",
            left: "18mm",
            overflow: "visible",
          }}
          xmlns="http://www.w3.org/2000/svg"
        >
          {/* fond blanc du sticker (capsule carrée) */}
          <rect x="0" y="0" width="150" height="150" rx="22" fill="#ffffff" />

          {/* demi-cercles orange latéraux (comme sur ton PDF) */}
          {/* gauche */}
          <path
            d={`M0,75 a75,75 0 0,1 75,-75 v150 a75,75 0 0,1 -75,-75`}
            fill="#E0893A"
            fillOpacity="0.95"
          />
          {/* droite */}
          <path
            d={`M150,75 a75,75 0 0,0 -75,-75 v150 a75,75 0 0,0 75,-75`}
            fill="#E0893A"
            fillOpacity="0.95"
          />

          {/* zone centrale (emplacement futur du QR) — pas de beige demandé */}
          <rect
            x="15"
            y="15"
            width="120"
            height="120"
            rx="12"
            fill="#ffffff"
            stroke="#e6e6e6"
            strokeWidth="0.5"
          />
        </svg>
      </div>

      <style
        dangerouslySetInnerHTML={{
          __html: `
          /* Pas de marges imprimante */
          @page { size: A4; margin: 0; }
          html, body { padding: 0; margin: 0; }
          @media print {
            body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
          }
        `,
        }}
      />
    </div>
  );
}
