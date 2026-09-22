"use client";

import { useEffect, useMemo, useState } from "react";

/**
 * ReportContribution.tsx — Standard (Free) + Automatic search + Active search
 *
 * Deux écrans, dans le même composant :
 *
 *   "plans" — les trois formules. La formule à 12 $ n'est plus réservée au
 *             rattrapage : elle est visible d'emblée, avec une frontière nette
 *             (le 12 $ est la machine seule, le 25 $ est ce qu'une personne
 *             fait). L'ancienne crainte de cannibalisation n'est pas confirmée
 *             par les chiffres : sur la période où les trois formules étaient
 *             affichées, la recette par dépôt était PLUS élevée qu'avec deux.
 *
 *   "gauge" — montré uniquement à qui choisit le gratuit. Il accuse réception
 *             sans rien célébrer, et propose une dernière fois de monter d'un
 *             cran. Le mégaphone grossit et gagne une onde à chaque palier :
 *             ce qu'on achète, c'est de la portée. (L'ancienne jauge en forme
 *             de cœur collectait un pourboire libre : 22 $ en huit mois, tous
 *             sous 15 $, tous posés sur des annonces gratuites. Ce n'était pas
 *             un don, c'était une négociation. Les crans sont donc fixes.)
 *
 * La version à deux formules est conservée dans
 * components/ReportContribution.avant-3-formules.tsx.bak.
 */

type Props = {
  amount?: number;
  contribution?: number;
  setFormData: (fn: (prev: any) => any) => void;
  onBack: () => void;
  onNext: () => void;
  referenceCode?: string;
  /** ✅ Mode animaux perdus : Pet Priority (25 $) + option gratuite */
  petMode?: boolean;
  /**
   * Lien de rattrapage `?offer=auto` envoyé après un dépôt gratuit. La carte à
   * 12 $ étant désormais toujours visible, ce drapeau ne sert plus qu'à la
   * PRÉSÉLECTIONNER.
   */
  showAutoPlan?: boolean;
};

const DARK_GREEN = "#1f6b3a";
const LIGHT_GREEN_BG = "#eaf8ef";
const ASSET_VER = "1";

/* ───────────────────────── Jauge : icônes par palier ─────────────────────── */




function Check({ className = "" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2.5}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className={className}
    >
      <path d="M5 13l4 4L19 7" />
    </svg>
  );
}

/** Mégaphone du curseur : il grossit, et gagne une onde par palier. */

export default function ReportContribution({
  amount,
  contribution,
  setFormData,
  onBack,
  onNext,
  petMode = false,
  showAutoPlan = false,
}: Props) {
  const effectiveAmount = useMemo(
    () =>
      Number.isFinite(Number(amount ?? contribution)) ? Number(amount ?? contribution) : 0,
    [amount, contribution]
  );

  const PRICE = { 1: 0, 2: 12, 3: 25, 4: 25 } as const;

  // Présélection : la formule complète, sauf arrivée par le lien de rattrapage.
  const [selectedPlan, setSelectedPlan] = useState<1 | 2 | 3 | 4>(
    petMode ? 4 : showAutoPlan ? 2 : 3
  );

  useEffect(() => {
    // Retour en arrière depuis le paiement : on réaffiche ce qui avait été choisi.
    if (petMode) {
      setSelectedPlan(4);
      return;
    }
    if (effectiveAmount === 12) {
      setSelectedPlan(2);
      return;
    }
    if (effectiveAmount === 0) {
      setSelectedPlan(showAutoPlan ? 2 : 1);
      return;
    }
    setSelectedPlan(3);
  }, [effectiveAmount, petMode, showAutoPlan]);

  useEffect(() => {
    if (typeof window !== "undefined") {
      window.scrollTo({ top: 0, behavior: "instant" as ScrollBehavior });
    }
  }, []);

  const commit = (value: number) => {
    setFormData((prev: any) => ({
      ...prev,
      contribution: value,
      paymentRequired: value > 0,
    }));
    onNext();
  };

  const proceed = () => {
    // « Free » mene directement a l'ecran final (etape 5 de ReportForm), qui
    // confirme la publication, envoie le mail et presente la jauge de relance.
    // L'ancien ecran intermediaire faisait perdre le mail a qui s'y arretait.
    commit(PRICE[selectedPlan]);
  };

  const cardClass = (active: boolean) =>
    `rounded-2xl border bg-white overflow-hidden shadow-sm transition cursor-pointer ${
      active
        ? "border-green-500 ring-[3px] ring-green-300/60 bg-green-50/40"
        : "border-green-200 hover:border-green-300"
    }`;

  const Radio = ({ plan, label }: { plan: 1 | 2 | 3 | 4; label: string }) => (
    <input
      type="radio"
      name="report-plan"
      value={plan}
      checked={selectedPlan === plan}
      onChange={() => setSelectedPlan(plan)}
      aria-label={label}
      className="h-[18px] w-[18px] flex-none accent-[#1f6b3a]"
    />
  );

  const Fee = ({ value }: { value: number }) => (
    <div className="mt-4 border-t border-gray-100 pt-3 text-[14.5px] font-medium text-gray-700">
      Search fee: ${value}
    </div>
  );

  /* ────────────────────────────── Écran 1 : formules ─────────────────────── */

  return (
    <section className="px-3 sm:px-4 md:px-6">
      <div className="mx-auto max-w-3xl">
        <h2 className="mb-4 text-center text-2xl font-bold text-gray-700">Choose your plan</h2>

        <div className="mb-4 rounded-2xl border border-green-200 bg-white px-5 py-4 text-center text-[15px] leading-relaxed text-gray-700">
          With <b className="text-gray-900">Active search</b>, a team member files your report with
          the lost-property service and contacts the places that may hold your item.
        </div>

        <div className="grid gap-4">
          {/* --- Pet Priority (25 $), mode animaux --- */}
          {petMode && (
            <div className={cardClass(selectedPlan === 4)} onClick={() => setSelectedPlan(4)}>
              <div
                className="flex items-center gap-3 px-5 py-3"
                style={{ backgroundColor: LIGHT_GREEN_BG }}
              >
                <Radio plan={4} label="Pet Priority search, $25" />
                <span className="text-xl">🐾</span>
                <h3
                  className="flex flex-wrap items-center gap-2 text-xl font-semibold"
                  style={{ color: DARK_GREEN }}
                >
                  Pet Priority search
                  <span className="rounded-full border border-green-200 bg-green-100 px-2 py-0.5 text-[11px] font-semibold text-[#1f6b3a]">
                    ⚡ Priority handling
                  </span>
                </h3>
              </div>
              <div className="px-5 py-4">
                <ul className="space-y-3">
                  <li className="flex items-start gap-3">
                    <Check className="mt-0.5 h-[19px] w-[19px] flex-none text-green-500" />
                    <span className="text-[14.5px] text-gray-800">
                      Our team contacts the local animal shelters, animal control and rescue
                      services, and the police where appropriate.
                    </span>
                  </li>
                  <li className="flex items-start gap-3">
                    <Check className="mt-0.5 h-[19px] w-[19px] flex-none text-green-500" />
                    <span className="text-[14.5px] text-gray-800">
                      A dedicated visual is published on local social channels,{" "}
                      <strong>including private lost pet groups our team belongs to</strong>. Your
                      report stays active for <strong>12 months</strong>, with a protected relay
                      email address.
                    </span>
                  </li>
                </ul>
                <Fee value={25} />
              </div>
            </div>
          )}

          {/* --- Active search (25 $) --- */}
          {!petMode && (
            <div className={cardClass(selectedPlan === 3)} onClick={() => setSelectedPlan(3)}>
              <div
                className="flex items-center gap-3 px-5 py-3"
                style={{ backgroundColor: LIGHT_GREEN_BG }}
              >
                <Radio plan={3} label="Active search, $25" />
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={`/images/icons/max.svg?v=${ASSET_VER}`} alt="" className="h-5 w-5" />
                <h3
                  className="flex flex-wrap items-center gap-2 text-xl font-semibold"
                  style={{ color: DARK_GREEN }}
                >
                  Active search
                  <span className="rounded-full border border-green-200 bg-green-100 px-2 py-0.5 text-[11px] font-semibold text-[#1f6b3a]">
                    🏅 Most popular
                  </span>
                </h3>
              </div>
              <div className="px-5 py-4">
                <ul className="space-y-3.5">
                  <li className="flex items-start gap-3">
                    <Check className="mt-0.5 h-[19px] w-[19px] flex-none text-green-500" />
                    <span className="text-[14.5px] leading-relaxed text-gray-800">
                      {/* <span> et non <p> : ce bloc est déjà dans un <span>,
                          et un paragraphe n'a pas le droit d'y vivre. */}
                      <span className="mb-2.5 block">
                        Our team manually distributes your report through the appropriate channels,
                        including relevant authorities and official services, and ensures continued
                        monitoring and follow-up actions when applicable.
                      </span>
                      <span className="block">
                        Our AI continuously scans large databases for potential matches for 12
                        months. Includes your dated loss report certificate, downloadable at any
                        time, and a printable PDF sheet of secure ID stickers.
                      </span>
                    </span>
                  </li>
                  <li className="flex items-start gap-3">
                    <Check className="mt-0.5 h-[19px] w-[19px] flex-none text-green-500" />
                    <span className="text-[14.5px] text-gray-800">
                      Recommended for valuable or sentimental items, and whenever time matters.
                    </span>
                  </li>
                </ul>
                <Fee value={25} />
              </div>
            </div>
          )}

          {/* --- Automatic search (12 $) --- */}
          {!petMode && (
            <div className={cardClass(selectedPlan === 2)} onClick={() => setSelectedPlan(2)}>
              <div
                className="flex items-center gap-3 px-5 py-3"
                style={{ backgroundColor: LIGHT_GREEN_BG }}
              >
                <Radio plan={2} label="Automatic search, $12" />
                <h3 className="text-xl font-semibold" style={{ color: DARK_GREEN }}>
                  Automatic search
                </h3>
              </div>
              <div className="px-5 py-4">
                <ul className="space-y-3.5">
                  <li className="flex items-start gap-3">
                    <Check className="mt-0.5 h-[19px] w-[19px] flex-none text-green-500" />
                    <span className="text-[14.5px] leading-relaxed text-gray-800">
                      The automated half of the work. Our system scans large databases and online
                      sources for potential matches during six months, and every credible match is
                      read by a team member before it reaches you.
                    </span>
                  </li>
                  <li className="flex items-start gap-3">
                    <Check className="mt-0.5 h-[19px] w-[19px] flex-none text-green-500" />
                    <span className="text-[14.5px] text-gray-800">
                      Recommended for all types of lost items.
                    </span>
                  </li>
                </ul>
                <Fee value={12} />
              </div>
            </div>
          )}

          {/* --- Standard (Free) --- */}
          <div className={cardClass(selectedPlan === 1)} onClick={() => setSelectedPlan(1)}>
            <div
              className="flex items-center gap-3 px-5 py-3"
              style={{ backgroundColor: LIGHT_GREEN_BG }}
            >
              <Radio plan={1} label="Standard, free" />
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={`/images/icons/search.svg?v=${ASSET_VER}`} alt="" className="h-5 w-5" />
              <h3 className="text-xl font-semibold" style={{ color: DARK_GREEN }}>
                Standard (Free)
              </h3>
            </div>
            <div className="px-5 py-4">
              <ul className="space-y-3.5">
                <li className="flex items-start gap-3">
                  <Check className="mt-0.5 h-[19px] w-[19px] flex-none text-green-500" />
                  <span className="text-[14.5px] text-gray-800">
                    Public publication in our open database, because every report counts.
                  </span>
                </li>
                {/* La seule ligne négative de l'écran, et elle est à sa place :
                    c'est ici que le malentendu coûte le plus cher. */}
                <li className="flex items-start gap-3">
                  <span className="mt-0.5 flex-none font-bold text-amber-700">—</span>
                  <span className="text-[14.5px] text-amber-700">
                    Nothing else happens: no filing, no outreach, no monitoring, no documents.
                  </span>
                </li>
              </ul>
              <Fee value={0} />
            </div>
          </div>

          <div className="mt-2 flex items-center justify-between gap-3">
            <button
              type="button"
              onClick={onBack}
              className="rounded-md border border-gray-300 px-4 py-2 text-gray-800 hover:bg-gray-50"
            >
              Back
            </button>
            <button
              type="button"
              onClick={proceed}
              className="inline-flex items-center justify-center rounded-md bg-gradient-to-r from-[#26723e] to-[#2ea052] px-5 py-2.5 font-semibold text-white hover:from-[#226638] hover:to-[#279449]"
            >
              Continue
            </button>
          </div>

          <p className="ml-1 mt-6 flex items-center gap-2 text-sm text-gray-600">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={`/images/icons/secure.svg?v=${ASSET_VER}`} alt="" className="h-4 w-4" />
            One-time payment, never a subscription. Processed securely by Stripe.com, PCI DSS v4.0
            certified.
          </p>
        </div>
      </div>
    </section>
  );
}
