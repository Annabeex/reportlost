"use client";

import { useEffect, useMemo, useState } from "react";

type Props = {
  amount?: number;
  contribution?: number;
  setFormData: (fn: (prev: any) => any) => void;
  onBack: () => void;
  onNext: () => void;
  referenceCode?: string;
};

const DARK_GREEN = "#1f6b3a";
const ACTIVE_GREEN = "#2ea052";
const LIGHT_GREEN_BG = "#eaf8ef";
// Cache-bust (même logique que pour le level 3)
const ASSET_VER = "1";

/* Icône coche.svg (verte, sans contour) */
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

export default function ReportContribution({
  amount,
  contribution,
  setFormData,
  onBack,
  onNext,
}: Props) {
  const effectiveAmount = useMemo(
    () => (Number.isFinite(Number(amount ?? contribution)) ? Number(amount ?? contribution) : 0),
    [amount, contribution]
  );

  const [level, setLevel] = useState<1 | 2 | 3>(1);
  useEffect(() => {
    if (effectiveAmount === 12) setLevel(1);
    else if (effectiveAmount === 20) setLevel(2);
    else if (effectiveAmount === 30) setLevel(3);
  }, [effectiveAmount]);

  const priceForLevel = (lvl: 1 | 2 | 3) => (lvl === 1 ? 12 : lvl === 2 ? 20 : 30);
  const activate = () => {
    const price = priceForLevel(level);
    setFormData((prev: any) => ({ ...prev, contribution: price }));
    onNext();
  };

  return (
    <section className="px-4 sm:px-6 md:px-8">
      <div className="max-w-3xl mx-auto">
        {/* ======= TITRE PRINCIPAL ======= */}
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
            Select your search level & Publish
          </h2>
        </div>

        {/* Box intro */}
        <div className="rounded-2xl border border-green-200 overflow-hidden mb-4 bg-white">
          <div className="px-5 py-4 bg-white">
            <p className="text-[15px] text-gray-700">
              Your contribution finances the <b>verification</b>, <b>distribution</b> and <b>search</b> of your report by a team member.
            </p>
            <p className="mt-2 text-[15px] text-gray-700">
              To better assist you, our team performs searches tailored to your situation. Our members work in shifts <b>7 days a week</b> to ensure rapid dissemination of reports.
            </p>
          </div>
        </div>

        {/* Jauge */}
        <div className="relative mb-8">
          <div className="relative mx-8 h-8">
            <div className="absolute left-0 right-0 top-1/2 -translate-y-1/2 h-2 rounded-full bg-gray-200 z-0" />
            <div className="absolute left-0 right-0 top-1/2 -translate-y-1/2 flex justify-between items-center z-10">
              {[1, 2, 3].map((lvl) => (
                <button
                  key={lvl}
                  type="button"
                  onClick={() => setLevel(lvl as 1 | 2 | 3)}
                  className="w-6 h-6 rounded-full border-2 border-[#1f6b3a] focus:outline-none"
                  style={{ backgroundColor: level === lvl ? ACTIVE_GREEN : "#ffffff" }}
                  aria-label={`Level ${lvl}`}
                />
              ))}
            </div>
          </div>
          <div className="flex justify-between text-gray-600 text-sm mt-2 mx-8">
            <span>Level 1</span>
            <span>Level 2</span>
            <span>Level 3</span>
          </div>
        </div>

        {/* ===== Level 1 ===== */}
        {level === 1 && (
          <div className="rounded-2xl border border-green-200 overflow-hidden mb-4 bg-white">
            <div className="flex items-center gap-3 px-5 py-3" style={{ backgroundColor: LIGHT_GREEN_BG }}>
              <img src={`/images/icons/search.svg?v=${ASSET_VER}`} alt="Search" className="w-5 h-5" />
              <h3 className="text-xl font-semibold" style={{ color: DARK_GREEN }}>
                Level 1 : Standard search
              </h3>
            </div>

            <div className="px-5 py-4">
              <div className="flex flex-wrap items-center gap-2 mb-3">
                {[
                  "information.svg",
                  "facebook.svg",
                  "ai-search.svg",
                  "big-data.svg",
                  "map-us.svg",
                  "google.svg",
                  "info.svg",
                ].map((icon) => (
                  <img
                    key={icon}
                    src={`/images/icons/level1/${icon}?v=${ASSET_VER}`}
                    alt={icon.replace(/\.(svg|png)$/i, "")}
                    className="w-4 h-4 object-contain"
                  />
                ))}
              </div>

              <ul className="space-y-3 mt-5">
                <li className="flex items-start gap-3">
                  <BulletIcon />
                  <span className="text-gray-800">Recommended for common lost items</span>
                </li>
                <li className="flex items-start gap-3">
                  <BulletIcon />
                  <span className="text-gray-800">Search fee: $12</span>
                </li>
              </ul>
            </div>
          </div>
        )}

        {/* ===== Level 2 ===== */}
        {level === 2 && (
          <div className="rounded-2xl border border-green-200 overflow-hidden mb-4 bg-white">
            <div className="flex items-center gap-3 px-5 py-3" style={{ backgroundColor: LIGHT_GREEN_BG }}>
              <img src={`/images/icons/search.svg?v=${ASSET_VER}`} alt="Search" className="w-5 h-5" />
              <h3 className="text-xl font-semibold" style={{ color: DARK_GREEN }}>
                Level 2 : Extended search
              </h3>
            </div>

            <div className="px-5 py-4">
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

              <ul className="space-y-3 mt-5">
                <li className="flex items-start gap-3">
                  <BulletIcon />
                  <span className="text-gray-800">Recommended for all types of lost items</span>
                </li>
                <li className="flex items-start gap-3">
                  <BulletIcon />
                  <span className="text-gray-800">Search fee: $20</span>
                </li>
              </ul>
            </div>
          </div>
        )}

        {/* ===== Level 3 ===== */}
        {level === 3 && (
          <div className="rounded-2xl border border-green-200 overflow-hidden mb-4 bg-white">
            <div className="flex items-center gap-3 px-5 py-3" style={{ backgroundColor: LIGHT_GREEN_BG }}>
              <img src={`/images/icons/max.svg?v=${ASSET_VER}`} alt="Maximum" className="w-5 h-5" />
              <h3 className="text-xl font-semibold" style={{ color: DARK_GREEN }}>
                Level 3 : Maximum search
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

              <ul className="space-y-3 mt-5">
                <li className="flex items-start gap-3">
                  <BulletIcon />
                  <span className="text-gray-800">Priority visibility & extended outreach</span>
                </li>
                <li className="flex items-start gap-3">
                  <BulletIcon />
                  <span className="text-gray-800">Recommended for high-value items</span>
                </li>
                <li className="flex items-start gap-3">
                  <BulletIcon />
                  <span className="text-gray-800">Search fee: $30</span>
                </li>
              </ul>
            </div>
          </div>
        )}

        <p className="flex items-center gap-2 text-sm text-gray-600 mt-6 ml-8">
          <img src={`/images/icons/secure.svg?v=${ASSET_VER}`} alt="Secure" className="w-4 h-4" />
          Payments are processed securely by Stripe.com — PCI DSS v4.0 certified.
        </p>

        <div className="mt-4 flex items-center justify-between">
          <button
            type="button"
            onClick={onBack}
            className="px-4 py-2 rounded-md border border-gray-300 text-gray-800 hover:bg-gray-50"
          >
            Back
          </button>
          <button
            type="button"
            onClick={activate}
            className="inline-flex items-center justify-center px-5 py-2.5 rounded-md text-white font-semibold bg-gradient-to-r from-[#26723e] to-[#2ea052] hover:from-[#226638] hover:to-[#279449]"
          >
            Activate my search →
          </button>
        </div>
      </div>
    </section>
  );
}
