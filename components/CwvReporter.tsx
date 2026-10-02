"use client";

// components/CwvReporter.tsx
//
// Mesure le CLS chez les VRAIS visiteurs et renvoie l'élément qui a bougé.
//
// Pourquoi ce composant existe : Search Console signale un CLS de 0,60 sur un
// groupe de 36 pages, alors que Lighthouse mesure 0 sur la même URL. Le défaut
// n'apparaît donc que sur le terrain — vrais appareils, vraies largeurs d'écran,
// vrais réseaux — et aucun test en laboratoire ne le reproduira. La seule façon
// de savoir ce qui bouge est de le mesurer là où ça bouge.
//
// Pas de dépendance : la bibliothèque web-vitals ferait la même chose, mais elle
// imposerait un `npm install` et 5 Ko de plus pour une quarantaine de lignes.
//
// Ce qui est envoyé : la valeur, le chemin de la page, le sélecteur CSS de
// l'élément le plus déplacé, la largeur d'écran. Aucune donnée personnelle.
import { useEffect } from "react";

type Source = { node?: Node };
type ShiftEntry = PerformanceEntry & {
  value: number;
  hadRecentInput: boolean;
  sources?: Source[];
};

/** Sélecteur court et lisible, suffisant pour retrouver l'élément dans le code. */
function selecteur(node?: Node | null): string {
  const el = node && node.nodeType === 1 ? (node as Element) : node?.parentElement;
  if (!el) return "(inconnu)";
  const parts: string[] = [];
  let cur: Element | null = el;
  for (let i = 0; cur && i < 3; i++) {
    let p = cur.tagName.toLowerCase();
    if (cur.id) { p += `#${cur.id}`; parts.unshift(p); break; }
    const cls = typeof cur.className === "string" ? cur.className.trim().split(/\s+/).slice(0, 3) : [];
    if (cls.length) p += "." + cls.join(".");
    parts.unshift(p);
    cur = cur.parentElement;
  }
  return parts.join(" > ").slice(0, 300);
}

export default function CwvReporter() {
  useEffect(() => {
    if (typeof PerformanceObserver === "undefined") return;
    if (!PerformanceObserver.supportedEntryTypes?.includes("layout-shift")) return;

    // CLS = la plus grosse « fenêtre de session » : des décalages séparés de
    // moins d'1 s, dans une fenêtre de 5 s maximum. C'est la définition de
    // Google, et prendre la somme brute surestimerait beaucoup.
    let fenetre = 0;
    let debut = 0;
    let dernier = 0;
    let max = 0;
    let pireValeur = 0;
    let pireSelecteur = "";
    let envoye = false;

    const obs = new PerformanceObserver((list) => {
      for (const e of list.getEntries() as ShiftEntry[]) {
        if (e.hadRecentInput) continue;
        const t = e.startTime;
        if (fenetre && t - dernier < 1000 && t - debut < 5000) {
          fenetre += e.value;
        } else {
          fenetre = e.value;
          debut = t;
        }
        dernier = t;
        if (fenetre > max) max = fenetre;
        if (e.value > pireValeur) {
          pireValeur = e.value;
          pireSelecteur = selecteur(e.sources?.[0]?.node);
        }
      }
    });

    try {
      obs.observe({ type: "layout-shift", buffered: true });
    } catch {
      return;
    }

    // L'envoi se fait quand l'onglet passe en arrière-plan : c'est le seul
    // moment où la valeur est définitive. `unload` n'est pas fiable sur mobile.
    const envoyer = () => {
      if (envoye || max <= 0) return;
      envoye = true;
      const corps = JSON.stringify({
        metric: "CLS",
        value: Number(max.toFixed(4)),
        path: location.pathname.slice(0, 160),
        selector: pireSelecteur,
        viewport_w: window.innerWidth,
        nav_type: (performance.getEntriesByType("navigation")[0] as any)?.type || null,
      });
      try {
        if (navigator.sendBeacon) {
          navigator.sendBeacon("/api/cwv", new Blob([corps], { type: "application/json" }));
        } else {
          fetch("/api/cwv", { method: "POST", body: corps, keepalive: true,
            headers: { "Content-Type": "application/json" } }).catch(() => {});
        }
      } catch {}
    };

    const surVisibilite = () => { if (document.visibilityState === "hidden") envoyer(); };
    document.addEventListener("visibilitychange", surVisibilite);
    window.addEventListener("pagehide", envoyer);

    return () => {
      document.removeEventListener("visibilitychange", surVisibilite);
      window.removeEventListener("pagehide", envoyer);
      try { obs.disconnect(); } catch {}
    };
  }, []);

  return null;
}
