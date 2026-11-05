"use client";
// 🇨🇦 Barre collante des pages villes canadiennes.
// Reprise de la barre de components/CityLostFormBlock.tsx (US, non modifié) :
// elle n'apparaît que lorsque l'amorce du formulaire (#report-form) a quitté
// l'écran, et renvoie vers /ca/report avec la ville déjà remplie.
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export default function CaCityStickyBar({ cityName, cityParam }: { cityName: string; cityParam: string }) {
  const router = useRouter();
  const [show, setShow] = useState(false);

  useEffect(() => {
    const el = document.getElementById("report-form");
    if (!el || typeof IntersectionObserver === "undefined") return;
    const io = new IntersectionObserver(
      ([entry]) => setShow(!entry.isIntersecting && entry.boundingClientRect.top < 0),
      { threshold: 0 }
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  const go = () => {
    const p = new URLSearchParams({ tab: "lost", city: cityParam });
    try {
      p.set("from", window.location.pathname.slice(0, 120));
    } catch {
      /* ignore */
    }
    router.push(`/ca/report?${p.toString()}`);
  };

  const prefetch = () => {
    try {
      router.prefetch("/ca/report");
    } catch {
      /* non bloquant */
    }
  };

  return (
    <>
      <div
        className={`fixed inset-x-0 bottom-0 z-40 border-t border-gray-200 bg-white/97 shadow-[0_-6px_20px_-12px_rgba(15,23,42,.4)] backdrop-blur transition-transform duration-300 ${
          show ? "translate-y-0" : "translate-y-full"
        }`}
        aria-hidden={!show}
      >
        <div className="mx-auto flex max-w-3xl items-center gap-3 px-3 py-2.5">
          <div className="min-w-0 flex-1 leading-tight">
            <span className="block text-[13px] font-bold text-gray-900">Lost something in {cityName}?</span>
          </div>
          <button
            type="button"
            onClick={go}
            onMouseEnter={prefetch}
            tabIndex={show ? 0 : -1}
            className="flex-none rounded-lg bg-gradient-to-r from-[#26723e] to-[#2ea052] px-4 py-2.5 text-[13.5px] font-bold text-white"
          >
            Report it →
          </button>
        </div>
      </div>
      {/* La barre flotte au-dessus du contenu : on rend sa hauteur au bas de page. */}
      <div aria-hidden className="h-16" />
    </>
  );
}
