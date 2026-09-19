"use client";

// components/LostStarterCard.tsx
//
// L'amorce du formulaire : UNE question, posée là où le visiteur se trouve.
// La réponse part dans l'URL vers /report, qui s'ouvre avec l'objet et la ville
// déjà remplis — la personne arrive à l'étape 1 à moitié faite.
//
// Extrait de CityLostFormBlock pour être posé aussi sur les pages d'annonces :
// sur 1 000 URL explorées par Google, 587 sont des annonces et 402 des guides
// ville. Ces pages-là portent le trafic, et elles n'offraient qu'un lien vers
// un formulaire vierge.

import { useState } from "react";
import { useRouter } from "next/navigation";
import ObjectSuggest from "@/components/ObjectSuggest";

export default function LostStarterCard({
  city,
  heading = "What did you lose?",
  showHint = true,
}: {
  /** Pré-remplit la ville dans /report. */
  city?: string;
  /** Titre du bandeau vert. */
  heading?: string;
  /** Le paragraphe d'explication sur la ligne « Other ». */
  showHint?: boolean;
}) {
  const router = useRouter();
  const [item, setItem] = useState("");

  const reportUrl = () => {
    const p = new URLSearchParams({ tab: "lost" });
    if (city) p.set("city", city);
    const v = item.trim();
    if (v) p.set("item", v);
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

  return (
    <div className="rounded-2xl border border-green-200 bg-white shadow-sm">
      <div className="rounded-t-2xl bg-[#1f6b3a] px-5 py-4 sm:px-6">
        <h2 className="text-lg font-bold tracking-tight text-white sm:text-xl">{heading}</h2>
      </div>

      <div className="px-5 py-5 sm:px-6">
        {showHint && (
          <p className="mb-3.5 text-[13px] leading-relaxed text-gray-600">
            If there isn&rsquo;t an adequate suggestion, select{" "}
            <strong className="font-semibold text-gray-700">
              &ldquo;Other &ndash; My item isn&rsquo;t listed&rdquo;
            </strong>{" "}
            and enter the item&rsquo;s category. You can provide details later.
          </p>
        )}

        <label className="mb-2 block text-[11px] font-bold uppercase tracking-[0.07em] text-gray-600">
          Your item
        </label>

        {/* Champ et bouton sur une ligne dès que la largeur le permet :
            une seule question n'a pas besoin de deux lignes. */}
        <div className="flex flex-col gap-2.5 sm:flex-row sm:items-start sm:gap-3">
          <div className="min-w-0 flex-1" onMouseEnter={prefetch} onFocus={prefetch}>
            {/* Le même composant de suggestions que l'étape 1 du formulaire. */}
            <ObjectSuggest value={item} onChange={setItem} inline />
          </div>

          <button
            type="button"
            onClick={() => router.push(reportUrl())}
            onMouseEnter={prefetch}
            className="inline-flex flex-none items-center justify-center rounded-lg bg-gradient-to-r from-[#26723e] to-[#2ea052] px-5 py-2.5 font-semibold text-white shadow hover:from-[#226638] hover:to-[#279449] sm:py-3"
          >
            Continue →
          </button>
        </div>

        <p className="mt-3.5 border-t border-gray-100 pt-3 text-[11.5px] leading-relaxed text-gray-500">
          Publishing your report is free and your details stay private. The assisted search is a
          separate paid service, described in the{" "}
          <a href="/terms" className="text-blue-700 underline underline-offset-2">
            Terms
          </a>
          .
        </p>
      </div>
    </div>
  );
}
