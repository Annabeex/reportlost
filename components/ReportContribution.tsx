"use client";

import { useEffect, useMemo, useState } from "react";

/** Plan selector for the free listing, automatic search, and team-assisted search. */

type Props = {
  amount?: number;
  contribution?: number;
  setFormData: (fn: (prev: any) => any) => void;
  onBack: () => void;
  onNext: () => void;
  referenceCode?: string;
  onPlanSelected?: (event: string) => void;
  /** Lost-pet mode: free listing or $25 team-assisted search. */
  petMode?: boolean;
  /** Preselect automatic search for visitors who followed the optional offer link. */
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
  onPlanSelected,
  petMode = false,
  showAutoPlan = false,
}: Props) {
  const effectiveAmount = useMemo(
    () =>
      Number.isFinite(Number(amount ?? contribution)) ? Number(amount ?? contribution) : 0,
    [amount, contribution]
  );

  const PRICE = { 1: 0, 2: 12, 3: 25, 4: 25 } as const;

  // Start with the free listing unless a visitor followed an automatic-search offer link.
  const [selectedPlan, setSelectedPlan] = useState<1 | 2 | 3 | 4>(showAutoPlan && !petMode ? 2 : 1);

  useEffect(() => {
    // Retour en arrière depuis le paiement : on réaffiche ce qui avait été choisi.
    if (petMode) {
      setSelectedPlan(effectiveAmount > 0 ? 4 : 1);
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

  const choosePlan = (plan: 1 | 2 | 3 | 4) => {
    setSelectedPlan(plan);
    const event =
      plan === 1
        ? "form_plan_selected_free"
        : plan === 2
        ? "form_plan_selected_auto"
        : petMode && plan === 4
        ? "form_plan_selected_pet_assisted"
        : "form_plan_selected_assisted";
    onPlanSelected?.(event);
  };

  const commit = (value: number) => {
    setFormData((prev: any) => ({
      ...prev,
      contribution: value,
      paymentRequired: value > 0,
    }));
    onNext();
  };

  const proceed = () => {
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
      onChange={() => choosePlan(plan)}
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
        <h2 className="mb-4 text-center text-2xl font-bold text-gray-700">Choose a report option</h2>

        <div className="mb-4 rounded-2xl border border-green-200 bg-white px-5 py-4 text-center text-[15px] leading-relaxed text-gray-700">
          Compare what is included with each option. All paid prices are one-time fees.
        </div>

        <div className="grid gap-4">
          {/* --- Standard (Free) --- */}
          <div className={cardClass(selectedPlan === 1)} onClick={() => choosePlan(1)}>
            <div
              className="flex items-center gap-3 px-5 py-3"
              style={{ backgroundColor: LIGHT_GREEN_BG }}
            >
              <Radio plan={1} label="Standard, free" />
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={`/images/icons/search.svg?v=${ASSET_VER}`} alt="" className="h-5 w-5" />
              <h3 className="text-xl font-semibold" style={{ color: DARK_GREEN }}>
                Free public listing
              </h3>
            </div>
            <div className="px-5 py-4">
              <ul className="space-y-3.5">
                <li className="flex items-start gap-3">
                  <Check className="mt-0.5 h-[19px] w-[19px] flex-none text-green-500" />
                  <span className="text-[14.5px] text-gray-800">
                    Your report is published as a searchable public listing with a protected relay address.
                  </span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="mt-0.5 flex-none text-gray-500">—</span>
                  <span className="text-[14.5px] text-gray-600">
                    Search monitoring, team outreach, the certificate and QR sticker sheet are part of the paid options.
                  </span>
                </li>
              </ul>
              <Fee value={0} />
            </div>
          </div>

          {/* --- Team-assisted pet search (25 $), pet reports --- */}
          {petMode && (
            <div className={cardClass(selectedPlan === 4)} onClick={() => choosePlan(4)}>
              <div
                className="flex items-center gap-3 px-5 py-3"
                style={{ backgroundColor: LIGHT_GREEN_BG }}
              >
                  <Radio plan={4} label="Team-assisted pet search, $25" />
                <span className="text-xl">🐾</span>
                <h3
                  className="flex flex-wrap items-center gap-2 text-xl font-semibold"
                  style={{ color: DARK_GREEN }}
                >
                  Team-assisted pet search
                </h3>
              </div>
              <div className="px-5 py-4">
                <ul className="space-y-3">
                  <li className="flex items-start gap-3">
                    <Check className="mt-0.5 h-[19px] w-[19px] flex-none text-green-500" />
                    <span className="text-[14.5px] text-gray-800">
                      A team member contacts relevant local shelters, animal control and rescue
                      services where appropriate.
                    </span>
                  </li>
                  <li className="flex items-start gap-3">
                    <Check className="mt-0.5 h-[19px] w-[19px] flex-none text-green-500" />
                    <span className="text-[14.5px] text-gray-800">
                      A notice can be shared with relevant local groups using a protected relay
                      address. Public-web monitoring is included for <strong>12 months</strong>.
                    </span>
                  </li>
                </ul>
                <Fee value={25} />
              </div>
            </div>
          )}

          {/* --- Automatic search (12 $) --- */}
          {!petMode && (
            <div className={cardClass(selectedPlan === 2)} onClick={() => choosePlan(2)}>
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
                      Public-web monitoring runs for six months. Potential matches are reviewed
                      before notification.
                    </span>
                  </li>
                  <li className="flex items-start gap-3">
                    <Check className="mt-0.5 h-[19px] w-[19px] flex-none text-green-500" />
                    <span className="text-[14.5px] text-gray-800">
                      Includes a loss report certificate and printable QR sticker sheet.
                    </span>
                  </li>
                </ul>
                <Fee value={12} />
              </div>
            </div>
          )}

          {/* --- Team-assisted search (25 $) --- */}
          {!petMode && (
            <div className={cardClass(selectedPlan === 3)} onClick={() => choosePlan(3)}>
              <div
                className="flex items-center gap-3 px-5 py-3"
                style={{ backgroundColor: LIGHT_GREEN_BG }}
              >
                <Radio plan={3} label="Team-assisted search, $25" />
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={`/images/icons/max.svg?v=${ASSET_VER}`} alt="" className="h-5 w-5" />
                <h3
                  className="flex flex-wrap items-center gap-2 text-xl font-semibold"
                  style={{ color: DARK_GREEN }}
                >
                  Team-assisted search
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
                        A team member reviews your report and contacts relevant local services and
                        venues where appropriate. If an office requires the owner to file directly,
                        we provide its contact details and instructions.
                      </span>
                      <span className="block">
                        Public-web monitoring runs for 12 months. Potential matches are reviewed
                        before notification. The service also includes a dated loss report
                        certificate and a printable QR sticker sheet.
                      </span>
                    </span>
                  </li>
                  <li className="flex items-start gap-3">
                    <Check className="mt-0.5 h-[19px] w-[19px] flex-none text-green-500" />
                    <span className="text-[14.5px] text-gray-800">
                      Includes relevant local outreach in addition to public-web monitoring.
                    </span>
                  </li>
                </ul>
                <Fee value={25} />
              </div>
            </div>
          )}

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
