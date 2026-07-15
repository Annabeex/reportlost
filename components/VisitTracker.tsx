"use client";

// Compteur de visites anonyme : classe la session par provenance
// (organique / social / IA / direct / referral) et l'enregistre une seule
// fois par session dans la table events. Aucune donnée personnelle.
import { useEffect } from "react";

function classify(): string {
  try {
    const params = new URLSearchParams(window.location.search);
    const utm = (params.get("utm_source") || "").toLowerCase();
    const ref = (document.referrer || "").toLowerCase();
    const hay = utm || ref;

    if (!hay) return "visit_direct";
    if (/google|bing|duckduckgo|yahoo|ecosia|brave/.test(hay)) return "visit_organic";
    if (/facebook|instagram|fb\.|reddit|nextdoor|t\.co|twitter|x\.com|linkedin|tiktok|pinterest/.test(hay))
      return "visit_social";
    if (/chatgpt|openai|perplexity|claude|gemini|copilot/.test(hay)) return "visit_ai";
    if (hay.includes("reportlost.org")) return ""; // navigation interne, on ignore
    return "visit_referral";
  } catch {
    return "visit_direct";
  }
}

export default function VisitTracker() {
  useEffect(() => {
    try {
      if (sessionStorage.getItem("rl_visit_tracked")) return;
      const event = classify();
      if (!event) return;
      sessionStorage.setItem("rl_visit_tracked", "1");
      fetch("/api/track", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ event }),
        keepalive: true,
      }).catch(() => {});
    } catch {}
  }, []);
  return null;
}
