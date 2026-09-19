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

const ICONS_AUTO = ["informations.svg", "ai-search.svg", "datasearch.svg"].map(
  (f) => `/images/icons/level2/${f}?v=${ASSET_VER}`
);

const ICONS_ACTIVE = [
  "information.svg", "ai-search.svg", "map-us.svg", "database.svg", "megaphone.svg",
  "phone.svg", "report.svg", "facebook.svg", "file.svg", "globalsearch.svg",
  "gmail.svg", "google-maps.svg", "checkplateform.svg", "locations.svg", "x.svg",
  "lostfoundservice.svg", "safari.png", "big-data.svg", "feedback.svg",
  "telegramme.svg", "yahoo.svg", "contacts.png", "mail-anonyme.svg",
  "manualcheck.svg", "datasearch.svg", "web.svg", "geolocalisation.svg",
].map((f) => `/images/icons/level3/${f}?v=${ASSET_VER}`);

/** Les trois crans de la jauge. L'ordre est celui de la piste, de gauche à droite. */
const STOPS = [
  {
    price: 0,
    label: "Free",
    title: "Published, not searched",
    icons: [] as string[],
    cta: "Continue",
    text: (
      <>
        <b className="font-bold text-green-800">Free listing:</b> your report waits in the public
        database. Nothing is filed, nobody is contacted.
      </>
    ),
  },
  {
    price: 12,
    label: "$12",
    title: "Searched automatically",
    icons: ICONS_AUTO,
    cta: "Continue — $12",
    text: (
      <>
        <b className="font-bold text-green-800">Automatic search:</b> AI search for 6 months, a loss
        report certificate, and stickers to print.
      </>
    ),
  },
  {
    price: 25,
    label: "$25",
    title: "Searched and announced",
    icons: ICONS_ACTIVE,
    cta: "Continue — $25",
    text: (
      <>
        <b className="font-bold text-green-800">Active search:</b> everything above. Plus the human
        part: filing with the lost-property service, outreach where you lost it, and your report
        distributed through the appropriate channels.
      </>
    ),
  },
] as const;

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
function Megaphone({ level, color }: { level: number; color: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth={1.9}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      style={{ width: [20, 26, 32][level], height: [20, 26, 32][level] }}
    >
      <path d="M3.2 9.6h3.4l6.6-4.4v13.6l-6.6-4.4H3.2z" fill={color} fillOpacity={0.18} />
      <path d="M6.3 14.4v3.2a1.6 1.6 0 0 0 3.2 0v-1.1" />
      {level > 0 && <path d="M16.6 9.2a4.8 4.8 0 0 1 0 5.6" />}
      {level > 1 && <path d="M19.3 6.6a9 9 0 0 1 0 10.8" />}
    </svg>
  );
}

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

  const [screen, setScreen] = useState<"plans" | "gauge">("plans");
  // Présélection : la formule complète, sauf arrivée par le lien de rattrapage.
  const [selectedPlan, setSelectedPlan] = useState<1 | 2 | 3 | 4>(
    petMode ? 4 : showAutoPlan ? 2 : 3
  );
  const [level, setLevel] = useState<0 | 1 | 2>(0);

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
  }, [screen]);

  const commit = (value: number) => {
    setFormData((prev: any) => ({
      ...prev,
      contribution: value,
      paymentRequired: value > 0,
    }));
    onNext();
  };

  const proceed = () => {
    // L'annonce gratuite ne part pas directement : on accuse réception, et on
    // laisse une dernière occasion de monter d'un cran.
    if (selectedPlan === 1) {
      setFormData((prev: any) => ({ ...prev, contribution: 0, paymentRequired: false }));
      setLevel(0);
      setScreen("gauge");
      return;
    }
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

  /* ─────────────────────────────── Écran 2 : jauge ───────────────────────── */

  if (screen === "gauge") {
    const stop = STOPS[level];
    const pct = level * 50;

    return (
      <section className="px-3 sm:px-4 md:px-6">
        <div className="mx-auto max-w-3xl">
          <h2 className="text-[21px] font-bold tracking-tight text-gray-900">We have your report</h2>
          <p className="mt-1.5 max-w-[62ch] text-[15px] text-gray-600">
            It is recorded under your reference and will be published. No search has started yet.
          </p>

          <div className="mt-6 overflow-hidden rounded-2xl border border-green-200 bg-white">
            <div
              className="flex min-h-[52px] items-center px-5 py-3"
              style={{ backgroundColor: LIGHT_GREEN_BG }}
            >
              <h3 className="text-[17.5px] font-semibold" style={{ color: DARK_GREEN }}>
                {stop.title}
              </h3>
            </div>

            <div className="px-5 pb-5 pt-4">
              {/* Ce que le cran met en mouvement. Vide au gratuit : rien n'est diffusé. */}
              <div className="flex min-h-[22px] flex-wrap gap-1.5 pb-1">
                {stop.icons.map((src) => (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img key={src} src={src} alt="" className="h-[18px] w-[18px] object-contain" />
                ))}
              </div>

              <div className="mx-6 mt-7 sm:mx-9">
                <div
                  className="relative h-[50px] cursor-pointer select-none"
                  onPointerDown={(e) => {
                    (e.target as HTMLElement).setPointerCapture?.(e.pointerId);
                    const r = e.currentTarget.getBoundingClientRect();
                    const p = Math.max(0, Math.min(1, (e.clientX - r.left) / r.width));
                    setLevel(Math.round(p * 2) as 0 | 1 | 2);
                  }}
                >
                  <div className="absolute left-0 right-0 top-[21px] h-2 rounded-full bg-gray-200" />
                  <div
                    className="absolute left-0 top-[21px] h-2 rounded-full transition-[width] duration-150"
                    style={{ width: `${pct}%`, backgroundColor: DARK_GREEN }}
                  />
                  {[0, 1, 2].map((j) => (
                    <div
                      key={j}
                      className="absolute top-[19px] h-3 w-3 -translate-x-1/2 rounded-full border-2"
                      style={{
                        left: `${j * 50}%`,
                        borderColor: j <= level ? DARK_GREEN : "#cbd5e1",
                        backgroundColor: j <= level ? DARK_GREEN : "#fff",
                      }}
                    />
                  ))}
                  <div
                    className="absolute top-1/2 flex -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border-2 bg-white shadow-sm transition-[left,width,height] duration-150"
                    style={{
                      left: `${pct}%`,
                      width: [30, 38, 46][level],
                      height: [30, 38, 46][level],
                      borderColor: level > 0 ? DARK_GREEN : "#cbd5e1",
                      backgroundColor: level > 0 ? DARK_GREEN : "#fff",
                    }}
                  >
                    <Megaphone level={level} color={level > 0 ? "#ffffff" : "#94a3b8"} />
                  </div>
                </div>

                <div className="mt-3.5 flex justify-between">
                  {STOPS.map((s, j) => (
                    <button
                      key={s.price}
                      type="button"
                      onClick={() => setLevel(j as 0 | 1 | 2)}
                      className={`text-[13px] font-semibold ${
                        j === level ? "text-[#1f6b3a]" : "text-gray-500 hover:text-gray-700"
                      }`}
                    >
                      {s.label}
                    </button>
                  ))}
                </div>
              </div>

              <p className="mt-5 min-h-[46px] text-[14.5px] leading-relaxed text-gray-600">
                {stop.text}
              </p>
            </div>
          </div>

          <p className="mt-4 flex items-center gap-2 text-sm text-gray-600">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={`/images/icons/secure.svg?v=${ASSET_VER}`} alt="" className="h-4 w-4" />
            One-time payment, never a subscription. Processed securely by Stripe.com, PCI DSS v4.0
            certified.
          </p>

          <div className="mt-4 flex items-center justify-between gap-3">
            <button
              type="button"
              onClick={() => setScreen("plans")}
              className="rounded-md border border-gray-300 px-4 py-2 text-gray-800 hover:bg-gray-50"
            >
              Back
            </button>
            <button
              type="button"
              onClick={() => commit(stop.price)}
              className="inline-flex items-center justify-center rounded-md bg-gradient-to-r from-[#26723e] to-[#2ea052] px-5 py-2.5 font-semibold text-white hover:from-[#226638] hover:to-[#279449]"
            >
              {stop.cta}
            </button>
          </div>
        </div>
      </section>
    );
  }

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
