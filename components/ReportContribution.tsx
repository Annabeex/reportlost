"use client";

import { useMemo, useState, useEffect } from "react";

/**
 * ReportContribution.tsx — Free listing + Active search (single paid plan)
 */

type Props = {
  amount?: number;
  contribution?: number;
  setFormData: (fn: (prev: any) => any) => void;
  onBack: () => void;
  onNext: () => void;
  referenceCode?: string;
  /** ✅ Mode animaux perdus : Pet Priority (25$) + option gratuite */
  petMode?: boolean;
};

const DARK_GREEN = "#1f6b3a";
const LIGHT_GREEN_BG = "#eaf8ef";
const ASSET_VER = "1";

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
// Main component
// ---------------------------------------------------------------------------
export default function ReportContribution({
  amount,
  contribution,
  setFormData,
  onBack,
  onNext,
  petMode = false,
}: Props) {
  const effectiveAmount = useMemo(
    () =>
      Number.isFinite(Number(amount ?? contribution))
        ? Number(amount ?? contribution)
        : 0,
    [amount, contribution]
  );

  const PRICE = { 1: 0, 3: 25, 4: 25 } as const;

  // Présélection : la recherche active. L'utilisateur reste libre de choisir
  // l'annonce gratuite.
  const [selectedPlan, setSelectedPlan] = useState<1 | 3 | 4>(petMode ? 4 : 3);

  useEffect(() => {
    // Retour en arrière depuis le paiement : on réaffiche l'annonce gratuite
    // si c'est ce qui avait été choisi, sinon la recherche active.
    if (petMode) {
      setSelectedPlan(4);
      return;
    }
    setSelectedPlan(effectiveAmount === 0 ? 3 : 3);
  }, [effectiveAmount, petMode]);

  useEffect(() => {
    if (typeof window !== "undefined") {
      window.scrollTo({ top: 0, behavior: "instant" as ScrollBehavior });
    }
  }, []);

  const proceed = () => {
    const contribution = PRICE[selectedPlan];
    setFormData((prev: any) => ({
      ...prev,
      contribution,
      paymentRequired: contribution > 0,
    }));
    onNext();
  };

  const cardClass = (active: boolean) =>
    `rounded-2xl border overflow-hidden bg-white transition shadow-sm ${
      active
        ? "border-green-500 ring-2 ring-green-300/70 bg-green-50"
        : "border-green-200 hover:border-green-300"
    }`;

  const selectCard = (plan: 1 | 3 | 4) => setSelectedPlan(plan);

  const showPlanHeader = selectedPlan !== 1;

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
              Choose your search level
            </h2>
          </div>
        )}

        {/* Intro box */}
        <div className="rounded-2xl border border-green-200 overflow-hidden mb-4 bg-white">
          <div className="px-5 py-4 bg-white text-center">
            {selectedPlan === 1 ? (
              <p className="text-[15px] text-gray-700">
                A free listing stays online and waits to be found. Nothing is sent, contacted or searched.
              </p>
            ) : (
              <p className="text-[15px] text-gray-700">
                Your contribution finances the <b>verification</b>, <b>distribution</b> and <b>search</b> of your report by a team member.
              </p>
            )}
          </div>
        </div>

        {(
          <div className="grid gap-4">
            {/* Plan 4 — Pet Priority (25$) — uniquement en mode animaux */}
            {petMode && (
              <div className={cardClass(selectedPlan === 4)} onClick={() => selectCard(4)}>
                <div
                  className="flex items-center gap-3 px-5 py-3"
                  style={{ backgroundColor: LIGHT_GREEN_BG }}
                >
                  <span className="text-xl">🐾</span>
                  <h3 className="text-xl font-semibold flex items-center gap-2" style={{ color: DARK_GREEN }}>
                    Pet Priority search
                    <span className="text-xs font-semibold text-[#1f6b3a] bg-green-100 border border-green-200 px-2 py-0.5 rounded-full">
                      ⚡ Priority handling
                    </span>
                  </h3>
                </div>

                <div className="px-5 py-4">
                  <ul className="space-y-3">
                    <li className="flex items-start gap-3">
                      <BulletIcon />
                      <span className="text-gray-800">
                        Your case is treated as <strong>time-critical</strong>: our team contacts the local animal
                        shelters, animal control and rescue services (and the police where appropriate), the same day
                        whenever possible.
                      </span>
                    </li>
                    <li className="flex items-start gap-3">
                      <BulletIcon />
                      <span className="text-gray-800">
                        A dedicated visual is published on local social channels, <strong>including private lost pet
                        groups our team is a member of</strong>. Your report stays active for <strong>12 months</strong>,
                        searching for a match the whole time, with a protected relay email address.
                      </span>
                    </li>
                  </ul>

                  <div className="mt-4 flex items-center justify-between">
                    <span className="text-gray-700 font-medium">Search fee: $25</span>
                  </div>
                </div>
              </div>
            )}

            {/* Plan 3 — Active search (25$) — seule formule payante */}
            {!petMode && (
            <div className={cardClass(selectedPlan === 3)} onClick={() => selectCard(3)}>
              <div
                className="flex items-center gap-3 px-5 py-3"
                style={{ backgroundColor: LIGHT_GREEN_BG }}
              >
                <img
                  src={`/images/icons/max.svg?v=${ASSET_VER}`}
                  alt="Active search"
                  className="w-5 h-5"
                />
                <h3 className="text-xl font-semibold flex items-center gap-2" style={{ color: DARK_GREEN }}>
                  Active search
                  <span className="text-xs font-semibold text-[#1f6b3a] bg-green-100 border border-green-200 px-2 py-0.5 rounded-full">
                    🏅 Recommended
                  </span>
                </h3>
              </div>

              <div className="px-5 py-4">
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
                      <strong>Your report is filed with the competent lost-property service</strong>, usually the
                      local police department or the city lost-property office, as soon as we hold the information
                      that service requires. Where the rules oblige the owner to file in person, we send you the
                      exact office, link and steps.
                    </span>
                  </li>
                  <li className="flex items-start gap-3">
                    <BulletIcon />
                    <span className="text-gray-800">
                      <strong>The places likely to hold your item are contacted</strong>, selected from where you
                      lost it: transit operator, hotel, restaurant, venue, airport, taxi company, nearby shops and
                      the lost-property desks around it.
                    </span>
                  </li>
                  <li className="flex items-start gap-3">
                    <BulletIcon />
                    <span className="text-gray-800">
                      <strong>A visual notice is created and published</strong> on social media and in the relevant
                      local groups, private ones included. It carries an anonymous relay address tied to your case,
                      so finders reach you without seeing your personal email or phone number.
                    </span>
                  </li>
                  <li className="flex items-start gap-3">
                    <BulletIcon />
                    <span className="text-gray-800">
                      <strong>An AI search engine scans the web for 12 months</strong> on your item&rsquo;s keywords:
                      every day for the first week, then once a week, then once a month. Every credible match is
                      reviewed by a team member before it reaches you.
                    </span>
                  </li>
                  <li className="flex items-start gap-3">
                    <BulletIcon />
                    <span className="text-gray-800">
                      <strong>A loss report certificate</strong>, downloadable from your case page at any time. It
                      records your declaration and its date. It is not an official document and does not replace a
                      police report.
                    </span>
                  </li>
                  <li className="flex items-start gap-3">
                    <BulletIcon />
                    <span className="text-gray-800">
                      <strong>A printable sheet of QR stickers</strong> for your everyday belongings. Each code
                      routes a finder to your anonymous relay address.
                    </span>
                  </li>
                </ul>

                <div className="mt-4 flex items-center justify-between">
                  <span className="text-gray-700 font-medium">Search fee: $25</span>
                </div>
              </div>
            </div>
            )}

            {/* Plan 1 — Standard */}
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
                  Free listing
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
                      Your report is published in our public database and stays visible to finders.
                      No outreach, no police filing, no active match search: the listing waits for
                      someone to come across it.
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
              One-time payment, never a subscription. Processed securely by Stripe.com, PCI DSS v4.0 certified.
            </p>
          </div>
        )}

      </div>
    </section>
  );
}