"use client";

import { useMemo, useState, useEffect, useRef } from "react";

/**
 * ReportContribution.tsx — 3 Plans + Optional Tip (English version)
 */

type Props = {
  amount?: number;
  contribution?: number;
  setFormData: (fn: (prev: any) => any) => void;
  onBack: () => void;
  onNext: () => void;
  referenceCode?: string;
  initialStep?: "plans" | "tip";
  initialPlan?: 1 | 2 | 3;
  initialTip?: number;
};

const DARK_GREEN = "#1f6b3a";
const LIGHT_GREEN_BG = "#eaf8ef";
const ASSET_VER = "1";
const MAX_TIP = 50;

// ---------------------------------------------------------------------------
// Small green check icon for bullet points
function BulletIcon() {
  return (
    <img
      src={`/images/icons/coche.svg?v=${ASSET_VER}`}
      alt="Check"
      className="w-5 h-5"
      style={{
        filter:
          "invert(41%) sepia(22%) saturate(1901%) hue-rotate(85deg) brightness(92%) contrast(90%)",
      }}
    />
  );
}

// ---------------------------------------------------------------------------
// Custom Heart Gauge with emoji at 0 and dynamic message
// ---------------------------------------------------------------------------
function TipGauge({
  value,
  setValue,
  useHeartIcon = false, // ✅ icône 💚 si plan 1 (zéro)
}: {
  value: number;
  setValue: (n: number) => void;
  useHeartIcon?: boolean;
}) {
  const trackRef = useRef<HTMLDivElement | null>(null);
  const clamp = (n: number) => Math.max(0, Math.min(MAX_TIP, Math.round(n)));

  const setFromClientX = (clientX: number) => {
    const el = trackRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const pct = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
    const next = clamp(pct * MAX_TIP);
    setValue(next);
  };

  const onPointerDown = (e: React.PointerEvent) => {
    (e.target as HTMLElement).setPointerCapture?.(e.pointerId);
    setFromClientX(e.clientX);
  };
  const onPointerMove = (e: React.PointerEvent) => {
    if ((e.buttons & 1) !== 1) return;
    setFromClientX(e.clientX);
  };

  const pct = (value / MAX_TIP) * 100;
  const heartScale = 1 + (value / MAX_TIP) * 0.6;

  // --- Determine level and dynamic message ---
  let level = 1 as 1 | 2 | 3;
  let message = "";
  let messageIntro = "";
  if (value < 15) {
    level = 1;
    messageIntro = "Your report will be published and visible in our public database. ";
    message =
      "It may, depending on our team’s availability, receive occasional manual research (not guaranteed).";
  } else if (value < 25) {
    level = 2;
    message =
      "You activate manual research and dissemination to authorities and local groups by a team member.";
  } else {
    level = 3;
    message =
      "You benefit from full human follow-up, priority visibility, and an extended visibility campaign.";
  }

  return (
    <div className="rounded-2xl border border-green-200 overflow-hidden bg-white">
      <div
        className="flex items-center gap-3 px-5 py-3"
        style={{ backgroundColor: LIGHT_GREEN_BG }}
      >
        {/* ✅ cœur vert si plan 1, sinon icône levels */}
        {useHeartIcon ? (
          <span className="text-xl" aria-hidden>
            💚
          </span>
        ) : (
          <img
            src={`/images/levels.svg?v=${ASSET_VER}`}
            alt="Levels"
            width={20}
            height={20}
            style={{
              filter:
                "invert(48%) sepia(38%) saturate(845%) hue-rotate(80deg) brightness(92%) contrast(90%)",
            }}
          />
        )}
        <h3 className="text-lg font-semibold" style={{ color: DARK_GREEN }}>
          Support the community (optional)
        </h3>
      </div>

      <div className="px-5 py-4">
        <div className="text-sm text-gray-700">
          <strong className="text-green-800">
            Level {level} {level === 1 ? "(Standard)" : level === 2 ? "(Extended)" : "(Complete)"}:
          </strong>{" "}
        {level === 1 ? (
            <>
              {messageIntro}
              <strong>{message}</strong>
            </>
          ) : (
            message
          )}
        </div>

        <div className="mt-5">
          <div
            ref={trackRef}
            className="relative h-6 select-none mx-2 sm:mx-6 md:mx-10"
            onPointerDown={onPointerDown}
            onPointerMove={onPointerMove}
          >
            <div className="absolute inset-y-0 my-auto h-2 w-full rounded-full bg-gray-200" />
            <div
              className="absolute inset-y-0 my-auto h-2 rounded-full"
              style={{ width: `${pct}%`, backgroundColor: DARK_GREEN }}
            />
            <div
              role="slider"
              aria-valuemin={0}
              aria-valuemax={MAX_TIP}
              aria-valuenow={value}
              tabIndex={0}
              className="absolute -top-2.5"
              style={{ left: `calc(${pct}% - 14px)` }}
              onKeyDown={(e) => {
                if (e.key === "ArrowLeft") setValue(clamp(value - 1));
                if (e.key === "ArrowRight") setValue(clamp(value + 1));
                if (e.key === "Home") setValue(0);
                if (e.key === "End") setValue(MAX_TIP);
              }}
            >
              <div
                className="w-7 h-7 flex items-center justify-center"
                style={{ transform: `scale(${heartScale})` }}
              >
                {value === 0 ? (
                  <div className="text-2xl" aria-hidden>
                    <span role="img" aria-label="sad">
                      🙁
                    </span>
                  </div>
                ) : (
                  <svg viewBox="0 0 24 24" className="drop-shadow" width={28} height={28}>
                    <path
                      d="M12 21s-6.716-4.188-9.39-7.07C.97 11.18 1.41 7.87 3.86 6.26c2.05-1.35 4.81-.86 6.14 1.03 1.33-1.89 4.09-2.38 6.14-1.03 2.45 1.61 2.89 4.92 1.25 7.67C18.72 16.81 12 21 12 21z"
                      fill="#e11d48"
                    />
                  </svg>
                )}
              </div>
            </div>
          </div>

          <div className="mt-4 flex flex-wrap items-center gap-3">
            <label className="text-sm text-gray-700">Amount:</label>
            <div className="flex items-center gap-1">
              <span className="text-gray-600">$</span>
              <input
                inputMode="numeric"
                pattern="[0-9]*"
                aria-label="Donation amount"
                className="w-24 rounded-md border border-gray-300 px-3 py-1.5 text-gray-800 focus:outline-none focus:ring-2 focus:ring-green-300"
                value={value}
                onChange={(e) => {
                  const raw = e.target.value.replace(/[^0-9]/g, "");
                  setValue(clamp(Number(raw)));
                }}
              />
            </div>

            <div className="flex flex-wrap gap-2 ml-2">
              {[5, 10, 20, 30].map((v) => (
                <button
                  key={v}
                  type="button"
                  onClick={() => setValue(v)}
                  className="px-3 py-1.5 text-sm rounded-full border border-gray-300 hover:bg-gray-50"
                >
                  ${v}
                </button>
              ))}
              <button
                type="button"
                onClick={() => setValue(0)}
                className="px-3 py-1.5 text-sm rounded-full border border-gray-300 hover:bg-gray-50"
              >
                None
              </button>
            </div>
          </div>

          <p className="text-xs text-gray-500 mt-2">Maximum: $50.</p>
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------
export default function ReportContribution({
  amount,
  contribution,
  setFormData,
  onBack,
  onNext,
  initialPlan,
  initialStep,
  initialTip,
}: Props) {
  const effectiveAmount = useMemo(
    () =>
      Number.isFinite(Number(amount ?? contribution))
        ? Number(amount ?? contribution)
        : 0,
    [amount, contribution]
  );

  // ✅ Prices updated to requested values: 0 / 12 / 25
  const PRICE = { 1: 0, 2: 12, 3: 25 } as const;

  // Default: preselect plan 2
  const [step, setStep] = useState<"plans" | "tip">(initialStep ?? "plans");
  const [selectedPlan, setSelectedPlan] = useState<1 | 2 | 3>(initialPlan ?? 2);
  const [tip, setTip] = useState<number>(
    Math.max(0, Math.min(MAX_TIP, Math.round(initialTip ?? 0)))
  );

  useEffect(() => {
    if (initialPlan || initialStep) return;
    if (effectiveAmount === PRICE[2]) setSelectedPlan(2);
    else if (effectiveAmount === PRICE[3]) setSelectedPlan(3);
    else setSelectedPlan(2);
  }, [effectiveAmount, initialPlan, initialStep]);

  useEffect(() => {
    if (typeof window !== "undefined") {
      window.scrollTo({ top: 0, behavior: "instant" as ScrollBehavior });
    }
  }, []);
  useEffect(() => {
    if (typeof window !== "undefined") {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  }, [step]);

  const proceed = () => {
    if (selectedPlan === 1) {
      setFormData((prev: any) => ({ ...prev, contribution: 0 }));
      setStep("tip");
      return;
    }
    const contribution = PRICE[selectedPlan];
    setFormData((prev: any) => ({ ...prev, contribution, paymentRequired: contribution > 0 }));
    onNext();
  };

  const cardClass = (active: boolean) =>
    `rounded-2xl border overflow-hidden bg-white transition shadow-sm ${
      active
        ? "border-green-500 ring-2 ring-green-300/70 bg-green-50"
        : "border-green-200 hover:border-green-300"
    }`;

  const selectCard = (plan: 1 | 2 | 3) => setSelectedPlan(plan);

  const showPlanHeader = selectedPlan !== 1; // ✅ cacher le titre si plan 1

  return (
    <section className="px-3 sm:px-4 md:px-6">
      <div className="max-w-3xl mx-auto">
        {showPlanHeader && (
          <div className="flex items-center justify-center gap-2 text-gray-700 mb-3">
            <img
              src={`/images/levels.svg?v=${ASSET_VER}`}
              alt="Levels icon"
              width={26}
              height={26}
              className="opacity-90"
              style={{
                filter:
                  "invert(48%) sepia(38%) saturate(845%) hue-rotate(80deg) brightness(92%) contrast(90%)",
              }}
            />
            <h2 className="text-2xl font-bold text-gray-700 text-center">
              Choose your plan
            </h2>
          </div>
        )}

        {/* Intro box */}
        <div className="rounded-2xl border border-green-200 overflow-hidden mb-4 bg-white">
          <div className="px-5 py-4 bg-white text-center">
            {selectedPlan === 1 ? (
              // ✅ phrase spécifique avec cœur si plan 1 (zéro)
              <p className="text-[15px] text-gray-700">
                Help us process every report with a small contribution <span aria-hidden>💚</span>
              </p>
            ) : (
              <p className="text-[15px] text-gray-700">
                Your contribution finances the <b>verification</b>, <b>distribution</b> and <b>search</b> of your report by a team member.
              </p>
            )}
          </div>
        </div>

        {/* Step: Plans */}
        {step === "plans" && (
          <div className="grid gap-4">
            {/* Plan 3 — Maximum search (TOP) */}
            <div className={cardClass(selectedPlan === 3)} onClick={() => selectCard(3)}>
              <div
                className="flex items-center gap-3 px-5 py-3"
                style={{ backgroundColor: LIGHT_GREEN_BG }}
              >
                <img
                  src={`/images/icons/max.svg?v=${ASSET_VER}`}
                  alt="Maximum search"
                  className="w-5 h-5"
                />
                <h3 className="text-xl font-semibold" style={{ color: DARK_GREEN }}>
                  Maximum search
                </h3>
              </div>
              <div className="px-5 py-4">
                {/* ✅ liste d’icônes level 3 (corrigée) */}
                <div className="flex flex-wrap items-center gap-2 mb-3">
                  {[
                    "information.svg",
                    "ai-search.svg",
                    "map-us.svg",
                    "contact.svg",
                    "database.svg",
                    "megaphone.svg",
                    "phone.svg",
                    "report.svg",
                    "facebook.svg",
                    "file.svg",
                    "globalsearch.svg",
                    "gmail.svg",
                    "google-maps.svg",
                    "checkplateform.svg",
                    "locations.svg",
                    "x.svg",
                    "lostfoundservice.svg",
                    "pinterest.svg",
                    "safari.png",
                    "big-data.svg",
                    "feedback.svg",
                    "telegramme.svg",
                    "tiktok.svg",
                    "twitter.png",
                    "yahoo.svg",
                    "contacts.png",
                    "localisation.svg",
                    "mail-anonyme.svg",
                    "manualcheck.svg",
                    "datasearch.svg",
                    "web.svg",
                    "geolocalisation.svg",
                  ].map((icon) => (
                    <img
                      key={icon}
                      src={`/images/icons/level3/${icon}?v=${ASSET_VER}`}
                      alt={icon.replace(/\.(svg|png)$/i, "")}
                      className="w-4 h-4 object-contain"
                    />
                  ))}
                </div>

                <ul className="space-y-3">
                  <li className="flex items-start gap-3">
                    <BulletIcon />
                    <span className="text-gray-800">
                      {/* ✅ remplacer le début de la phrase */}
                      complete assistance. Our team manually distributes your report through the right channels, tracks it over time and helps you until resolution.
                    </span>
                  </li>
                </ul>
                <div className="mt-4 flex items-center justify-between">
                  <span className="text-gray-700 font-medium">Search fee: $25</span>
                </div>
              </div>
            </div>

            {/* Plan 2 — Extended search (MIDDLE, preselected) */}
            <div className={cardClass(selectedPlan === 2)} onClick={() => selectCard(2)}>
              <div
                className="flex items-center gap-3 px-5 py-3"
                style={{ backgroundColor: LIGHT_GREEN_BG }}
              >
                <img
                  src={`/images/icons/search.svg?v=${ASSET_VER}`}
                  alt="Extended"
                  className="w-5 h-5"
                />
                <h3 className="text-xl font-semibold flex items-center gap-2" style={{ color: DARK_GREEN }}>
                  Extended search <span className="text-xs font-semibold text-[#1f6b3a] bg-green-100 border border-green-200 px-2 py-0.5 rounded-full">🏅 Most popular</span>
                </h3>
              </div>
              <div className="px-5 py-4">
                {/* liste d’icônes (inchangée) */}
                <div className="flex flex-wrap items-center gap-2 mb-3">
                  {[
                    "meta.svg",
                    "lostfoundservice.svg",
                    "manual-search.svg",
                    "web.svg",
                    "informations.svg",
                    "google-maps.svg",
                    "ai-search.svg",
                    "contact.svg",
                    "safari.png",
                    "telegramme.svg",
                    "yahoo.svg",
                    "datasearch.svg",
                    "facebook.svg",
                  ].map((icon) => (
                    <img
                      key={icon}
                      src={`/images/icons/level2/${icon}?v=${ASSET_VER}`}
                      alt={icon.replace(/\.(svg|png)$/i, "")}
                      className="w-4 h-4 object-contain"
                    />
                  ))}
                </div>

                <ul className="space-y-3">
                  <li className="flex items-start gap-3">
                    <BulletIcon />
                    <span className="text-gray-800">
                      AI and Manual research, dissemination to authorities and local groups
                    </span>
                  </li>
                  <li className="flex items-start gap-3">
                    <BulletIcon />
                    <span className="text-gray-800">Recommended for all types of lost items</span>
                  </li>
                </ul>
                <div className="mt-4 flex items-center justify-between">
                  <span className="text-gray-700 font-medium">Search fee: $12</span>
                </div>
              </div>
            </div>

            {/* Plan 1 — Standard (BOTTOM) */}
            <div className={cardClass(selectedPlan === 1)} onClick={() => selectCard(1)}>
              <div
                className="flex items-center gap-3 px-5 py-3"
                style={{ backgroundColor: LIGHT_GREEN_BG }}
              >
                <img
                  src={`/images/icons/search.svg?v=${ASSET_VER}`}
                  alt="Standard"
                  className="w-5 h-5"
                />
                <h3 className="text-xl font-semibold" style={{ color: DARK_GREEN }}>
                  Standard (Free)
                </h3>
              </div>
              <div className="px-5 py-4">
                <div className="flex flex-wrap items-center gap-2 mb-3">
                  {["information.svg", "google.svg"].map((icon) => (
                    <img
                      key={icon}
                      src={`/images/icons/level1/${icon}?v=${ASSET_VER}`}
                      alt={icon.replace(/\.(svg|png)$/i, "")}
                      className="w-4 h-4 object-contain"
                    />
                  ))}
                </div>

                <ul className="space-y-3">
                  <li className="flex items-start gap-3">
                    <BulletIcon />
                    <span className="text-gray-800">
                      Public publication in our open database, because every report count.
                    </span>
                  </li>
                </ul>
                <div className="mt-4 flex items-center justify-between">
                  <span className="text-gray-700 font-medium">Search fee: $0</span>
                </div>
              </div>
            </div>

            {/* Footer controls */}
            <div className="mt-2 flex items-center justify-between">
              <button
                type="button"
                onClick={onBack}
                className="px-4 py-2 rounded-md border border-gray-300 text-gray-800 hover:bg-gray-50"
              >
                Back
              </button>
              <button
                type="button"
                onClick={proceed}
                className="inline-flex items-center justify-center px-5 py-2.5 rounded-md text-white font-semibold bg-gradient-to-r from-[#26723e] to-[#2ea052] hover:from-[#226638] hover:to-[#279449]"
              >
                Continue
              </button>
            </div>

            <p className="flex items-center gap-2 text-sm text-gray-600 mt-6 ml-1">
              <img src={`/images/icons/secure.svg?v=${ASSET_VER}`} alt="Secure" className="w-4 h-4" />
              Payments are processed securely by Stripe.com — PCI DSS v4.0 certified.
            </p>
          </div>
        )}

        {/* Step: Tip */}
        {step === "tip" && (
          <div className="grid gap-4">
            {/* ✅ cœur seulement si plan 1 */}
            <TipGauge value={tip} setValue={setTip} useHeartIcon={selectedPlan === 1} />
            <p className="flex items-center gap-2 text-sm text-gray-600 mt-1 ml-1">
              <img src={`/images/icons/secure.svg?v=${ASSET_VER}`} alt="Secure" className="w-4 h-4" />
              Payments are processed securely by Stripe.com — PCI DSS v4.0 certified.
            </p>
            <div className="mt-2 flex items-center justify-between">
              <button
                type="button"
                onClick={() => setStep("plans")}
                className="px-4 py-2 rounded-md border border-gray-300 text-gray-800 hover:bg-gray-50"
              >
                Back
              </button>
              <button
                type="button"
                onClick={() => {
                  const contribution = Math.max(0, Math.min(MAX_TIP, Math.round(tip)));
                  let level: 1 | 2 | 3 = 1;
                  if (contribution >= 15 && contribution < 25) level = 2;
                  else if (contribution >= 25) level = 3;
                  setFormData((prev: any) => ({
                    ...prev,
                    contribution,
                    level,
                    paymentRequired: contribution > 0,
                  }));
                  onNext();
                }}
                className="inline-flex items-center justify-center px-5 py-2.5 rounded-md text-white font-semibold bg-gradient-to-r from-[#26723e] to-[#2ea052] hover:from-[#226638] hover:to-[#279449]"
              >
                Activate my search
              </button>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
