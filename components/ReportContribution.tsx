"use client";

import { useMemo, useState, useEffect } from "react";

/**
 * ReportContribution.tsx — Free listing + Automatic search + Active search
 *
 * La version précédente est conservée telle quelle dans
 * components/ReportContribution.previous.tsx.bak : si celle-ci convertit moins
 * bien, il suffit de la renommer en .tsx pour revenir en arrière.
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
  /**
   * Rattrapage : n'affiche la formule automatique à 12 $ QUE si l'on arrive par
   * le lien proposé à ceux qui ont déjà choisi l'annonce gratuite. Elle n'est
   * jamais montrée dans le parcours normal, sinon elle cannibalise les 25 $ —
   * face à deux prix, on cherche la permission de dépenser moins.
   */
  showAutoPlan?: boolean;
};

const DARK_GREEN = "#1f6b3a";
const LIGHT_GREEN_BG = "#eaf8ef";
const ASSET_VER = "1";

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
      Number.isFinite(Number(amount ?? contribution))
        ? Number(amount ?? contribution)
        : 0,
    [amount, contribution]
  );

  const PRICE = { 1: 0, 2: 12, 3: 25, 4: 25 } as const;

  // Présélection : la formule payante. L'annonce gratuite reste accessible.
  const [selectedPlan, setSelectedPlan] = useState<1 | 2 | 3 | 4>(
    petMode ? 4 : showAutoPlan ? 2 : 3
  );

  useEffect(() => {
    // Retour en arrière depuis le paiement : on réaffiche ce qui avait été
    // choisi. L'ancienne version écrivait `effectiveAmount === 0 ? 3 : 3`, donc
    // l'annonce gratuite était systématiquement réécrasée par la formule payante.
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

  const proceed = () => {
    const contribution = PRICE[selectedPlan];
    setFormData((prev: any) => ({
      ...prev,
      contribution,
      paymentRequired: contribution > 0,
    }));
    onNext();
  };

  const isPaid = selectedPlan !== 1;
  const planLabel =
    selectedPlan === 4
      ? "Pet Priority search"
      : selectedPlan === 2
      ? "Automatic search"
      : selectedPlan === 3
      ? "Active search"
      : "the free listing";

  const cardClass = (active: boolean) =>
    `rounded-2xl border bg-white overflow-hidden shadow-sm transition cursor-pointer ${
      active
        ? "border-green-500 ring-[3px] ring-green-300/60 bg-green-50/40"
        : "border-green-200 hover:border-green-300"
    }`;

  // Vrai bouton radio : la carte entière reste cliquable, mais l'état est porté
  // par un input, donc accessible au clavier et aux lecteurs d'écran.
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

  return (
    <section className="px-3 sm:px-4 md:px-6">
      <div className="max-w-3xl mx-auto">
        <div className="flex items-center justify-center gap-2 text-gray-700 mb-3">
          <img
            src={`/images/levels.svg?v=${ASSET_VER}`}
            alt=""
            width={26}
            height={26}
            className="opacity-90"
            style={{
              filter:
                "invert(48%) sepia(38%) saturate(845%) hue-rotate(80deg) brightness(92%) contrast(90%)",
            }}
          />
          <h2 className="text-2xl font-bold text-gray-700 text-center">
            How should we handle your report?
          </h2>
        </div>

        {/* Un seul encadré d'introduction. Il y en avait deux empilés, gris sur
            blanc, avant même la première offre : l'écran commençait par un pavé. */}
        <div className="mb-4 rounded-2xl border border-gray-200 bg-gray-50 px-5 py-4">
          {selectedPlan === 1 ? (
            <p className="text-[14px] leading-relaxed text-gray-700">
              A free listing stays online and waits to be found. Nothing is sent, contacted or
              searched.
            </p>
          ) : selectedPlan === 2 ? (
            <p className="text-[14px] leading-relaxed text-gray-700">
              With <b className="text-gray-900">Automatic search</b>, no one contacts anyone on your
              behalf, but the web is scanned on your keywords for six months and you keep your
              documents.
            </p>
          ) : (
            <p className="text-[14px] leading-relaxed text-gray-700">
              Getting something back is rarely about luck. It is about reaching the right desk before
              the item moves on, and being findable when someone tries to return it.{" "}
              <b className="text-gray-900">
                That is what the $25 pays for: the outreach, and twelve months of being findable.
              </b>
            </p>
          )}
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
                  className="text-xl font-semibold flex flex-wrap items-center gap-2"
                  style={{ color: DARK_GREEN }}
                >
                  Pet Priority search
                  <span className="text-[11px] font-semibold text-[#1f6b3a] bg-green-100 border border-green-200 px-2 py-0.5 rounded-full">
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

                <div className="mt-4 flex items-baseline gap-2.5 border-t border-gray-100 pt-3">
                  <span className="text-[22px] font-bold" style={{ color: DARK_GREEN }}>
                    $25
                  </span>
                  <span className="text-[13px] text-gray-600">
                    one-time payment, no account, no subscription
                  </span>
                </div>
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
                <img
                  src={`/images/icons/max.svg?v=${ASSET_VER}`}
                  alt=""
                  className="w-5 h-5"
                />
                <h3
                  className="text-xl font-semibold flex flex-wrap items-center gap-2"
                  style={{ color: DARK_GREEN }}
                >
                  Active search
                  <span className="text-[11px] font-semibold text-[#1f6b3a] bg-green-100 border border-green-200 px-2 py-0.5 rounded-full">
                    🏅 Recommended
                  </span>
                </h3>
              </div>

              <div className="px-5 py-4">
                {/* La bande de 32 icônes a été retirée : non légendées et minuscules,
                    elles se lisaient comme du remplissage sur une page où l'enjeu
                    est la confiance, et laissaient entendre des partenariats. */}
                {/* Six paragraphes empilés faisaient un mur de texte. Deux
                    colonnes, un titre court et une ligne : même information,
                    lisible d'un regard. Le détail complet est dans les CGV. */}
                <ul className="grid gap-x-6 gap-y-3.5 sm:grid-cols-2">
                  {[
                    [
                      "Filed with the lost-property service",
                      "Usually the local police or city office, as soon as we hold what they require.",
                    ],
                    [
                      "The right places contacted",
                      "Transit, hotel, venue, airport, taxi, nearby shops — chosen from where you lost it.",
                    ],
                    [
                      "A visual notice published",
                      "On social media and in local groups, with an anonymous relay address for finders.",
                    ],
                    [
                      "12 months of web monitoring",
                      "Daily the first week, then weekly, then monthly. Every credible match read by a person.",
                    ],
                    [
                      "A loss report certificate",
                      "Dated, downloadable any time. Not an official document, and not a police report.",
                    ],
                    [
                      "A printable QR sticker sheet",
                      "For your everyday belongings. Each code routes a finder to your relay address.",
                    ],
                  ].map(([title, line]) => (
                    <li key={title} className="flex items-start gap-2.5">
                      <Check className="mt-[3px] h-[17px] w-[17px] flex-none text-green-500" />
                      <span>
                        <span className="block text-[14px] font-semibold text-gray-900">{title}</span>
                        <span className="mt-0.5 block text-[13px] leading-relaxed text-gray-600">
                          {line}
                        </span>
                      </span>
                    </li>
                  ))}
                </ul>

                <div className="mt-4 flex items-baseline gap-2.5 border-t border-gray-100 pt-3">
                  <span className="text-[22px] font-bold" style={{ color: DARK_GREEN }}>
                    $25
                  </span>
                  <span className="text-[13px] text-gray-600">
                    one-time payment, no account, no subscription
                  </span>
                </div>

                {/* La seule objection qui compte à cet instant : « et si vous ne le
                    retrouvez pas ? ». Trois livrables sur six sont acquis quoi
                    qu'il arrive — on le dit, sans parler d'argent. */}
                <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3">
                  <div className="text-[12.5px] font-bold uppercase tracking-wide text-amber-800">
                    Yours either way
                  </div>
                  <p className="mt-1 text-[13.5px] leading-relaxed text-amber-900">
                    Whether or not your item turns up, you keep the loss report certificate, the QR
                    sticker sheet, and a written record of every desk we contacted on your case.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* --- Automatic search (12 $), uniquement en rattrapage --- */}
          {showAutoPlan && !petMode && (
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
                <p className="mb-3 text-[13.5px] leading-relaxed text-gray-600">
                  The automated part of our work, without the human outreach: nobody contacts a
                  police desk or a hotel for you.
                </p>
                <ul className="space-y-3">
                  <li className="flex items-start gap-3">
                    <Check className="mt-0.5 h-[19px] w-[19px] flex-none text-green-500" />
                    <span className="text-[14.5px] text-gray-800">
                      <strong>An AI search engine scans the web for 6 months</strong> on your
                      item&rsquo;s keywords: every day for the first week, then once a week, then
                      once a month. Every credible match is reviewed by a team member before it
                      reaches you.
                    </span>
                  </li>
                  <li className="flex items-start gap-3">
                    <Check className="mt-0.5 h-[19px] w-[19px] flex-none text-green-500" />
                    <span className="text-[14.5px] text-gray-800">
                      <strong>A loss report certificate</strong>, downloadable from your case page at
                      any time. It records your declaration and its date. It is not an official
                      document and does not replace a police report.
                    </span>
                  </li>
                  <li className="flex items-start gap-3">
                    <Check className="mt-0.5 h-[19px] w-[19px] flex-none text-green-500" />
                    <span className="text-[14.5px] text-gray-800">
                      <strong>A printable sheet of QR stickers</strong> for your everyday belongings.
                      Each code routes a finder to your anonymous relay address.
                    </span>
                  </li>
                </ul>

                <div className="mt-4 flex items-baseline gap-2.5 border-t border-gray-100 pt-3">
                  <span className="text-[22px] font-bold" style={{ color: DARK_GREEN }}>
                    $12
                  </span>
                  <span className="text-[13px] text-gray-600">
                    one-time payment, no account, no subscription
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* --- Annonce gratuite --- */}
          <div className={cardClass(selectedPlan === 1)} onClick={() => setSelectedPlan(1)}>
            <div
              className="flex items-center gap-3 px-5 py-3"
              style={{ backgroundColor: LIGHT_GREEN_BG }}
            >
              <Radio plan={1} label="Free listing, $0" />
              <img
                src={`/images/icons/search.svg?v=${ASSET_VER}`}
                alt=""
                className="w-5 h-5"
              />
              <h3 className="text-xl font-semibold" style={{ color: DARK_GREEN }}>
                Free listing
              </h3>
            </div>

            <div className="px-5 py-4">
              <ul className="space-y-3">
                <li className="flex items-start gap-3">
                  <Check className="mt-0.5 h-[19px] w-[19px] flex-none text-green-500" />
                  <span className="text-[14.5px] text-gray-800">
                    Your report is published in our public database,{" "}
                    <em>because every report counts</em>, and stays visible to finders. No outreach,
                    no filing, no active match search: the listing waits for someone to come across
                    it.
                  </span>
                </li>
              </ul>

              <div className="mt-4 flex items-baseline gap-2.5 border-t border-gray-100 pt-3">
                <span className="text-[22px] font-bold" style={{ color: DARK_GREEN }}>
                  $0
                </span>
                <span className="text-[13px] text-gray-600">no card required</span>
              </div>
            </div>
          </div>

          {/* Contrôles */}
          <div className="mt-2 flex items-center justify-between gap-3">
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
              className="inline-flex items-center justify-center rounded-md bg-gradient-to-r from-[#26723e] to-[#2ea052] px-5 py-2.5 font-semibold text-white hover:from-[#226638] hover:to-[#279449]"
            >
              {isPaid ? `Continue with ${planLabel} →` : "Continue with the free listing →"}
            </button>
          </div>

          <p className="mt-6 ml-1 flex items-center gap-2 text-sm text-gray-600">
            <img
              src={`/images/icons/secure.svg?v=${ASSET_VER}`}
              alt=""
              className="w-4 h-4"
            />
            One-time payment, never a subscription. Processed securely by Stripe.com, PCI DSS v4.0
            certified.
          </p>
        </div>
      </div>
    </section>
  );
}
