"use client";

// Bloc d'amorce des pages villes.
//
// Avant, la page ville embarquait le formulaire complet, chargé en ssr:false.
// Trois conséquences : le bundle du formulaire (Stripe compris) se téléchargeait
// sur les 31 000 pages villes, y compris pour les visiteurs qui ne le rempliront
// jamais ; le contenu situé en dessous sautait de ~300 px au montage, ce qui a
// fait passer le CLS mobile à 0,26 ; et il fallait masquer le contenu ville
// hors écran à partir de l'étape 3 pour que la page reste lisible.
//
// Désormais la page ville ne pose qu'UNE question, la première du formulaire.
// La réponse part dans l'URL vers /report, où le formulaire s'ouvre avec l'objet
// et la ville déjà remplis : la personne arrive à l'étape 1 à moitié faite.
//
// Deux points d'entrée, parce que ces pages sont longues : l'amorce en haut, et
// une barre collante qui prend le relais dès que l'amorce sort de l'écran.

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";

export default function CityLostFormBlock({
  defaultCity,
  titleSection,
  recentAndMapSection,
  extraBelowForm,
}: {
  defaultCity: string;
  titleSection: React.ReactNode;
  recentAndMapSection: React.ReactNode;
  extraBelowForm?: React.ReactNode;
}) {
  const router = useRouter();
  const [item, setItem] = useState("");
  const [showSticky, setShowSticky] = useState(false);
  const starterRef = useRef<HTMLDivElement | null>(null);

  const reportUrl = (withItem: boolean) => {
    const p = new URLSearchParams({ tab: "lost" });
    if (defaultCity) p.set("city", defaultCity);
    const v = item.trim();
    if (withItem && v) p.set("item", v);
    return `/report?${p.toString()}`;
  };

  // Le formulaire est une grosse page : on la précharge dès que l'intention
  // apparaît (survol ou focus), pour que la transition soit immédiate.
  const prefetch = () => {
    try {
      router.prefetch("/report");
    } catch {
      /* non bloquant */
    }
  };

  const go = (withItem: boolean) => router.push(reportUrl(withItem));

  // La barre collante n'apparaît que lorsque l'amorce a quitté l'écran.
  useEffect(() => {
    const el = starterRef.current;
    if (!el || typeof IntersectionObserver === "undefined") return;
    const io = new IntersectionObserver(
      ([entry]) => setShowSticky(!entry.isIntersecting && entry.boundingClientRect.top < 0),
      { threshold: 0 }
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  return (
    <>
      {titleSection}

      {/* ---- Amorce : une seule question ---- */}
      <div ref={starterRef} id="report-form" className="scroll-mt-6">
        <div className="overflow-hidden rounded-2xl border-2 border-green-500 bg-gradient-to-b from-green-50/60 to-white shadow-[0_6px_20px_-12px_rgba(34,197,94,.7)]">
          <div className="px-5 pt-4 sm:px-6">
            <h2 className="text-lg font-bold text-[#1f6b3a] sm:text-xl">What did you lose?</h2>
            <p className="mt-1 text-[13px] text-gray-600">
              Start here. The rest takes about two minutes, and publishing is free.
            </p>
          </div>
          <div className="px-5 pb-5 pt-3 sm:px-6">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                go(true);
              }}
            >
              <input
                type="text"
                value={item}
                onChange={(e) => setItem(e.target.value)}
                onFocus={prefetch}
                onMouseEnter={prefetch}
                enterKeyHint="go"
                aria-label="What did you lose?"
                placeholder="Start typing your item (e.g., Phone, Wallet, Passport)…"
                className="w-full rounded-xl border-[1.5px] border-green-200 bg-white px-4 py-3 text-[15px] text-gray-900 outline-none placeholder:text-gray-400 focus:border-green-400 focus:ring-2 focus:ring-green-200"
              />
              <button
                type="submit"
                onMouseEnter={prefetch}
                className="mt-2.5 w-full rounded-xl bg-gradient-to-r from-[#26723e] to-[#2ea052] py-3 text-[15px] font-bold text-white"
              >
                Continue →
              </button>
            </form>
            <p className="mt-2.5 text-center text-[11.5px] text-gray-500">
              Free listing · no account · your details stay private
            </p>
          </div>
        </div>
      </div>

      {recentAndMapSection}
      {extraBelowForm}

      {/* ---- Barre collante : ces pages sont longues, l'amorce sort vite de
              l'écran. 56 px, atteignable au pouce, elle ne repart plus. ---- */}
      <div
        className={`fixed inset-x-0 bottom-0 z-40 border-t border-gray-200 bg-white/97 shadow-[0_-6px_20px_-12px_rgba(15,23,42,.4)] backdrop-blur transition-transform duration-300 ${
          showSticky ? "translate-y-0" : "translate-y-full"
        }`}
        aria-hidden={!showSticky}
      >
        <div className="mx-auto flex max-w-3xl items-center gap-3 px-3 py-2.5">
          <div className="min-w-0 flex-1 leading-tight">
            <span className="block text-[13px] font-bold text-gray-900">
              Lost something in {defaultCity}?
            </span>
            <span className="text-[11.5px] text-gray-500">Free to publish · 2 minutes</span>
          </div>
          <button
            type="button"
            onClick={() => go(false)}
            onMouseEnter={prefetch}
            tabIndex={showSticky ? 0 : -1}
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
