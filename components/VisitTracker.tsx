"use client";

// Compteur de visites anonyme. Aucune donnee personnelle, aucune query string.
//
// Trois mesures distinctes :
//  1. visit_<source> : la visite brute, enregistree des l'arrivee (comme avant),
//     avec la PAGE D'ARRIVEE. Inclut les robots qui executent le JavaScript en
//     se faisant passer pour un navigateur.
//  2. visit_human    : enregistree seulement au premier signe d'un humain
//     (defilement, toucher, clic, clavier, mouvement de souris). Les robots ne
//     font rien de tout cela. C'est le denominateur du vrai taux de conversion.
//  3. rl_last_page   : la derniere page vue avant /report, gardee en session.
//     Les navigations internes de Next.js ne mettent pas a jour
//     document.referrer : sans ce relais, un depot fait apres une page ville
//     serait attribue a Google ou a Facebook.
import { useEffect } from "react";
import { usePathname } from "next/navigation";

function classify(): string {
  try {
    const params = new URLSearchParams(window.location.search);
    const utm = (params.get("utm_source") || "").toLowerCase();
    const ref = (document.referrer || "").toLowerCase();
    const hay = utm || ref;

    if (!hay) return "direct";
    if (/google|bing|duckduckgo|yahoo|ecosia|brave/.test(hay)) return "organic";
    if (/facebook|instagram|fb\.|reddit|nextdoor|t\.co|twitter|x\.com|linkedin|tiktok|pinterest/.test(hay))
      return "social";
    if (/chatgpt|openai|perplexity|claude|gemini|copilot/.test(hay)) return "ai";
    if (hay.includes("reportlost.org")) return ""; // navigation interne, on ignore
    return "referral";
  } catch {
    return "direct";
  }
}

function send(event: string, src: string, path: string) {
  try {
    fetch("/api/track", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ event, src, path }),
      keepalive: true,
    }).catch(() => {});
  } catch {}
}

export default function VisitTracker() {
  const pathname = usePathname();

  // Derniere page vue hors formulaire : origine du depot.
  useEffect(() => {
    try {
      if (pathname && !pathname.startsWith("/report")) {
        sessionStorage.setItem("rl_last_page", pathname.slice(0, 160));
      }
    } catch {}
  }, [pathname]);

  // Visite brute + visite humaine, une fois par session.
  useEffect(() => {
    let cleanup = () => {};
    try {
      if (sessionStorage.getItem("rl_visit_tracked")) return;
      const src = classify();
      if (!src) return;
      const landing = window.location.pathname.slice(0, 160);
      sessionStorage.setItem("rl_visit_tracked", "1");
      sessionStorage.setItem("rl_visit_src", src);
      sessionStorage.setItem("rl_landing", landing);
      send(`visit_${src}`, src, landing);

      const EVENTS = ["scroll", "pointerdown", "touchstart", "keydown", "pointermove"] as const;
      const onHuman = () => {
        try {
          if (sessionStorage.getItem("rl_human_tracked")) return;
          sessionStorage.setItem("rl_human_tracked", "1");
        } catch {}
        send("visit_human", src, landing);
        cleanup();
      };
      EVENTS.forEach((e) => window.addEventListener(e, onHuman, { passive: true, once: true }));
      cleanup = () => EVENTS.forEach((e) => window.removeEventListener(e, onHuman));
    } catch {}
    return () => cleanup();
  }, []);

  return null;
}
