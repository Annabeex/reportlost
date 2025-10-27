"use client";

import Image from "next/image";
import { formatCityWithState } from "@/lib/locationUtils";
import { useEffect } from "react";

interface Props {
  formData: any;
  onNext: () => void;
  onBack: () => void;
  fullScreen?: boolean;
}

export default function WhatHappensNext({
  formData,
  onNext,
  onBack,
  fullScreen,
}: Props) {
  const cityDisplay = formatCityWithState(formData.city, formData.state_id);

  const placeLabel =
    (formData?.transport_type_other || "").trim() ||
    (formData?.transport_type || "").trim() ||
    (formData?.place_type_other || "").trim() ||
    (formData?.place_type || "").trim() ||
    "unspecified place";

  const btnGreen =
    "bg-gradient-to-r from-[#26723e] to-[#2ea052] hover:from-[#226638] hover:to-[#279449] text-white font-semibold px-6 py-2 rounded shadow inline-flex items-center justify-center";

  // ✅ Scroll en haut au montage (utile sur mobile)
  useEffect(() => {
    if (typeof window !== "undefined") {
      window.scrollTo({ top: 0, behavior: "instant" as ScrollBehavior });
    }
  }, []);

  const handleContinue = () => {
    if (typeof window !== "undefined") {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
    onNext();
  };

  const LIGHT_GREEN_BG = "#f3fdf5"; // même vert doux que sur les autres pages

  return (
    <section
      className={`bg-gray-50 ${
        fullScreen
          ? "w-full min-h-screen px-3 sm:px-6 md:px-8 py-8 sm:py-10 md:py-12"
          : "px-3 sm:px-6 md:px-8 py-6"
      } mx-auto`}
    >
      <div className="max-w-3xl mx-auto space-y-8 sm:space-y-10">
        {/* Header */}
        <div className="text-center space-y-2">
          <h2 className="text-3xl font-bold text-gray-900">What happens next?</h2>
          {/*
          --------------------------------------------------------------------
          CODE BROUILLON — PARAGRAPHE INTRO (masqué temporairement)
          --------------------------------------------------------------------
          <p className="text-gray-700 text-lg">
            To begin the search process, please review the details below and
            confirm your request.
          </p>
          */}
        </div>

        {/* ✅ Bandeau d’état ajouté */}
        <div
          className="rounded-lg border border-yellow-200 bg-yellow-50 px-4 py-3 text-sm text-yellow-900"
          role="status"
          aria-live="polite"
        >
          <strong>Step saved.</strong> Your report is not finalized yet — please review this page and
          continue to confirm.
        </div>

        {/*
        --------------------------------------------------------------------
        CODE BROUILLON — SECTION "Lost item summary" (masquée temporairement)
        --------------------------------------------------------------------
        <div className="space-y-6">
          <div
            className="rounded-xl border border-[#d6e7e1] py-3 text-center"
            style={{ backgroundColor: LIGHT_GREEN_BG }}
          >
            <h3 className="text-2xl font-semibold text-[#0f2b1c]">
              Lost item summary
            </h3>
          </div>

          <div className="flex flex-col md:flex-row gap-6 items-start">
            <ul className="space-y-3 text-gray-800 text-base flex-1">
              <li>
                <strong>
                  {formData.title
                    ? `${formData.title} lost at ${placeLabel}`
                    : `Item lost at ${placeLabel}`}
                </strong>
              </li>

              <li>
                <strong>Description:</strong> {formData.description || "—"}
              </li>

              <li>
                <strong>Date of loss:</strong> {formData.date || "—"}
                {formData.time_slot ? ` (${formData.time_slot})` : ""}
              </li>

              <li>
                <strong>City:</strong>{" "}
                {cityDisplay ||
                  [formData.city, formData.state_id].filter(Boolean).join(" ") ||
                  "—"}
              </li>

              {formData.circumstances && (
                <li>
                  <strong>ℹ️ Circumstances of loss:</strong>{" "}
                  {formData.circumstances}
                </li>
              )}
            </ul>

            {formData.object_photo && (
              <div className="flex-shrink-0 max-w-[400px] w-full">
                <p className="font-medium text-gray-800 mb-2">Uploaded image:</p>
                <div className="border rounded shadow overflow-hidden bg-white">
                  <Image
                    src={formData.object_photo}
                    alt="Lost item"
                    width={400}
                    height={300}
                    style={{
                      objectFit: "contain",
                      width: "100%",
                      height: "auto",
                    }}
                  />
                </div>
              </div>
            )}
          </div>
        </div>
        */}

        {/* Process explanation */}
        <div className="space-y-3 sm:space-y-4 text-sm text-gray-700">
          {[
            {
              svg: "🗂️",
              title: "Manual verification",
              desc: "Our team reviews your report to ensure all necessary details are included.",
            },
            {
              svg: "🔍",
              title: "Search efforts begin",
              desc: "We compare your report to public and private lost & found databases.",
            },
            {
              svg: "📤",
              title: "Targeted transmission",
              desc: "If relevant, we forward your report to institutions like transit, hotels, or authorities.",
            },
            {
              svg: "📧",
              title: "Anonymous publication",
              desc: "Your report is posted without personal data. A special email address is created for replies.",
            },
            {
              svg: "📣",
              title: "Optimized visibility",
              desc: "We ensure your report can be indexed on Google and shared on relevant networks.",
            },
            {
              svg: "🧑‍💻",
              title: "Follow-up",
              desc: "You’ll receive automatic notifications if a potential match is detected.",
            },
            {
              svg: "🔒",
              title: "Data protection",
              desc: "Your data is encrypted and processed according to strict privacy standards.",
            },
          ].map(({ svg, title, desc }, i) => (
            <div
              key={i}
              className="flex items-start gap-3 sm:gap-4 bg-white p-3 sm:p-4 rounded-lg shadow-sm"
            >
              <div className="text-2xl mt-1">{svg}</div>
              <div>
                <p className="font-semibold text-gray-800">{title}</p>
                <p className="text-gray-600">{desc}</p>
              </div>
            </div>
          ))}
        </div>

        <hr className="my-10 sm:my-12" />

        {/* Navigation + CTA */}
        <div className="flex justify-between items-center gap-4 pt-4 sm:pt-6">
          <button
            onClick={onBack}
            className="bg-gray-300 hover:bg-gray-400 text-gray-800 font-semibold px-5 py-2 rounded"
          >
            Back
          </button>
          {/* ✅ libellé ajusté */}
          <button onClick={handleContinue} className={btnGreen}>
            Confirm & continue →
          </button>
        </div>
      </div>
    </section>
  );
}
